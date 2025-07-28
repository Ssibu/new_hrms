import React, { useState, useEffect } from 'react';
import { useConfig } from '../context/ConfigContext';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

// Modal component remains unchanged
const Modal = ({ open, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 w-screen min-h-screen z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative animate-fadeIn">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-blue-600 text-2xl font-bold focus:outline-none"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
};

const LeavePolicy = () => {
  const { backendUrl } = useConfig();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  
  // --- MODIFIED: Added 'category' to the initial state ---
  const [formData, setFormData] = useState({
    type: '',
    description: '',
    category: 'Paid', // Default to 'Paid' for new policies
    totalDaysPerYear: ''
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/leave-policies`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setPolicies(data);
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    // --- MODIFIED: Prepare data based on category ---
    let submissionData = { ...formData };
    if (submissionData.category === 'Unpaid') {
      // Ensure totalDaysPerYear is not sent for Unpaid policies
      delete submissionData.totalDaysPerYear;
    }

    try {
      const url = editingPolicy 
        ? `${backendUrl}/api/leave-policies/${editingPolicy._id}`
        : `${backendUrl}/api/leave-policies`;
      
      const method = editingPolicy ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(submissionData) // Send the modified data
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(editingPolicy ? 'Policy updated successfully!' : 'Policy created successfully!');
        resetForm(); // Use resetForm to close modal and clear state
        fetchPolicies();
      } else {
        setMessage(data.error || 'Something went wrong');
      }
    } catch (error) {
      setMessage('Network error');
    }
  };

  // --- MODIFIED: Populate form with all necessary fields, including category ---
  const handleEdit = (policy) => {
    setEditingPolicy(policy);
    setFormData({
      type: policy.type,
      description: policy.description || '',
      category: policy.category, // Set the category from the policy
      totalDaysPerYear: policy.totalDaysPerYear?.toString() || '' // Handle cases where it might be null/undefined
    });
    setShowForm(true);
  };

  const handleDelete = async (policyId) => {
    if (!window.confirm('Are you sure you want to delete this policy?')) return;

    try {
      const response = await fetch(`${backendUrl}/api/leave-policies/${policyId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setMessage('Policy deleted successfully!');
        fetchPolicies();
      } else {
        const data = await response.json();
        setMessage(data.error || 'Failed to delete policy');
      }
    } catch (error) {
      setMessage('Network error');
    }
  };

  // --- MODIFIED: Reset form now includes the category field ---
  const resetForm = () => {
    setFormData({ type: '', description: '', category: 'Paid', totalDaysPerYear: '' });
    setEditingPolicy(null);
    setShowForm(false);
  };
  
  // --- NEW: Handle category changes to clear total days if switching to Unpaid ---
  const handleCategoryChange = (e) => {
    const newCategory = e.target.value;
    setFormData({
      ...formData,
      category: newCategory,
      totalDaysPerYear: newCategory === 'Unpaid' ? '' : formData.totalDaysPerYear
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Leave Policies</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }} // Use resetForm to ensure clean state
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5" />
          Add Policy
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}

      {/* --- MODIFIED: Add/Edit Policy Modal Form --- */}
      <Modal open={showForm} onClose={resetForm}>
        <h2 className="text-lg font-semibold mb-4">
          {editingPolicy ? 'Edit Leave Policy' : 'Add New Leave Policy'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* --- MODIFIED: Changed from select to input for flexibility --- */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Leave Type (e.g., CL, EL, LWP)
            </label>
            <input
              type="text"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value.toUpperCase() })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={!!editingPolicy}
              placeholder="e.g. CL"
            />
             {!!editingPolicy && <p className="text-xs text-gray-500 mt-1">Leave type cannot be changed after creation.</p>}
          </div>

          {/* --- NEW: Category Selection --- */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={handleCategoryChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              rows="3"
              placeholder="Enter policy description..."
            />
          </div>
          
          {/* --- MODIFIED: Conditionally render Total Days input --- */}
          {formData.category === 'Paid' && (
            <div className="animate-fadeIn">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Days Per Year
              </label>
              <input
                type="number"
                value={formData.totalDaysPerYear}
                onChange={(e) => setFormData({ ...formData, totalDaysPerYear: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                min="1"
                required={formData.category === 'Paid'} // Required only if category is 'Paid'
              />
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              {editingPolicy ? 'Update Policy' : 'Create Policy'}
            </button>
          </div>
        </form>
      </Modal>

      {/* --- MODIFIED: Table to display new data --- */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                {/* --- NEW: Category Column --- */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days/Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {policies.length > 0 ? policies.map((policy) => (
                <tr key={policy._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-800">
                      {policy.type}
                    </span>
                  </td>
                  {/* --- NEW: Category Data Cell --- */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      policy.category === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {policy.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{policy.description}</div>
                  </td>
                  {/* --- MODIFIED: Handle display for unpaid leaves --- */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {policy.category === 'Paid' ? `${policy.totalDaysPerYear} days` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleEdit(policy)}
                        className="text-blue-600 hover:text-blue-900 focus:outline-none"
                        aria-label="Edit"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(policy._id)}
                        className="text-red-600 hover:text-red-900 focus:outline-none"
                         aria-label="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                    <td colSpan="5" className="text-center py-10 text-gray-500">No leave policies found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeavePolicy;