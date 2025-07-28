import React, { useState, useEffect } from 'react';
import { useConfig } from '../context/ConfigContext';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

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
          &times;
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
  const [formData, setFormData] = useState({
    type: '',
    description: '',
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

    try {
      const url = editingPolicy 
        ? `${backendUrl}/api/leave-policies/${editingPolicy._id}`
        : `${backendUrl}/api/leave-policies`;
      
      const method = editingPolicy ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(editingPolicy ? 'Policy updated successfully!' : 'Policy created successfully!');
        setShowForm(false);
        setEditingPolicy(null);
        setFormData({ type: '', description: '', totalDaysPerYear: '' });
        fetchPolicies();
      } else {
        setMessage(data.error || 'Something went wrong');
      }
    } catch (error) {
      setMessage('Network error');
    }
  };

  const handleEdit = (policy) => {
    setEditingPolicy(policy);
    setFormData({
      type: policy.type,
      description: policy.description,
      totalDaysPerYear: policy.totalDaysPerYear.toString()
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

  const resetForm = () => {
    setFormData({ type: '', description: '', totalDaysPerYear: '' });
    setEditingPolicy(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Leave Policies</h1>
        <button
          onClick={() => { setShowForm(true); setEditingPolicy(null); }}
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

      {/* Add/Edit Policy Modal */}
      <Modal open={showForm} onClose={resetForm}>
        <h2 className="text-lg font-semibold mb-4">
          {editingPolicy ? 'Edit Leave Policy' : 'Add New Leave Policy'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Leave Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={!!editingPolicy}
            >
              <option value="">Select Leave Type</option>
              <option value="CL">Casual Leave (CL)</option>
              <option value="EL">Earned Leave (EL)</option>
              <option value="SL">Sick Leave (SL)</option>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Days Per Year
            </label>
            <input
              type="number"
              value={formData.totalDaysPerYear}
              onChange={(e) => setFormData({ ...formData, totalDaysPerYear: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              min="0"
              required
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
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

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Existing Policies</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days/Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {policies.map((policy) => (
                <tr key={policy._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {policy.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{policy.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {policy.totalDaysPerYear} days
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {policy.createdBy?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(policy)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(policy._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeavePolicy; 