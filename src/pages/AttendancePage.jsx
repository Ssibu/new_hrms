import React, { useState, useEffect } from 'react';
import { useConfig } from '../context/ConfigContext';
import { ClockIcon } from '@heroicons/react/24/outline';

const AttendancePage = () => {
  const { backendUrl } = useConfig();
  const [todaysRecord, setTodaysRecord] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // --- NEW: State to manage the selected filter month ---
  // Helper function to get the current month in "YYYY-MM" format
  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // JS months are 0-11
    return `${year}-${month}`;
  };
  const [filterMonth, setFilterMonth] = useState(getCurrentMonth());

  // --- MODIFIED: Function to fetch data based on the filterMonth state ---
  const fetchAttendanceData = async () => {
    if (!filterMonth) return; // Don't fetch if no month is selected

    try {
      setLoading(true);
      setError('');
      setMessage('');

      // 1. Calculate startDate and endDate from the filterMonth string (e.g., "2025-07")
      const year = parseInt(filterMonth.split('-')[0]);
      const month = parseInt(filterMonth.split('-')[1]);
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Day 0 of next month gives last day of current month

      // 2. Fetch all attendance records for the selected month
      const response = await fetch(
        `${backendUrl}/api/attendance/my?startDate=${startDate}&endDate=${endDate}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch data.');
      }

      const monthlyRecords = await response.json();
      setAttendanceHistory(monthlyRecords);

      // 3. Find today's record only if the user is viewing the current month
      if (filterMonth === getCurrentMonth()) {
        const todayString = new Date().toISOString().split('T')[0];
        const todayRecord = monthlyRecords.find(record => 
            new Date(record.date).toISOString().split('T')[0] === todayString
        );
        setTodaysRecord(todayRecord || null);
      } else {
        // If viewing a past month, there is no "today's record" to show
        setTodaysRecord(null);
      }

    } catch (err) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // --- MODIFIED: useEffect now depends on filterMonth ---
  // This will automatically re-fetch data whenever the user changes the month.
  useEffect(() => {
    fetchAttendanceData();
  }, [backendUrl, filterMonth]);

  const handleAction = async (action) => {
    setMessage('');
    setError('');
    try {
      const response = await fetch(`${backendUrl}/api/attendance/${action}`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await response.json();

      if (response.ok) {
        setMessage(`You have successfully ${action === 'check-in' ? 'checked in' : 'checked out'}.`);
        // Refresh data after action
        fetchAttendanceData();
      } else {
        setError(data.error || `Failed to ${action}.`);
      }
    } catch (err) {
      setError('A network error occurred. Please try again.');
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '--:--';
    return new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };
  
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();

  const getStatusColor = (status) => {
    switch (status) {
      case 'Present': return 'bg-green-100 text-green-800';
      case 'Absent': return 'bg-red-100 text-red-800';
      case 'On Leave': return 'bg-blue-100 text-blue-800';
      case 'Holiday': return 'bg-gray-100 text-gray-800';
      case 'Half Day': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="text-center p-8">Loading attendance data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
      </div>

      {message && <div className="p-4 rounded-lg bg-green-100 text-green-700">{message}</div>}
      {error && <div className="p-4 rounded-lg bg-red-100 text-red-700">{error}</div>}

      {/* Today's Action Panel is now only visible if viewing the current month */}
      {filterMonth === getCurrentMonth() && (
        <div className="bg-white rounded-lg shadow p-6 animate-fadeIn">
          <h2 className="text-lg font-semibold mb-4">Today's Status ({new Date().toLocaleDateString()})</h2>
          <div className="flex items-center justify-around gap-4 text-center">
            <div>
              <p className="text-sm text-gray-500">Check In</p>
              <p className="text-2xl font-bold text-gray-800">{formatTime(todaysRecord?.checkIn)}</p>
            </div>
            <div className="text-center">
              {!todaysRecord?.checkIn && (
                <button onClick={() => handleAction('check-in')} className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 transition-colors">
                  Check In
                </button>
              )}
              {todaysRecord?.checkIn && !todaysRecord?.checkOut && (
                <button onClick={() => handleAction('check-out')} className="bg-red-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-red-700 transition-colors">
                  Check Out
                </button>
              )}
              {todaysRecord?.checkIn && todaysRecord?.checkOut && (
                <div className="text-green-600 font-semibold p-3">Attendance Completed!</div>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Check Out</p>
              <p className="text-2xl font-bold text-gray-800">{formatTime(todaysRecord?.checkOut)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Attendance History Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* --- NEW: Filter Bar --- */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Attendance History</h3>
          <div className="flex items-center gap-4">
            <label htmlFor="month-filter" className="text-sm font-medium text-gray-700">Select Month:</label>
            <input
              type="month"
              id="month-filter"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendanceHistory.length > 0 ? (
                attendanceHistory.map(record => (
                  <tr key={record._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(record.date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatTime(record.checkIn)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatTime(record.checkOut)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-10 text-gray-500">No attendance records found for the selected month.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;