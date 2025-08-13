import React, { useState, useEffect, useCallback } from 'react';
import { useConfig } from '../context/ConfigContext';
import { PlusIcon, PencilIcon, TrashIcon, ExclamationTriangleIcon, CheckCircleIcon, CheckBadgeIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { Cog8ToothIcon } from '@heroicons/react/24/solid';

// A reusable Toggle Switch component for the form
const ToggleSwitch = ({ enabled, setEnabled, label }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium text-gray-700">{label}</span>
    <button
      type="button"
      onClick={() => setEnabled(!enabled)}
      className={`${
        enabled ? 'bg-blue-600' : 'bg-gray-200'
      } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
      role="switch"
      aria-checked={enabled}
    >
      <span
        aria-hidden="true"
        className={`${
          enabled ? 'translate-x-5' : 'translate-x-0'
        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
      />
    </button>
  </div>
);


const SalaryComponentsPage = () => {
  const { backendUrl } = useConfig();
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentComponent, setCurrentComponent] = useState(null);
  
  // --- UPDATED: The form state now includes `isProRata` ---
  const initialFormState = {
    name: '',
    type: 'Earning',
    isProRata: false, // Default to false
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchComponents = useCallback(async () => {
    setLoading(true);
    try {
      // Clear previous messages on refresh
      setError('');
      setMessage('');
      const response = await fetch(`${backendUrl}/api/salary-components`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch components. Please check your connection or permissions.');
      const data = await response.json();
      setComponents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  useEffect(() => {
    fetchComponents();
  }, [fetchComponents]);

  const handleOpenModal = (component = null) => {
    setError('');
    if (component) {
      setIsEditing(true);
      setCurrentComponent(component);
      // --- UPDATED: Load all relevant fields into the form state ---
      setFormData({
        name: component.name,
        type: component.type,
        isProRata: component.isProRata || false, // Handle legacy data that might not have this field
      });
    } else {
      setIsEditing(false);
      setCurrentComponent(null);
      setFormData(initialFormState);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const url = isEditing
      ? `${backendUrl}/api/salary-components/${currentComponent._id}`
      : `${backendUrl}/api/salary-components`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      // --- UPDATED: The request body now sends the complete form data, including isProRata ---
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save component.');
      
      setMessage(`Component ${isEditing ? 'updated' : 'created'} successfully!`);
      handleCloseModal();
      fetchComponents(); // Refresh the list
    } catch (err) {
      // Display error inside the modal for better UX
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this component? This action cannot be undone.')) return;
    try {
      const response = await fetch(`${backendUrl}/api/salary-components/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to delete component.');
      setMessage('Component deleted successfully!');
      fetchComponents(); // Refresh the list
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Salary Component Library</h1>
          <p className="mt-1 text-sm text-gray-500">Create and manage the master list of all salary components for your organization.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-sm">
          <PlusIcon className="h-5 w-5" />
          <span>Add New Component</span>
        </button>
      </div>

      {/* --- Main Page Alerts --- */}
      {error && !showModal && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
        </div>
      )}
      {message && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 flex items-center gap-3 animate-pulse-fast">
            <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />
            <span>{message}</span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          {/* --- UPDATED: Table now includes a "Pro-Rata" column --- */}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pro-Rata</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="4" className="text-center py-10 text-gray-500">Loading Components...</td></tr>
              ) : components.length === 0 ? (
                <tr>
                    <td colSpan="4" className="text-center py-16 text-gray-500">
                        <Cog8ToothIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No components found</h3>
                        <p className="mt-1 text-sm text-gray-500">Get started by adding a new salary component.</p>
                    </td>
                </tr>
              ) : components.map(comp => (
                <tr key={comp._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{comp.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${comp.type === 'Earning' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {comp.type}
                    </span>
                  </td>
                  {/* --- UPDATED: Display the Pro-Rata status --- */}
                  <td className="px-6 py-4 whitespace-nowrap">
                     <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-full ${comp.isProRata ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                        {comp.isProRata ? <CheckBadgeIcon className="h-4 w-4" /> : <XCircleIcon className="h-4 w-4" />}
                        {comp.isProRata ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex justify-center gap-4">
                      <button onClick={() => handleOpenModal(comp)} className="text-indigo-600 hover:text-indigo-900 transition-colors" title="Edit Component"><PencilIcon className="h-5 w-5" /></button>
                      <button onClick={() => handleDelete(comp._id)} className="text-red-600 hover:text-red-900 transition-colors" title="Delete Component"><TrashIcon className="h-5 w-5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- UPDATED: Add/Edit Modal now includes the Pro-Rata toggle --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md animate-fadeIn">
            <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-800">{isEditing ? 'Edit Salary Component' : 'Add New Salary Component'}</h2>
            </div>
            <form onSubmit={handleSubmit} noValidate>
              <div className="p-6 space-y-5">
                {/* Modal-specific error */}
                {error && (
                    <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm flex items-center gap-2">
                        <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Component Name</label>
                  <input id="name" type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="e.g., House Rent Allowance" required />
                </div>
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Component Type</label>
                  <select id="type" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md">
                    <option value="Earning">Earning (adds to salary)</option>
                    <option value="Deduction">Deduction (subtracts from salary)</option>
                  </select>
                </div>
                {/* --- NEW: Toggle switch for isProRata --- */}
                <div className="pt-2">
                    <ToggleSwitch 
                        label="Pro-rate based on attendance?"
                        enabled={formData.isProRata}
                        setEnabled={(value) => setFormData({...formData, isProRata: value})}
                    />
                    <p className="text-xs text-gray-500 mt-2">Enable this if the component value should change based on the number of days an employee is present. e.g., Basic Salary.</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 bg-gray-50 p-4 rounded-b-lg">
                <button type="button" onClick={handleCloseModal} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 font-semibold">Cancel</button>
                <button type="submit" disabled={saving || !formData.name} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                  {saving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Component')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryComponentsPage;