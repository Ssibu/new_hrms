import React, { useState, useEffect, useCallback } from 'react';
import { useConfig } from '../context/ConfigContext';
import { CheckCircleIcon, ExclamationTriangleIcon, CalculatorIcon, ArrowPathIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

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
  const [expandedRows, setExpandedRows] = useState({});

  // Toggle row expansion
  const toggleRowExpand = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Fetch initial data: employees and the master component library
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [employeesRes, componentsRes] = await Promise.all([
          fetch(`${backendUrl}/api/employees`, { credentials: 'include' }),
          fetch(`${backendUrl}/api/salary-components`, { credentials: 'include' })
        ]);
        
        if (!employeesRes.ok) throw new Error('Failed to load employees');
        if (!componentsRes.ok) throw new Error('Failed to load salary components');
        
        const empData = await employeesRes.json();
        const compData = await componentsRes.json();
        
        setEmployees(empData.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
        setAllComponents(compData.sort((a,b) => {
          if (a.name.toLowerCase().includes('basic')) return -1;
          if (b.name.toLowerCase().includes('basic')) return 1;
          if (a.type !== b.type) return a.type.localeCompare(b.type);
          return a.name.localeCompare(b.name);
        }));
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
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
      setExpandedRows({});
      return;
    }
    
    const fetchEmployeeProfile = async () => {
      setLoading(true);
      setError('');
      setMessage('');
      try {
        const res = await fetch(`${backendUrl}/api/employee-salary-profiles/${selectedEmployeeId}`, { 
          credentials: 'include' 
        });
        
        if (!res.ok) throw new Error('Failed to fetch salary profile.');
        const data = await res.json();
        
        if (data?.components?.length > 0) {
          const sanitizedProfile = data.components.map(c => ({
            componentId: c.component._id,
            calculationType: c.calculationType,
            value: c.value,
            percentageOf: c.percentageOf || [],
            amount: c.amount,
          }));
          
          setAssignedComponents(sanitizedProfile);
          // Expand all rows when loading existing profile
          const expanded = {};
          sanitizedProfile.forEach(c => {
            expanded[c.componentId] = true;
          });
          setExpandedRows(expanded);
        } else {
          setAssignedComponents([]);
          setExpandedRows({});
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
    
    const newProfile = profile.map(p => ({ 
      ...p, 
      amount: p.calculationType === 'Fixed' ? Number(p.value) || 0 : 0 
    }));
    
    const amountMap = new Map(
      newProfile
        .filter(p => p.calculationType === 'Fixed')
        .map(p => [p.componentId, p.amount])
    );

    while (changed && iterations < MAX_ITERATIONS) {
      changed = false;
      iterations++;

      newProfile.forEach(comp => {
        if (comp.calculationType === 'Percentage' && !amountMap.has(comp.componentId)) {
          const baseComponents = comp.percentageOf;
          const areAllBaseComponentsCalculated = baseComponents.every(id => amountMap.has(id));

          if (areAllBaseComponentsCalculated) {
            const baseAmount = baseComponents.reduce(
              (sum, id) => sum + (amountMap.get(id) || 0), 
              0
            );
            const percentageValue = Number(comp.value) || 0;
            const calculatedAmount = (baseAmount * percentageValue) / 100;
            
            comp.amount = calculatedAmount;
            amountMap.set(comp.componentId, calculatedAmount);
            changed = true;
          }
        }
      });
    }

    if (iterations === MAX_ITERATIONS && 
        newProfile.some(p => !amountMap.has(p.componentId))) {
      setError("Calculation Error: Circular dependencies detected. Please check your percentage dependencies.");
    }

    setAssignedComponents(newProfile);
  }, [setError]);

  const handleCheckboxChange = (masterCompId, isChecked) => {
    let updatedProfile;
    
    if (isChecked) {
      const masterComp = allComponents.find(c => c._id === masterCompId);
      const newComponent = {
        componentId: masterCompId,
        calculationType: masterComp.name.toLowerCase().includes('basic') ? 'Fixed' : 'Percentage',
        value: masterComp.name.toLowerCase().includes('basic') ? (masterComp.defaultValue || 0) : 0,
        percentageOf: [],
        amount: 0,
      };
      updatedProfile = [...assignedComponents, newComponent];
      setExpandedRows(prev => ({ ...prev, [masterCompId]: true }));
    } else {
      updatedProfile = assignedComponents
        .filter(c => c.componentId !== masterCompId)
        .map(c => ({
          ...c,
          percentageOf: c.percentageOf.filter(depId => depId !== masterCompId)
        }));
      setExpandedRows(prev => {
        const newExpanded = { ...prev };
        delete newExpanded[masterCompId];
        return newExpanded;
      });
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
      setError('Please select an employee first.');
      return;
    }
    
    if (assignedComponents.length === 0) {
      setError('Please assign at least one salary component.');
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

      const response = await fetch(
        `${backendUrl}/api/employee-salary-profiles/${selectedEmployeeId}`, 
        {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(payload)
        }
      );
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to save profile.');
      
      setMessage('Salary profile saved successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };
  
  const getTotalAmount = () => {
    return assignedComponents.reduce((sum, comp) => sum + comp.amount, 0);
  };

  const selectedEmployee = employees.find(e => e._id === selectedEmployeeId);
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Salary Structure Assignment</h1>
          <p className="mt-2 text-gray-600">
            Configure and manage employee salary components and calculations
          </p>
        </div>

        {/* Employee Selection Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <label htmlFor="employee-select" className="block text-sm font-medium text-gray-700 mb-1">
                Select Employee
              </label>
              <select
                id="employee-select"
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                <option value="">Select an employee</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} ({emp.empId}) - {emp.department || 'No Department'}
                  </option>
                ))}
              </select>
            </div>
            
            {selectedEmployee && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="text-sm font-medium text-blue-800">Selected Employee</h3>
                <p className="text-lg font-semibold text-gray-900">{selectedEmployee.name}</p>
                <div className="flex gap-4 mt-1 text-sm text-gray-600">
                  <span>ID: {selectedEmployee.empId}</span>
                  {selectedEmployee.department && (
                    <span>Dept: {selectedEmployee.department}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {selectedEmployeeId ? (
          loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile}>
              {/* Status Messages */}
              {(error || message) && (
                <div className={`mb-6 p-4 rounded-lg ${error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                  <div className="flex items-center gap-3">
                    {error ? (
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                    ) : (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    )}
                    <span className={error ? 'text-red-700' : 'text-green-700'}>
                      {error || message}
                    </span>
                  </div>
                </div>
              )}

              {/* Salary Components Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Salary Components</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Select and configure the components for this employee's salary structure
                  </p>
                </div>
                
                {allComponents.length === 0 ? (
                  <div className="text-center p-8 text-gray-500">
                    <CalculatorIcon className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                    <p>No salary components found in library.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {allComponents.map(masterComp => {
                      const assignedData = assignedComponents.find(c => c.componentId === masterComp._id);
                      const isAssigned = !!assignedData;
                      const isExpanded = expandedRows[masterComp._id];
                      const potentialDeps = assignedComponents.filter(c => c.componentId !== masterComp._id);

                      return (
                        <div 
                          key={masterComp._id} 
                          className={`transition-colors duration-150 ${isAssigned ? 'bg-blue-50' : 'bg-white'}`}
                        >
                          <div className="grid grid-cols-12 items-center p-4 hover:bg-gray-50">
                            <div className="col-span-1 flex justify-center">
                              <input
                                type="checkbox"
                                checked={isAssigned}
                                onChange={(e) => handleCheckboxChange(masterComp._id, e.target.checked)}
                                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </div>
                            
                            <div className="col-span-4">
                              <div className="flex items-center gap-3">
                                <div>
                                  <p className="font-medium text-gray-900">{masterComp.name}</p>
                                  <div className="flex gap-2 mt-1">
                                    <span className={`text-xs px-2 py-1 rounded-full ${masterComp.type === 'Earning' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                      {masterComp.type}
                                    </span>
                                    {masterComp.isProRata && (
                                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                        Pro-Rata
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="col-span-3">
                              {isAssigned && (
                                <div className="flex items-center gap-2">
                                  <select
                                    value={assignedData.calculationType}
                                    onChange={e => handleFieldChange(masterComp._id, 'calculationType', e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                  >
                                    <option value="Fixed">Fixed Amount</option>
                                    <option value="Percentage">Percentage</option>
                                  </select>
                                </div>
                              )}
                            </div>
                            
                            <div className="col-span-2">
                              {isAssigned && (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    placeholder={assignedData.calculationType === 'Percentage' ? '0%' : '0.00'}
                                    step={assignedData.calculationType === 'Percentage' ? '0.01' : '1'}
                                    value={assignedData.value}
                                    onChange={e => handleFieldChange(masterComp._id, 'value', e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                    required
                                  />
                                </div>
                              )}
                            </div>
                            
                            <div className="col-span-2 text-right">
                              {isAssigned ? (
                                <span className="font-semibold text-gray-900">
                                  ₹{assignedData.amount.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </div>
                          </div>
                          
                          {/* Expanded Configuration */}
                          {isAssigned && isExpanded && (
                            <div className="bg-white p-4 border-t border-gray-200">
                              <div className="max-w-3xl mx-auto">
                                <h4 className="text-sm font-medium text-gray-700 mb-3">Component Configuration</h4>
                                
                                {assignedData.calculationType === 'Percentage' && (
                                  <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Percentage Based On:
                                    </label>
                                    {potentialDeps.length > 0 ? (
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {potentialDeps.map(dep => {
                                          const depMaster = allComponents.find(c => c._id === dep.componentId);
                                          const isChecked = (assignedData.percentageOf || []).includes(dep.componentId);
                                          return (
                                            <label key={dep.componentId} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 cursor-pointer">
                                              <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={e => handlePercentageOfChange(masterComp._id, dep.componentId, e.target.checked)}
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                              />
                                              <span className="text-sm text-gray-700">{depMaster?.name}</span>
                                              <span className="ml-auto text-xs font-medium text-gray-500">
                                                ₹{dep.amount.toFixed(2)}
                                              </span>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-gray-500 italic">
                                        No other assigned components available as base for percentage calculation.
                                      </p>
                                    )}
                                  </div>
                                )}
                                
                                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                  <button
                                    type="button"
                                    onClick={() => toggleRowExpand(masterComp._id)}
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                  >
                                    Hide details
                                  </button>
                                  <div className="text-sm text-gray-500">
                                    {assignedData.calculationType === 'Percentage' && (
                                      <span>
                                        {assignedData.percentageOf.length > 0 ? (
                                          `Calculated from ${assignedData.percentageOf.length} base component(s)`
                                        ) : (
                                          "No base components selected"
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {isAssigned && !isExpanded && (
                            <div className="px-4 pb-4 text-center">
                              <button
                                type="button"
                                onClick={() => toggleRowExpand(masterComp._id)}
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 mx-auto"
                              >
                                <ChevronDownIcon className="h-4 w-4" />
                                Show configuration details
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Summary and Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">Salary Summary</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {assignedComponents.length} component(s) assigned
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-500">Total Monthly</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ₹{getTotalAmount().toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedEmployeeId('')}
                      disabled={saving}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving || assignedComponents.length === 0}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {saving ? (
                        <>
                          <ArrowPathIcon className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Salary Structure'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <CalculatorIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No Employee Selected</h3>
            <p className="mt-2 text-gray-600 max-w-md mx-auto">
              Please select an employee from the dropdown above to view or configure their salary structure.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignSalaryPage;