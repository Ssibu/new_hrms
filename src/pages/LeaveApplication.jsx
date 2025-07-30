import React, { useState, useEffect } from 'react';
import { useConfig } from '../context/ConfigContext';
import {
  CalendarIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

// The Modal component remains unchanged.
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

// --- NEW: Accurate working day calculation to match the backend ---
const calculateWorkingDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    
    let days = 0;
    const current = new Date(startDate);
    const end = new Date(endDate);
    
    // Adjust for timezone differences by working with UTC dates
    current.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(0, 0, 0, 0);

    while (current <= end) {
        const dayOfWeek = current.getUTCDay(); // 0 = Sunday, 6 = Saturday
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            days++;
        }
        current.setUTCDate(current.getUTCDate() + 1);
    }
    return days;
};


const LeaveApplication = () => {
  const { backendUrl } = useConfig();
  const [leaveBalance, setLeaveBalance] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    leaveType: '',
    fromDate: '',
    toDate: '',
    reason: ''
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    // Fetch all required data in parallel
    const loadInitialData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchPolicies(),
                fetchLeaveData()
            ]);
        } catch (error) {
            console.error("Failed to load initial data", error);
            setMessage("Could not load all required data.");
        } finally {
            setLoading(false);
        }
    };
    loadInitialData();
  }, []);

  const fetchPolicies = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/leave-policies`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setPolicies(data);
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
    }
  };

  const fetchLeaveData = async () => {
    try {
      const [balanceResponse, requestsResponse] = await Promise.all([
        fetch(`${backendUrl}/api/leave-balances/my`, { credentials: 'include' }),
        fetch(`${backendUrl}/api/leave-requests/my`, { credentials: 'include' })
      ]);

      if (balanceResponse.ok) setLeaveBalance(await balanceResponse.json());
      if (requestsResponse.ok) setMyRequests(await requestsResponse.json());

    } catch (error) {
      console.error('Error fetching leave data:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (calculateWorkingDays(formData.fromDate, formData.toDate) <= 0) {
        setMessage("The selected date range must include at least one working day.");
        return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/leave-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Leave request submitted successfully!');
        setShowForm(false);
        setFormData({ leaveType: '', fromDate: '', toDate: '', reason: '' });
        fetchLeaveData(); // Refresh both balance and requests
      } else {
        setMessage(data.error || 'Failed to submit leave request');
      }
    } catch (error) {
      setMessage('Network error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  const getLeaveTypeName = (type) => {
    const policy = policies.find(p => p.type === type);
    return policy?.description || type;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Leave Application</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <CalendarIcon className="h-5 w-5" />
          Apply for Leave
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}

      {/* --- MODIFIED: Leave Balance Section to show all policies --- */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">My Leave Balance ({new Date().getFullYear()})</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {policies.length === 0 && (
            <div className="col-span-3 text-center text-gray-500">No leave policies defined by admin.</div>
          )}
          {policies.map((policy) => {
            if (policy.category === 'Paid') {
                const balance = leaveBalance.find(b => b.leaveType === policy.type);
                if (!balance) return null; // Only show paid balance if it exists for the user
                const available = balance.total - balance.used;
                return (
                  <div key={policy._id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">{getLeaveTypeName(balance.leaveType)}</span>
                      <span className={`text-sm px-2 py-1 rounded-full ${policy.category === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{policy.category}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-blue-600">{available}</span>
                      <span className="text-sm text-gray-500">available</span>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      Used: {balance.used} / Total: {balance.total}
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${balance.total > 0 ? (balance.used / balance.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                );
            } else { // Handle Unpaid policies
                return (
                    <div key={policy._id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-900">{getLeaveTypeName(policy.type)}</span>
                          <span className={`text-sm px-2 py-1 rounded-full ${policy.category === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{policy.category}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-2">
                          <span className="text-lg font-semibold text-gray-700">Available</span>
                          <span className="text-sm text-gray-500">No balance limit</span>
                        </div>
                    </div>
                );
            }
          })}
        </div>
      </div>

      {/* --- MODIFIED: Leave Application Modal --- */}
      <Modal open={showForm} onClose={() => setShowForm(false)}>
        <h2 className="text-lg font-semibold mb-4">Apply for Leave</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Leave Type
              </label>
              <select
                value={formData.leaveType}
                onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Leave Type</option>
                {/* MODIFIED: Loop through all policies */}
                {policies.map((policy) => {
                  if (policy.category === 'Paid') {
                    const balance = leaveBalance.find(b => b.leaveType === policy.type);
                    if (!balance || (balance.total - balance.used <= 0)) return null; // Don't show if no balance
                    return (
                      <option key={policy.type} value={policy.type}>
                        {getLeaveTypeName(policy.type)} (Available: {balance.total - balance.used})
                      </option>
                    );
                  } else {
                    // Always show unpaid leave types
                    return (
                        <option key={policy.type} value={policy.type}>
                            {getLeaveTypeName(policy.type)} (Unpaid)
                        </option>
                    );
                  }
                })}
              </select>
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Days
              </label>
              <input
                type="text"
                value={calculateWorkingDays(formData.fromDate, formData.toDate)}
                className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={formData.fromDate}
                onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={formData.toDate}
                onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                min={formData.fromDate || new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              rows="4"
              placeholder="Please provide a detailed reason for your leave request..."
              required
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Submit Request
            </button>
          </div>
        </form>
      </Modal>

      {/* --- MODIFIED: My Leave Requests table to use stored numberOfDays --- */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">My Leave Requests</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leave Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  From - To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applied On
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {myRequests.map((request) => (
                <tr key={request._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {getLeaveTypeName(request.leaveType)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(request.fromDate)} - {formatDate(request.toDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {/* MODIFIED: Use the stored number of days */}
                    {request.numberOfDays} days
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(request.appliedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="text-blue-600 hover:text-blue-900"
                      title="View Details"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODIFIED: Request Details Modal to use stored numberOfDays --- */}
      {selectedRequest && (
        <Modal open={!!selectedRequest} onClose={() => setSelectedRequest(null)}>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Leave Request Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Leave Type:</span> 
                <span className="font-semibold">{getLeaveTypeName(selectedRequest.leaveType)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Category:</span> 
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${selectedRequest.leaveCategory === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{selectedRequest.leaveCategory}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">From Date:</span> 
                <span>{formatDate(selectedRequest.fromDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">To Date:</span> 
                <span>{formatDate(selectedRequest.toDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Number of Days:</span> 
                {/* MODIFIED: Use stored value */}
                <span className="font-bold">{selectedRequest.numberOfDays}</span>
              </div>
              <div className="pt-2">
                <span className="font-medium text-gray-600">Reason:</span>
                <p className="text-gray-800 mt-1 p-2 bg-gray-50 rounded">{selectedRequest.reason}</p>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-medium text-gray-600">Status:</span> 
                <span className={`font-bold ${getStatusColor(selectedRequest.status).replace('bg-', 'text-')}`}>{selectedRequest.status}</span>
              </div>
              {selectedRequest.actionBy && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Action By:</span> 
                  <span>{selectedRequest.actionBy?.name || 'N/A'}</span>
                </div>
              )}
              {selectedRequest.remarks && (
                <div className="pt-2">
                  <span className="font-medium text-gray-600">Manager Remarks:</span>
                  <p className="text-gray-800 mt-1 p-2 bg-gray-50 rounded">{selectedRequest.remarks}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setSelectedRequest(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                Close
              </button>
            </div>
        </Modal>
      )}
    </div>
  );
};

export default LeaveApplication;