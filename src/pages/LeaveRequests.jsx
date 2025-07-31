import React, { useState, useEffect, useCallback } from 'react';
import { useConfig } from '../context/ConfigContext';
import {
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  FunnelIcon,
  PencilSquareIcon, // <-- NEW: Icon for the edit button
} from '@heroicons/react/24/outline';

// Helper function to calculate working days (excluding weekends) on the client-side
// This provides instant feedback to the user in the edit modal.
const calculateClientWorkingDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    let days = 0;
    const current = new Date(startDate);
    const end = new Date(endDate);
    while (current <= end) {
        const dayOfWeek = current.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
            days++;
        }
        current.setDate(current.getDate() + 1);
    }
    return days;
};

const LeaveRequests = () => {
  const { backendUrl } = useConfig();
  const [requests, setRequests] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    status: '',
    employee: '',
    leaveType: '',
    leaveCategory: '',
    startDate: '',
    endDate: ''
  });

  const [showFilters, setShowFilters] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  // Modal State Management
  const [showActionModal, setShowActionModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false); // <-- NEW: State for Edit Modal

  // Data for Modals
  const [actionData, setActionData] = useState({ status: '', remarks: '' });
  const [editFormData, setEditFormData] = useState({ fromDate: '', toDate: '' }); // <-- NEW: State for Edit Form
  
  const [message, setMessage] = useState('');

  const fetchRequests = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      );
      Object.entries(activeFilters).forEach(([key, value]) => {
        params.append(key, value);
      });

      const response = await fetch(`${backendUrl}/api/leave-requests?${params}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      setMessage('Failed to fetch leave requests.');
    }
  }, [backendUrl, filters]);

  const fetchPolicies = useCallback(async () => {
    try {
        const response = await fetch(`${backendUrl}/api/leave-policies`, { credentials: 'include' });
        if (response.ok) setPolicies(await response.json());
    } catch (error) {
        console.error('Error fetching policies:', error);
    }
  }, [backendUrl]);


  useEffect(() => {
    const initialFetch = async () => {
        setLoading(true);
        await Promise.all([
            fetchRequests(),
            fetchPolicies()
        ]);
        setLoading(false);
    };
    initialFetch();
  }, [fetchRequests, fetchPolicies]);

  // --- ACTION HANDLERS ---

  const handleActionClick = (request, status) => {
    setActionData({ status, remarks: '' });
    setSelectedRequest(request);
    setShowActionModal(true);
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };
  
  // --- NEW: Handler to open the Edit Modal ---
  const handleEditClick = (request) => {
    setSelectedRequest(request);
    // Format dates to 'YYYY-MM-DD' for the input[type="date"] fields
    setEditFormData({
        fromDate: new Date(request.fromDate).toISOString().split('T')[0],
        toDate: new Date(request.toDate).toISOString().split('T')[0],
    });
    setShowEditModal(true);
  };

  const submitAction = async () => {
    if (!selectedRequest) return;
    try {
      const response = await fetch(`${backendUrl}/api/leave-requests/${selectedRequest._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(actionData)
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(`Request ${actionData.status.toLowerCase()} successfully!`);
        setShowActionModal(false);
        fetchRequests();
      } else {
        setMessage(data.error || 'Failed to update request');
      }
    } catch (error) {
      setMessage('Network error');
    }
  };

  // --- NEW: Function to handle the submission of the edited dates ---
  const handleUpdateDate = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;
    try {
        const response = await fetch(`${backendUrl}/api/leave-requests/${selectedRequest._id}/date`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(editFormData)
        });
        const data = await response.json();
        if (response.ok) {
            setMessage('Leave request dates updated successfully!');
            setShowEditModal(false);
            fetchRequests(); // Refresh the list to show new data
        } else {
            // Display specific error from backend in the modal
            alert(`Error: ${data.error || 'Failed to update dates.'}`);
        }
    } catch (error) {
        alert('A network error occurred. Please try again.');
        console.error('Error updating dates:', error);
    }
  };


  // --- HELPER FUNCTIONS ---
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();
  const getLeaveTypeName = (type) => policies.find(p => p.type === type)?.description || type;


  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Leave Requests</h1>
        <button onClick={() => setShowFilters(!showFilters)} className="bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-700">
          <FunnelIcon className="h-5 w-5" />
          Filters
        </button>
      </div>

      {message && <div className={`p-4 rounded-lg ${message.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{message}</div>}

      {showFilters && (
        <div className="bg-white p-6 rounded-lg shadow-md animate-fadeIn">
          <h3 className="text-lg font-semibold mb-4">Filter Requests</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             {/* Filter inputs go here, unchanged */}
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="w-full p-2 border border-gray-300 rounded-md">
                <option value="">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
              <select value={filters.leaveType} onChange={(e) => setFilters({ ...filters, leaveType: e.target.value })} className="w-full p-2 border border-gray-300 rounded-md">
                <option value="">All Types</option>
                {policies.map(p => <option key={p._id} value={p.type}>{p.description || p.type}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={filters.leaveCategory} onChange={(e) => setFilters({ ...filters, leaveCategory: e.target.value })} className="w-full p-2 border border-gray-300 rounded-md">
                <option value="">All Categories</option>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <div className="flex flex-col md:flex-row gap-2">
                <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} className="flex-1 p-2 border border-gray-300 rounded-md"/>
                <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value, })} className="flex-1 p-2 border border-gray-300 rounded-md"/>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.length > 0 ? requests.map((request) => (
                <tr key={request._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{request.employee?.name}</div>
                    <div className="text-sm text-gray-500">{request.employee?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{getLeaveTypeName(request.leaveType)}</div>
                    <div className="text-sm text-gray-500">{request.leaveCategory}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(request.fromDate)} - {formatDate(request.toDate)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-gray-900">{request.numberOfDays}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center"><span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>{request.status}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-3">
                      <button onClick={() => handleViewDetails(request)} className="text-blue-600 hover:text-blue-900" title="View Details"><EyeIcon className="h-5 w-5" /></button>
                      {request.status === 'Pending' && (
                        <>
                          {/* --- NEW EDIT BUTTON --- */}
                          <button onClick={() => handleEditClick(request)} className="text-indigo-600 hover:text-indigo-900" title="Edit Dates"><PencilSquareIcon className="h-5 w-5" /></button>
                          <button onClick={() => handleActionClick(request, 'Approved')} className="text-green-600 hover:text-green-900" title="Approve"><CheckIcon className="h-5 w-5" /></button>
                          <button onClick={() => handleActionClick(request, 'Rejected')} className="text-red-600 hover:text-red-900" title="Reject"><XMarkIcon className="h-5 w-5" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )) : <tr><td colSpan="6" className="text-center py-10 text-gray-500">No leave requests match the current filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal (unchanged) */}
      {showDetailsModal && selectedRequest && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative p-5 border w-full max-w-md shadow-lg rounded-md bg-white animate-fadeIn">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Leave Request Details</h3>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="font-medium text-gray-600">Employee:</span> <span className="font-semibold">{selectedRequest.employee?.name}</span></div>
                    <div className="flex justify-between"><span className="font-medium text-gray-600">Leave Type:</span> <span className="font-semibold">{getLeaveTypeName(selectedRequest.leaveType)}</span></div>
                    <div className="flex justify-between"><span className="font-medium text-gray-600">Category:</span> <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${selectedRequest.leaveCategory === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{selectedRequest.leaveCategory}</span></div>
                    <div className="flex justify-between"><span className="font-medium text-gray-600">From Date:</span> <span>{formatDate(selectedRequest.fromDate)}</span></div>
                    <div className="flex justify-between"><span className="font-medium text-gray-600">To Date:</span> <span>{formatDate(selectedRequest.toDate)}</span></div>
                    <div className="flex justify-between"><span className="font-medium text-gray-600">Number of Days:</span> <span className="font-bold">{selectedRequest.numberOfDays}</span></div>
                    <div className="pt-2"><span className="font-medium text-gray-600">Reason:</span><p className="text-gray-800 mt-1 p-2 bg-gray-50 rounded">{selectedRequest.reason}</p></div>
                    <div className="flex justify-between border-t pt-2"><span className="font-medium text-gray-600">Status:</span> <span className={`font-bold ${getStatusColor(selectedRequest.status).replace('bg-','text-')}`}>{selectedRequest.status}</span></div>
                    {selectedRequest.actionBy && <div className="flex justify-between"><span className="font-medium text-gray-600">Action By:</span> <span>{selectedRequest.actionBy?.name || 'N/A'}</span></div>}
                    {selectedRequest.remarks && <div className="pt-2"><span className="font-medium text-gray-600">Manager Remarks:</span><p className="text-gray-800 mt-1 p-2 bg-gray-50 rounded">{selectedRequest.remarks}</p></div>}
                </div>
                <div className="flex justify-end mt-4"><button onClick={() => setShowDetailsModal(false)} className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">Close</button></div>
              </div>
            </div>
        </div>
      )}

      {/* Action Modal (unchanged) */}
      {showActionModal && selectedRequest && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative p-5 border w-full max-w-md shadow-lg rounded-md bg-white animate-fadeIn">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">{actionData.status} Leave Request</h3>
                <div className="space-y-4">
                  <div><span className="font-medium text-gray-600">Employee:</span> <span className="font-semibold">{selectedRequest.employee?.name}</span></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Remarks (Optional)</label><textarea value={actionData.remarks} onChange={(e) => setActionData({ ...actionData, remarks: e.target.value })} className="w-full p-2 border border-gray-300 rounded-md" rows="3" placeholder="Enter remarks..."/></div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={() => setShowActionModal(false)} className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">Cancel</button>
                  <button onClick={submitAction} className={`px-4 py-2 rounded-md text-white ${actionData.status === 'Approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>{actionData.status}</button>
                </div>
              </div>
            </div>
        </div>
      )}

      {/* --- NEW: Edit Request Modal --- */}
      {showEditModal && selectedRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative p-5 border w-full max-w-lg shadow-lg rounded-md bg-white animate-fadeIn">
                <h2 className="text-lg font-semibold mb-4">Edit Leave Request</h2>
                <form onSubmit={handleUpdateDate} className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                        <p><span className="font-semibold">Employee:</span> {selectedRequest.employee.name}</p>
                        <p><span className="font-semibold">Leave Type:</span> {getLeaveTypeName(selectedRequest.leaveType)} ({selectedRequest.leaveCategory})</p>
                        <p className="mt-2 text-gray-600">You are editing the dates for this pending request. The number of working days will be recalculated. Please ensure the employee has sufficient balance for the new date range.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                            <input
                                type="date"
                                value={editFormData.fromDate}
                                onChange={(e) => setEditFormData({ ...editFormData, fromDate: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-md"
                                min={new Date().toISOString().split('T')[0]}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                            <input
                                type="date"
                                value={editFormData.toDate}
                                onChange={(e) => setEditFormData({ ...editFormData, toDate: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-md"
                                min={editFormData.fromDate || new Date().toISOString().split('T')[0]}
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Number of Working Days</label>
                        <input
                            type="text"
                            value={calculateClientWorkingDays(editFormData.fromDate, editFormData.toDate)}
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                            readOnly
                        />
                    </div>
                    <div className="flex gap-2 justify-end pt-4">
                        <button type="button" onClick={() => setShowEditModal(false)} className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">Cancel</button>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  );
};

export default LeaveRequests;