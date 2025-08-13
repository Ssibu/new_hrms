import React, { useState, useEffect, useCallback } from 'react';
import { useConfig } from '../context/ConfigContext';
import { CheckCircleIcon, ExclamationTriangleIcon, CalculatorIcon } from '@heroicons/react/24/outline';

const AssignSalaryPage = () => {
  const { backendUrl } = useConfig();

  // Master Data
  const [employees, setEmployees] = useState([]);
  const [allComponents, setAllComponents] = useState([]);

  // UI & Form State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [assignedComponents, setAssignedComponents] = useState([]);
  const [loading, setLoading] = useState(false);
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
        if (employeesRes.ok) {
          const empData = await employeesRes.json();
          setEmployees(empData.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
        }
        if (componentsRes.ok) {
            const compData = await componentsRes.json();
            setAllComponents(compData.sort((a,b) => {
                if (a.name.toLowerCase().includes('basic')) return -1;
                if (b.name.toLowerCase().includes('basic')) return 1;
                if (a.type !== b.type) return a.type.localeCompare(b.type);
                return a.name.localeCompare(b.name);
            }));
        }
      } catch (err) {
        setError('Failed to load initial data. Please refresh the page.');
      }
    };
    fetchInitialData();
  }, [backendUrl]);

  // Fetch employee's existing profile when selected
  useEffect(() => {
    if (!selectedEmployeeId) {
      setAssignedComponents([]);
      setMessage('');
      setError('');
      return;
    }
    const fetchEmployeeProfile = async () => {
      setLoading(true);
      setError('');
      setMessage('');
      try {
        const res = await fetch(`${backendUrl}/api/employee-salary-profiles/${selectedEmployeeId}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch salary profile.');
        const data = await res.json();
        
        if (data && data.components) {
          const sanitizedProfile = data.components.map(c => ({
            componentId: c.component._id,
            calculationType: c.calculationType,
            value: c.value,
            percentageOf: c.percentageOf || [],
            amount: c.amount,
          }));
          setAssignedComponents(sanitizedProfile);
        } else {
          setAssignedComponents([]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployeeProfile();
  }, [selectedEmployeeId, backendUrl]);
  
  const calculateAndSetProfile = useCallback((profile) => {
    const MAX_ITERATIONS = 10;
    let iterations = 0;
    let changed = true;
    
    const newProfile = profile.map(p => ({ ...p, amount: p.calculationType === 'Fixed' ? Number(p.value) || 0 : 0 }));
    const amountMap = new Map(newProfile.filter(p => p.calculationType === 'Fixed').map(p => [p.componentId, p.amount]));

    while (changed && iterations < MAX_ITERATIONS) {
      changed = false;
      iterations++;

      newProfile.forEach(comp => {
        if (comp.calculationType === 'Percentage' && !amountMap.has(comp.componentId)) {
          const baseComponents = comp.percentageOf;
          const areAllBaseComponentsCalculated = baseComponents.every(id => amountMap.has(id));

          if (areAllBaseComponentsCalculated) {
            const baseAmount = baseComponents.reduce((sum, id) => sum + (amountMap.get(id) || 0), 0);
            const percentageValue = Number(comp.value) || 0;
            const calculatedAmount = (baseAmount * percentageValue) / 100;
            
            comp.amount = calculatedAmount;
            amountMap.set(comp.componentId, calculatedAmount);
            changed = true;
          }
        }
      });
    }

    if (iterations === MAX_ITERATIONS && newProfile.some(p => !amountMap.has(p.componentId))) {
      setError("Calculation Error: Check for circular dependencies (e.g., A depends on B, and B depends on A).");
    }

    setAssignedComponents(newProfile);
  }, [setError]);

  const handleCheckboxChange = (masterCompId, isChecked) => {
    let updatedProfile;
    if (isChecked) {
      const masterComp = allComponents.find(c => c._id === masterCompId);
      const isBasic = masterComp.name.toLowerCase().includes('basic');
      const newComponent = {
        componentId: masterCompId,
        calculationType: isBasic ? 'Fixed' : 'Percentage',
        value: 0,
        percentageOf: [],
        amount: 0,
      };
      updatedProfile = [...assignedComponents, newComponent];
    } else {
      updatedProfile = assignedComponents
        .filter(c => c.componentId !== masterCompId)
        .map(c => ({
            ...c,
            percentageOf: c.percentageOf.filter(depId => depId !== masterCompId)
        }));
    }
    calculateAndSetProfile(updatedProfile);
  };
  
  const handleFieldChange = (componentId, field, value) => {
      const updatedProfile = assignedComponents.map(c => {
          if (c.componentId === componentId) {
              const newComp = { ...c, [field]: value };
              if (field === 'calculationType' && value === 'Fixed') {
                  newComp.percentageOf = [];
              }
              return newComp;
          }
          return c;
      });
      calculateAndSetProfile(updatedProfile);
  };

  const handlePercentageOfChange = (componentId, dependencyId, isChecked) => {
    const updatedProfile = assignedComponents.map(c => {
        if (c.componentId === componentId) {
            const currentDeps = c.percentageOf || [];
            const newDeps = isChecked 
                ? [...currentDeps, dependencyId]
                : currentDeps.filter(id => id !== dependencyId);
            return { ...c, percentageOf: newDeps };
        }
        return c;
    });
    calculateAndSetProfile(updatedProfile);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
        setError('No employee selected.');
        return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const payload = {
        components: assignedComponents.map(c => ({
          component: c.componentId,
          calculationType: c.calculationType,
          value: Number(c.value) || 0,
          percentageOf: c.percentageOf,
          amount: Number(c.amount.toFixed(2))
        }))
      };

      const response = await fetch(`${backendUrl}/api/employee-salary-profiles/${selectedEmployeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to save profile.');
      
      setMessage(result.message || 'Salary profile saved successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Assign Salary Profile</h1>
        <p className="mt-1 text-sm text-gray-500">Select an employee to create or manage their salary structure.</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <label htmlFor="employee-select" className="block text-sm font-medium text-gray-700 mb-1">Select Employee</label>
        <select id="employee-select" value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)} className="w-full md:w-1/2 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
          <option value="">-- Choose an Employee --</option>
          {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name} ({emp.empId})</option>)}
        </select>
      </div>

      {selectedEmployeeId && (
        loading ? <div className="text-center p-8">Loading Profile...</div> :
        <form onSubmit={handleSaveProfile} className="bg-white rounded-lg shadow animate-fadeIn">
          <div className="p-6 space-y-4">
            {error && <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center gap-3"><ExclamationTriangleIcon className="h-5 w-5" /><span>{error}</span></div>}
            {message && <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 flex items-center gap-3"><CheckCircleIcon className="h-5 w-5" /><span>{message}</span></div>}

            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 w-12 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Use</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calculation Rule</th>
                    {/* --- NEW COLUMN --- */}
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage Of</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allComponents.length === 0 ? (
                    <tr><td colSpan="5" className="text-center p-8 text-gray-500"><CalculatorIcon className="mx-auto h-10 w-10 text-gray-400" />No salary components found in library.</td></tr>
                  ) : (
                    allComponents.map(masterComp => {
                      const assignedData = assignedComponents.find(c => c.componentId === masterComp._id);
                      const isAssigned = !!assignedData;
                      const potentialDeps = assignedComponents.filter(c => c.componentId !== masterComp._id);

                      return (
                        <tr key={masterComp._id} className={`${isAssigned ? 'bg-blue-50' : 'bg-white'} align-top transition-colors duration-200`}>
                          <td className="p-3 text-center">
                              <input type="checkbox" checked={isAssigned} onChange={(e) => handleCheckboxChange(masterComp._id, e.target.checked)} className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          </td>
                          <td className="p-3 whitespace-nowrap">
                              <p className="font-bold text-gray-800">{masterComp.name}</p>
                              <p className={`text-xs font-semibold ${masterComp.type === 'Earning' ? 'text-green-700' : 'text-red-700'}`}>{masterComp.type}</p>
                              <p className={`text-xs mt-1 ${masterComp.isProRata ? 'text-blue-600' : 'text-gray-500'}`}>{masterComp.isProRata ? 'Pro-Rata Eligible' : 'Not Pro-Rata'}</p>
                          </td>
                          <td className="p-3 min-w-[200px]">
                            {isAssigned && (
                              <div className="flex gap-2 items-center">
                                  <select value={assignedData.calculationType} onChange={e => handleFieldChange(masterComp._id, 'calculationType', e.target.value)} className="w-32 p-2 border border-gray-300 rounded-md text-sm">
                                      <option value="Fixed">Fixed</option>
                                      <option value="Percentage">Percentage</option>
                                  </select>
                                  <input type="number" placeholder="Value" step="any" value={assignedData.value} onChange={e => handleFieldChange(masterComp._id, 'value', e.target.value)} className="w-28 p-2 border border-gray-300 rounded-md text-sm" required />
                                  {assignedData.calculationType === 'Percentage' && <span className="font-semibold text-gray-600">%</span>}
                              </div>
                            )}
                          </td>
                           {/* --- NEW TD FOR THE DEDICATED COLUMN --- */}
                          <td className="p-3 min-w-[250px]">
                            {isAssigned && assignedData.calculationType === 'Percentage' && (
                                <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                                    {potentialDeps.length > 0 ? potentialDeps.map(dep => {
                                        const depMaster = allComponents.find(c => c._id === dep.componentId);
                                        const isChecked = (assignedData.percentageOf || []).includes(dep.componentId);
                                        return (
                                            <label key={dep.componentId} className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer text-sm">
                                                <input type="checkbox" checked={isChecked} onChange={e => handlePercentageOfChange(masterComp._id, dep.componentId, e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                                <span>{depMaster?.name}</span>
                                            </label>
                                        )
                                    }) : <p className="text-xs text-gray-500 italic">No other assigned components to use as a base.</p>}
                                </div>
                            )}
                          </td>
                          <td className="p-3 whitespace-nowrap text-lg font-bold text-gray-800">
                             {isAssigned && `₹ ${assignedData.amount.toFixed(2)}`}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex justify-end gap-3 bg-gray-50 p-4 rounded-b-lg border-t">
            <button type="submit" disabled={saving || loading} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? 'Saving...' : 'Save Salary Profile'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AssignSalaryPage;