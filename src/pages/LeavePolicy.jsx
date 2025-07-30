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

// --- NEW: Helper for a cleaner table display ---
const getLeavePolicyDetails = (policy) => {
    if (policy.category === 'Unpaid') {
        return { renewal: 'N/A', annual: 'N/A', monthly: 'N/A' };
    }
    if (policy.renewalType === 'Monthly') {
        return { 
            renewal: 'Monthly', 
            annual: 'N/A', 
            monthly: `${policy.monthlyDayLimit} (Grant)` 
        };
    }
    // Default to Yearly
    return { 
        renewal: 'Yearly', 
        annual: `${policy.totalDaysPerYear} days`, 
        monthly: policy.monthlyDayLimit ? `${policy.monthlyDayLimit} (Limit)` : 'None'
    };
};


const LeavePolicy = () => {
  const { backendUrl } = useConfig();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  
  // --- MODIFIED: Updated state to match the new schema ---
  const initialFormData = {
    type: '',
    description: '',
    category: 'Paid',
    renewalType: 'Yearly', // Default for new 'Paid' policies
    totalDaysPerYear: '',
    monthlyDayLimit: '' 
  };
  const [formData, setFormData] = useState(initialFormData);
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

    // --- MODIFIED: Prepare a clean data object for submission ---
    let submissionData = { ...formData };
    
    // Clean data based on category and renewalType
    if (submissionData.category === 'Unpaid') {
      delete submissionData.renewalType;
      delete submissionData.totalDaysPerYear;
      delete submissionData.monthlyDayLimit;
    } else { // Category is 'Paid'
        if (submissionData.renewalType === 'Yearly') {
            if (!submissionData.monthlyDayLimit) {
                delete submissionData.monthlyDayLimit; // Don't send empty optional field
            }
        } else { // renewalType is 'Monthly'
            delete submissionData.totalDaysPerYear;
        }
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
        body: JSON.stringify(submissionData)
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(editingPolicy ? 'Policy updated successfully!' : 'Policy created successfully!');
        resetForm();
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
      description: policy.description || '',
      category: policy.category,
      // Provide defaults for fields that might not exist on older data
      renewalType: policy.renewalType || 'Yearly', 
      totalDaysPerYear: policy.totalDaysPerYear?.toString() || '',
      monthlyDayLimit: policy.monthlyDayLimit?.toString() || '' 
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
    setFormData(initialFormData);
    setEditingPolicy(null);
    setShowForm(false);
  };
  
  // --- NEW: Handlers to manage form state changes ---
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };

    // When category changes, reset dependent fields
    if (name === 'category') {
        if (value === 'Unpaid') {
            newFormData.renewalType = '';
            newFormData.totalDaysPerYear = '';
            newFormData.monthlyDayLimit = '';
        } else { // Switching back to 'Paid'
            newFormData.renewalType = 'Yearly'; // Default to Yearly
        }
    }
    
    // When renewalType changes, reset the no-longer-relevant field
    if (name === 'renewalType') {
        if (value === 'Yearly') {
            newFormData.monthlyDayLimit = ''; // monthly limit is optional, can be cleared
        } else { // value is 'Monthly'
            newFormData.totalDaysPerYear = '';
        }
    }

    setFormData(newFormData);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Leave Policies</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
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

      {/* --- FINAL: Add/Edit Policy Modal Form --- */}
      <Modal open={showForm} onClose={resetForm}>
        <h2 className="text-lg font-semibold mb-4">
          {editingPolicy ? 'Edit Leave Policy' : 'Add New Leave Policy'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Leave Type */}
            <input name="type" type="hidden" value={formData.type} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Leave Type (e.g., CL, EL, LWP)
              </label>
              <input
                type="text"
                name="type"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value.toUpperCase()})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={!!editingPolicy}
                placeholder="e.g. CL"
              />
              {!!editingPolicy && <p className="text-xs text-gray-500 mt-1">Leave type cannot be changed after creation.</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea name="description" value={formData.description} onChange={handleFormChange} className="w-full p-2 border border-gray-300 rounded-md" rows="2" placeholder="e.g. Casual Leave"/>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select name="category" value={formData.category} onChange={handleFormChange} className="w-full p-2 border border-gray-300 rounded-md">
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>
          
            {/* --- Conditional Fields for PAID policies --- */}
            {formData.category === 'Paid' && (
              <div className="space-y-4 p-4 border border-gray-200 rounded-md animate-fadeIn">
                {/* Renewal Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Renewal Type</label>
                  <select name="renewalType" value={formData.renewalType} onChange={handleFormChange} className="w-full p-2 border border-gray-300 rounded-md">
                    <option value="Yearly">Yearly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>

                {/* Yearly Renewal Fields */}
                {formData.renewalType === 'Yearly' && (
                    <div className="space-y-4 animate-fadeIn">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Days Per Year</label>
                        <input type="number" name="totalDaysPerYear" value={formData.totalDaysPerYear} onChange={handleFormChange} className="w-full p-2 border border-gray-300 rounded-md" min="1" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Usage Limit (Optional)</label>
                        <input type="number" name="monthlyDayLimit" value={formData.monthlyDayLimit} onChange={handleFormChange} className="w-full p-2 border border-gray-300 rounded-md" min="1" placeholder="e.g., 3" />
                      </div>
                    </div>
                )}
                
                {/* Monthly Renewal Fields */}
                {formData.renewalType === 'Monthly' && (
                    <div className="animate-fadeIn">
                       <label className="block text-sm font-medium text-gray-700 mb-1">Days Granted Per Month</label>
                       <input type="number" name="monthlyDayLimit" value={formData.monthlyDayLimit} onChange={handleFormChange} className="w-full p-2 border border-gray-300 rounded-md" min="1" required />
                    </div>
                )}
              </div>
            )}

          <div className="flex gap-2 justify-end pt-4">
            <button type="button" onClick={resetForm} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Cancel</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">{editingPolicy ? 'Update Policy' : 'Create Policy'}</button>
          </div>
        </form>
      </Modal>

      {/* --- FINAL: Table to display new policy structure --- */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                {/* NEW Column */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Renewal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Annual Grant</th>
                {/* MODIFIED Header */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Rule</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {policies.length > 0 ? policies.map((policy) => {
                const details = getLeavePolicyDetails(policy);
                return (
                    <tr key={policy._id}>
                      <td className="px-6 py-4 whitespace-nowrap"><span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-800">{policy.type}</span></td>
                      <td className="px-6 py-4"><div className="text-sm text-gray-900">{policy.description || '-'}</div></td>
                      <td className="px-6 py-4 whitespace-nowrap"><span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${policy.category === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{policy.category}</span></td>
                      {/* NEW Data Cell */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{details.renewal}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{details.annual}</td>
                      {/* MODIFIED Data Cell */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{details.monthly}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-4">
                          <button onClick={() => handleEdit(policy)} className="text-blue-600 hover:text-blue-900 focus:outline-none" aria-label="Edit"><PencilIcon className="h-5 w-5" /></button>
                          <button onClick={() => handleDelete(policy._id)} className="text-red-600 hover:text-red-900 focus:outline-none" aria-label="Delete"><TrashIcon className="h-5 w-5" /></button>
                        </div>
                      </td>
                    </tr>
                );
              }) : (
                <tr>
                    <td colSpan="7" className="text-center py-10 text-gray-500">No leave policies found.</td>
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