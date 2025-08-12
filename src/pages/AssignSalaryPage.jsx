import React, {useState, useEffect, useMemo } from 'react';
import { useConfig } from '../context/ConfigContext';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const AssignSalaryPage = () => {
  const { backendUrl } = useConfig();
  
  // Data state
  const [employees, setEmployees] = useState([]);
  const [allComponents, setAllComponents] = useState([]); // Master list from the library

  // Selection and Form State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  // The main form state is just an array of the components assigned to the selected employee.
  const [assignedComponents, setAssignedComponents] = useState([]);
  
  // UI State
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Fetch initial data: employees and the master component library
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [employeesRes, componentsRes] = await Promise.all([
          fetch(`${backendUrl}/api/employees`, { credentials: 'include' }),
          fetch(`${backendUrl}/api/salary-components`, { credentials: 'include' })
        ]);
        if (employeesRes.ok) setEmployees(await employeesRes.json());
        if (componentsRes.ok) setAllComponents(await componentsRes.json());
      } catch (err) {
        setError('Failed to load initial data. Please refresh the page.');
        console.error(err);
      }
    };
    fetchInitialData();
  }, [backendUrl]);

  // This effect runs whenever a new employee is selected from the dropdown
  useEffect(() => {
    if (!selectedEmployeeId) {
      setAssignedComponents([]);
      return;
    }
    const fetchEmployeeProfile = async () => {
      setLoadingProfile(true);
      setError('');
      setMessage('');
      try {
        const res = await fetch(`${backendUrl}/api/employee-salary-profiles/${selectedEmployeeId}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch salary profile for this employee.');
        const data = await res.json();
        // The backend sends populated components, but we only need the ID for our state.
        const sanitizedComponents = data ? data.components.map(c => ({
            component: c.component._id, // Store only the ID
            calculationType: c.calculationType,
            value: c.value,
            days: c.days
        })) : [];
        setAssignedComponents(sanitizedComponents);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchEmployeeProfile();
  }, [selectedEmployeeId, backendUrl]);

  // CRITICAL: Dynamically calculate the basic salary from the components list
  const basicSalary = useMemo(() => {
    const basicCompMaster = allComponents.find(c => c.name.toLowerCase().includes('basic'));
    if (!basicCompMaster) return 0;
    const assignedBasic = assignedComponents.find(c => c.component === basicCompMaster._id);
    if (assignedBasic && assignedBasic.calculationType === 'Fixed') {
      return parseFloat(assignedBasic.value) || 0;
    }
    return 0;
  }, [assignedComponents, allComponents]);
  
  // Sort the master components to always show "Basic Salary" first
  const sortedComponents = useMemo(() => {
    return [...allComponents].sort((a, b) => {
      const aIsBasic = a.name.toLowerCase().includes('basic');
      const bIsBasic = b.name.toLowerCase().includes('basic');
      if (aIsBasic) return -1;
      if (bIsBasic) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [allComponents]);

  // Core logic for handling changes in the dynamic table UI
  const handleComponentChange = (masterCompId, field, value) => {
    setAssignedComponents(currentAssigned => {
      const isChecked = field === 'checked' ? value : currentAssigned.some(c => c.component === masterCompId);
      const existingIndex = currentAssigned.findIndex(c => c.component === masterCompId);
      
      if (isChecked) {
        if (existingIndex > -1) {
          const updated = [...currentAssigned];
          updated[existingIndex] = { ...updated[existingIndex], [field]: value };
          return updated;
        } else {
          const masterComp = allComponents.find(c => c._id === masterCompId);
          const isBasic = masterComp.name.toLowerCase().includes('basic');
          const newComponent = { component: masterCompId, calculationType: isBasic ? 'Fixed' : 'Percentage', value: '', days: false };
          return [...currentAssigned, newComponent];
        }
      } else {
        return currentAssigned.filter(c => c.component !== masterCompId);
      }
    });
  };

  // Helper function to calculate amount for both display and saving
  const calculateAmount = (component) => {
    if (!component) return 0;
    if (component.calculationType === 'Fixed') {
      return parseFloat(component.value) || 0;
    }
    if (component.calculationType === 'Percentage') {
      const percent = parseFloat(component.value) || 0;
      return (basicSalary * percent) / 100;
    }
    return 0;
  };
  
  // Handler for saving the entire profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      if (basicSalary <= 0) {
        throw new Error('You must assign a "Basic Salary" component with a fixed value greater than zero.');
      }

      // --- FINAL FIX: Data Sanitization and Calculation ---
      // This maps over the assigned components and adds the calculated 'amount' to each one before sending.
      const payloadComponents = assignedComponents.map(comp => ({
        component: comp.component,
        calculationType: comp.calculationType,
        value: comp.value,
        days: comp.days || false,
        amount: parseFloat(calculateAmount(comp).toFixed(2)) // <-- CRITICAL: Add the calculated amount
      }));

      const response = await fetch(`${backendUrl}/api/employee-salary-profiles/${selectedEmployeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        // We send the new payload that includes the 'amount' field.
        body: JSON.stringify({
          basicSalary: basicSalary, // Send the calculated basic salary
          components: payloadComponents
        })
      });

      if (!response.ok) throw new Error((await response.json()).error);
      setMessage('Salary profile saved successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Assign Salary Components</h1>
        <p className="mt-1 text-sm text-gray-500">Select an employee to manage their salary structure.</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Employee</label>
        <select value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)} className="w-full md:w-1/2 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
          <option value="">-- Choose an Employee to Configure --</option>
          {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name} ({emp.empId})</option>)}
        </select>
      </div>

      {selectedEmployeeId && (
        loadingProfile ? <div className="text-center p-8">Loading Profile...</div> :
        <form onSubmit={handleSaveProfile} className="bg-white rounded-lg shadow animate-fadeIn">
          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Salary Components</h3>
              <p className="text-sm text-gray-500 mt-1">First, assign and define the "Basic Salary". This will serve as the base for all percentage-based calculations.</p>
            </div>
            
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-12 px-4 py-3"></th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Component</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Calculation Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pro-rated</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Calculated Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedComponents.map(masterComp => {
                    const assignedData = assignedComponents.find(c => c.component === masterComp._id);
                    const isChecked = !!assignedData;
                    const isBasic = masterComp.name.toLowerCase().includes('basic');

                    return (
                      <tr key={masterComp._id} className={isChecked ? 'bg-blue-50' : ''}>
                        <td className="px-4 py-3">
                          <input type="checkbox" checked={isChecked} onChange={(e) => handleComponentChange(masterComp._id, 'checked', e.target.checked)} className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-medium text-gray-800">{masterComp.name}</span>
                          <span className={`ml-2 text-xs font-semibold ${masterComp.type === 'Earning' ? 'text-green-600' : 'text-red-600'}`}>({masterComp.type})</span>
                        </td>
                        <td className="px-4 py-3">
                          {isChecked && (
                            isBasic ? <span className="text-sm text-gray-500 italic">Fixed</span> :
                            <select value={assignedData.calculationType} onChange={(e) => handleComponentChange(masterComp._id, 'calculationType', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
                              <option value="Fixed">Fixed</option>
                              <option value="Percentage">Percentage</option>
                            </select>
                          )}
                        </td>
                        <td className="px-4 py-3">
                           {isChecked && (
                            <input type="number" step="0.01" value={assignedData.value} onChange={(e) => handleComponentChange(masterComp._id, 'value', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" required />
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                           {isChecked && (
                            <input type="checkbox" checked={assignedData.days || false} onChange={(e) => handleComponentChange(masterComp._id, 'days', e.target.checked)} className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {isChecked && (
                            <span className="font-medium text-gray-700">₹ {calculateAmount(assignedData).toFixed(2)}</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex justify-end gap-3 bg-gray-50 p-4 rounded-b-lg border-t">
            <button type="submit" disabled={saving || loadingProfile} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-semibold disabled:bg-blue-300">
              {saving ? 'Saving...' : 'Save Salary Profile'}
            </button>
          </div>
        </form>
      )}

      {error && <div className="p-4 mt-4 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center gap-3"><ExclamationTriangleIcon className="h-5 w-5" /><span>{error}</span></div>}
      {message && <div className="p-4 mt-4 rounded-lg bg-green-50 border border-green-200 text-green-700 flex items-center gap-3"><CheckCircleIcon className="h-5 w-5" /><span>{message}</span></div>}
    </div>
  );
};

export default AssignSalaryPage;