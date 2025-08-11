import React, { useState, useEffect, useCallback } from 'react';
import { useConfig } from '../context/ConfigContext';
import { PlusIcon, PencilIcon, TrashIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { Cog8ToothIcon } from '@heroicons/react/24/solid';

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
  
  const initialFormState = {
    name: '',
    type: 'Earning',
    calculationType: 'Percentage',
    value: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchComponents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/salary-components`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch components.');
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
    setError(''); // Clear errors when opening modal
    if (component) {
      setIsEditing(true);
      setCurrentComponent(component);
      setFormData({
        name: component.name,
        type: component.type,
        calculationType: component.calculationType,
        value: component.value
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
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save component.');
      
      setMessage(`Component ${isEditing ? 'updated' : 'created'} successfully!`);
      handleCloseModal();
      fetchComponents();
    } catch (err) {
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
      fetchComponents();
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

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
        </div>
      )}
      {message && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 flex items-center gap-3">
            <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />
            <span>{message}</span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Component Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Default Calculation Rule</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {comp.calculationType === 'Percentage' ? `${comp.value}% of Basic Salary` : `Fixed Amount of ₹${comp.value}`}
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md animate-fadeIn">
            <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-800">{isEditing ? 'Edit Salary Component' : 'Add New Salary Component'}</h2>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Component Name</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="e.g., House Rent Allowance" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Component Type</label>
                  <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md">
                    <option value="Earning">Earning (adds to salary)</option>
                    <option value="Deduction">Deduction (subtracts from salary)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Calculation Type</label>
                        <select value={formData.calculationType} onChange={(e) => setFormData({...formData, calculationType: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md">
                            <option value="Percentage">Percentage</option>
                            <option value="Fixed">Fixed Amount</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {formData.calculationType === 'Percentage' ? 'Value (%)' : 'Amount (₹)'}
                        </label>
                        <input type="number" step="0.01" value={formData.value} onChange={(e) => setFormData({...formData, value: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md" placeholder={formData.calculationType === 'Percentage' ? 'e.g., 40' : 'e.g., 5000'} required />
                    </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 bg-gray-50 p-4 rounded-b-lg">
                <button type="button" onClick={handleCloseModal} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 font-semibold">Cancel</button>
                <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-semibold disabled:bg-blue-300">
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