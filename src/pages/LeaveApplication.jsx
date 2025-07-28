import React, { useState, useEffect } from 'react';
import { useConfig } from '../context/ConfigContext';
import {
  CalendarIcon,
  EyeIcon
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

const LeaveApplication = () => {
  const { backendUrl, user } = useConfig();
  const [leaveBalance, setLeaveBalance] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
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
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [balanceResponse, requestsResponse] = await Promise.all([
        fetch(`${backendUrl}/api/leave-balances/my`, { credentials: 'include' }),
        fetch(`${backendUrl}/api/leave-requests/my`, { credentials: 'include' })
      ]);

      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        setLeaveBalance(balanceData);
      }

      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        setMyRequests(requestsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

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
        fetchData();
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

  const calculateDays = (fromDate, toDate) => {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const diffTime = Math.abs(to - from);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };

  const getLeaveTypeName = (type) => {
    switch (type) {
      case 'CL': return 'Casual Leave';
      case 'EL': return 'Earned Leave';
      case 'SL': return 'Sick Leave';
      default: return type;
    }
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

      {/* Leave Balance Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">My Leave Balance</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {leaveBalance.map((balance) => (
            <div key={balance._id} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-900">{getLeaveTypeName(balance.leaveType)}</span>
                <span className="text-sm text-gray-500">{balance.year}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-blue-600">{balance.total - balance.used}</span>
                <span className="text-sm text-gray-500">available</span>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Used: {balance.used} / Total: {balance.total}
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(balance.used / balance.total) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leave Application Modal */}
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
                {leaveBalance.map((balance) => (
                  <option key={balance.leaveType} value={balance.leaveType}>
                    {getLeaveTypeName(balance.leaveType)} (Available: {balance.total - balance.used})
                  </option>
                ))}
              </select>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Days
              </label>
              <input
                type="text"
                value={formData.fromDate && formData.toDate ? calculateDays(formData.fromDate, formData.toDate) : ''}
                className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                readOnly
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

      {/* My Leave Requests */}
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
                      {request.leaveType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(request.fromDate)} - {formatDate(request.toDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {calculateDays(request.fromDate, request.toDate)} days
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

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Leave Request Details</h3>
              <div className="space-y-3">
                <div>
                  <span className="font-medium">Leave Type:</span> {getLeaveTypeName(selectedRequest.leaveType)}
                </div>
                <div>
                  <span className="font-medium">From:</span> {formatDate(selectedRequest.fromDate)}
                </div>
                <div>
                  <span className="font-medium">To:</span> {formatDate(selectedRequest.toDate)}
                </div>
                <div>
                  <span className="font-medium">Days:</span> {calculateDays(selectedRequest.fromDate, selectedRequest.toDate)}
                </div>
                <div>
                  <span className="font-medium">Reason:</span>
                  <p className="text-sm text-gray-600 mt-1">{selectedRequest.reason}</p>
                </div>
                <div>
                  <span className="font-medium">Status:</span> {selectedRequest.status}
                </div>
                {selectedRequest.actionBy && (
                  <div>
                    <span className="font-medium">Action By:</span> {selectedRequest.actionBy?.name}
                  </div>
                )}
                {selectedRequest.remarks && (
                  <div>
                    <span className="font-medium">Remarks:</span>
                    <p className="text-sm text-gray-600 mt-1">{selectedRequest.remarks}</p>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveApplication; 