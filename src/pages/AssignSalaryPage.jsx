import React, { useState, useEffect, useMemo } from 'react';
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
        setAssignedComponents(data ? data.components : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchEmployeeProfile();
  }, [selectedEmployeeId, backendUrl]);

  // --- CRITICAL: Calculate the basic salary dynamically from the components list ---
  // useMemo ensures this only recalculates when the assignedComponents array or allComponents array changes.
  const basicSalary = useMemo(() => {
    const basicCompMaster = allComponents.find(c => c.name.toLowerCase().includes('basic'));
    if (!basicCompMaster) return 0;

    const assignedBasic = assignedComponents.find(c => c.component === basicCompMaster._id);
    if (assignedBasic && assignedBasic.calculationType === 'Fixed') {
      return parseFloat(assignedBasic.value) || 0;
    }
    return 0;
  }, [assignedComponents, allComponents]);

  // Core logic for handling changes in the dynamic checklist UI
  const handleComponentChange = (masterCompId, field, value) => {
    const isChecked = field === 'checked' ? value : assignedComponents.some(c => c.component === masterCompId);
    
    if (isChecked) {
      const existing = assignedComponents.find(c => c.component === masterCompId);
      if (existing) {
        const updated = assignedComponents.map(c => 
          c.component === masterCompId ? { ...c, [field]: value } : c
        );
        setAssignedComponents(updated);
      } else {
        const masterComp = allComponents.find(c => c._id === masterCompId);
        const isBasic = masterComp.name.toLowerCase().includes('basic');
        const newComponent = {
          component: masterCompId,
          calculationType: isBasic ? 'Fixed' : 'Percentage', // Default 'Basic' to Fixed
          value: ''
        };
        setAssignedComponents([...assignedComponents, newComponent]);
      }
    } else {
      setAssignedComponents(assignedComponents.filter(c => c.component !== masterCompId));
    }
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
      const response = await fetch(`${backendUrl}/api/employee-salary-profiles/${selectedEmployeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ components: assignedComponents })
      });
      if (!response.ok) throw new Error((await response.json()).error);
      setMessage('Salary profile saved successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Helper function to calculate the amount for the read-only display field
  const calculateDisplayAmount = (component) => {
    if (component.calculationType === 'Fixed') {
      return parseFloat(component.value) || 0;
    }
    if (component.calculationType === 'Percentage') {
      const percent = parseFloat(component.value) || 0;
      return (basicSalary * percent) / 100;
    }
    return 0;
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
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Salary Components Checklist</h3>
              <p className="text-sm text-gray-500 mt-1">First, check and define the "Basic Salary". This will be the base for all percentage-based calculations.</p>
            </div>

            <div className="space-y-4">
              {allComponents.map(masterComp => {
                const assignedData = assignedComponents.find(c => c.component === masterComp._id);
                const isChecked = !!assignedData;
                const isBasic = masterComp.name.toLowerCase().includes('basic');

                return (
                  <div key={masterComp._id} className={`p-4 rounded-lg border transition-colors ${isChecked ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}>
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={(e) => handleComponentChange(masterComp._id, 'checked', e.target.checked)}
                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="ml-3 flex items-center gap-3">
                        <span className="font-medium text-gray-800">{masterComp.name}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${masterComp.type === 'Earning' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {masterComp.type}
                        </span>
                      </label>
                    </div>

                    {isChecked && (
                      <div className={`grid grid-cols-1 ${isBasic ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-4 mt-4 pl-8 animate-fadeIn`}>
                        {isBasic ? (
                            <>
                                <input type="hidden" value={assignedData.calculationType = 'Fixed'} />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fixed Amount (₹)</label>
                                    <input 
                                        type="number"
                                        value={assignedData.value}
                                        onChange={(e) => handleComponentChange(masterComp._id, 'value', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                        required
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Calculation Type</label>
                                    <select 
                                        value={assignedData.calculationType}
                                        onChange={(e) => handleComponentChange(masterComp._id, 'calculationType', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    >
                                        <option value="Fixed">Fixed Amount</option>
                                        <option value="Percentage">Percentage</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{assignedData.calculationType === 'Percentage' ? 'Value (%)' : 'Amount (₹)'}</label>
                                    <input 
                                        type="number"
                                        step="0.01"
                                        value={assignedData.value}
                                        onChange={(e) => handleComponentChange(masterComp._id, 'value', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                        required
                                    />
                                </div>
                            </>
                        )}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Calculated Amount (₹)</label>
                          <input 
                            type="text"
                            value={calculateDisplayAmount(assignedData).toFixed(2)}
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                            readOnly
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          <div className="flex justify-end gap-3 bg-gray-50 p-4 rounded-b-lg border-t">
            <button type="submit" disabled={saving || loadingProfile} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-semibold disabled:bg-blue-300">
              {saving ? 'Saving...' : 'Save Salary Profile'}
            </button>
          </div>
        </form>
      )}

      {error && (
        <div className="p-4 mt-4 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center gap-3">
            <ExclamationTriangleIcon className="h-5 w-5" />
            <span>{error}</span>
        </div>
      )}
      {message && (
        <div className="p-4 mt-4 rounded-lg bg-green-50 border border-green-200 text-green-700 flex items-center gap-3">
            <CheckCircleIcon className="h-5 w-5" />
            <span>{message}</span>
        </div>
      )}
    </div>
  );
};

export default AssignSalaryPage;