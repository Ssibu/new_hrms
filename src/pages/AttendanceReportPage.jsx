import React, { useState, useEffect } from 'react';
import { useConfig } from '../context/ConfigContext';

const AttendanceReportPage = () => {
  const { backendUrl } = useConfig();
  const [reportData, setReportData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // State to manage the active filter type ('today', 'month', 'custom')
  const [filterType, setFilterType] = useState('today');

  // State to hold all filter values
  const [filters, setFilters] = useState({
    employeeId: '',
    status: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  // Fetch the list of all employees for the filter dropdown when the component mounts
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/employees`, { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setEmployees(data);
        }
      } catch (err) {
        console.error("Failed to fetch employees list for filter", err);
      }
    };
    fetchEmployees();
  }, [backendUrl]);

  // Main function to fetch the attendance report based on the current filter state
  const fetchReport = async () => {
    // Prevent fetching if dates are missing
    if (!filters.startDate || !filters.endDate) return;

    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filters.employeeId) params.append('employeeId', filters.employeeId);
      if (filters.status) params.append('status', filters.status);
      params.append('startDate', filters.startDate);
      params.append('endDate', filters.endDate);

      const response = await fetch(`${backendUrl}/api/attendance?${params.toString()}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to fetch the attendance report.');
      }
      
      const data = await response.json();
      setReportData(data);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // This useEffect will run once initially to fetch today's report.
  // After that, fetching is triggered by the search button.
  useEffect(() => {
    fetchReport();
  }, []);

  // Handler for the preset date filters ("Today", "This Month")
  const handleDateFilterPreset = (type) => {
    setFilterType(type);
    const today = new Date();
    let newStartDate, newEndDate;

    if (type === 'today') {
      newStartDate = today.toISOString().split('T')[0];
      newEndDate = today.toISOString().split('T')[0];
    } else if (type === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      newStartDate = firstDay.toISOString().split('T')[0];
      newEndDate = lastDay.toISOString().split('T')[0];
    }
    setFilters(prev => ({ ...prev, startDate: newStartDate, endDate: newEndDate }));
  };

  // Handler for all form input changes
  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    // If a custom date is changed, switch the active preset button to 'custom'
    if (e.target.name === 'startDate' || e.target.name === 'endDate') {
      setFilterType('custom');
    }
  };

  // Handler for the form submission
  const handleSearch = (e) => {
    e.preventDefault();
    fetchReport();
  };

  // Helper functions for formatting UI elements
  const formatTime = (dateString) => dateString ? new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--';
  const getStatusColor = (status) => {
    switch (status) {
      case 'Present': return 'bg-green-100 text-green-800';
      case 'Absent': return 'bg-red-100 text-red-800';
      case 'On Leave': return 'bg-blue-100 text-blue-800';
      case 'Holiday': return 'bg-gray-200 text-gray-800';
      case 'Half Day': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Employee Attendance Report</h1>

      {/* Enhanced Filter Bar */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <form onSubmit={handleSearch}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
              <select name="employeeId" value={filters.employeeId} onChange={handleFilterChange} className="w-full p-2 border border-gray-300 rounded-md">
                <option value="">All Employees</option>
                {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full p-2 border border-gray-300 rounded-md">
                <option value="">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="On Leave">On Leave</option>
                <option value="Half Day">Half Day</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range Presets</label>
              <div className="flex gap-2">
                  <button type="button" onClick={() => handleDateFilterPreset('today')} className={`w-full py-2 rounded-md font-semibold transition-colors ${filterType === 'today' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>Today</button>
                  <button type="button" onClick={() => handleDateFilterPreset('month')} className={`w-full py-2 rounded-md font-semibold transition-colors ${filterType === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>This Month</button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 items-end">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="w-full p-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="w-full p-2 border border-gray-300 rounded-md" />
              </div>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-semibold w-full">
                Search
              </button>
          </div>
        </form>
      </div>
      
      {error && <div className="p-4 rounded-lg bg-red-100 text-red-700 text-center">{error}</div>}

      {/* Report Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="5" className="text-center py-10 text-gray-500">Loading Report...</td></tr>
              ) : reportData.length > 0 ? (
                reportData.map(record => (
                  <tr key={record._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.employee?.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(record.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>{record.status}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatTime(record.checkIn)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatTime(record.checkOut)}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="text-center py-10 text-gray-500">No records found for the selected filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceReportPage;