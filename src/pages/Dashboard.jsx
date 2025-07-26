import React, { useState, useEffect, useMemo } from 'react';
import { useConfig } from '../context/ConfigContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const { user } = useConfig();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
    totalUsers: 0,
    recentEmployees: [],
    recentTasks: []
  });
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [filteredTasks, setFilteredTasks] = useState([]);

  // Memoized lists of days and months for chart labels
  const weekDays = useMemo(() => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], []);
  const yearMonths = useMemo(() => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], []);

  // Helper function to get employee name by ID
  const getEmployeeName = (employeeId) => {
    if (!employeeId || typeof employeeId !== 'object' || !employeeId._id) return 'Unknown';
    const employee = employees.find(emp => emp._id === employeeId._id);
    return employee ? employee.name : `Employee ${employeeId._id.slice(-4)}`;
  };
  
  // Generic function to process and aggregate chart data
  const processChartData = (period) => {
    const tasksToUse = user?.role === 'Admin' && selectedEmployee !== 'all' ? filteredTasks : tasks;
    const completedTasks = tasksToUse.filter(task => task.status === 'completed' && task.rating && task.completedAt);
    
    const data = {};

    completedTasks.forEach(task => {
      const date = new Date(task.completedAt);
      const key = period === 'weekly' ? weekDays[date.getDay()] : yearMonths[date.getMonth()];
      const employeeName = getEmployeeName(task.assignedTo);
      
      if (!data[key]) data[key] = {};
      if (!data[key][employeeName]) data[key][employeeName] = [];
      data[key][employeeName].push(parseInt(task.rating));
    });

    // Calculate average ratings
    const processedData = {};
    Object.keys(data).forEach(key => {
      processedData[key] = {};
      Object.keys(data[key]).forEach(employee => {
        const ratings = data[key][employee];
        processedData[key][employee] = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
      });
    });
    
    return processedData;
  };

  // Generate chart data structure for ChartJS
  const generateChartData = (period) => {
    const labels = period === 'weekly' ? weekDays : yearMonths;
    const processedData = processChartData(period);
    const allEmployees = [...new Set(Object.values(processedData).flatMap(item => Object.keys(item)))];
    
    const colors = [
      'rgba(54, 162, 235, 0.8)', 'rgba(255, 99, 132, 0.8)',
      'rgba(75, 192, 192, 0.8)', 'rgba(153, 102, 255, 0.8)',
      'rgba(255, 159, 64, 0.8)', 'rgba(199, 199, 199, 0.8)',
      'rgba(83, 102, 255, 0.8)', 'rgba(255, 99, 255, 0.8)'
    ];

    return {
      labels,
      datasets: allEmployees.map((employee, index) => ({
        label: employee,
        data: labels.map(label => processedData[label]?.[employee] || 0),
        backgroundColor: colors[index % colors.length],
      })),
    };
  };
  
  // Fetch tasks for a specific employee (admin only)
  const fetchTasksByEmployee = async (employeeId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/employee-tasks/employee/${employeeId}`, {
        credentials: 'include'
      });
      if (response.ok) {
        setFilteredTasks(await response.json());
      } else {
        setFilteredTasks([]);
      }
    } catch (err) {
      console.error('Error fetching tasks by employee:', err);
      setFilteredTasks([]);
    }
  };

  // Handle employee selection change
  const handleEmployeeSelection = (employeeId) => {
    setSelectedEmployee(employeeId);
    if (employeeId === 'all') {
      setFilteredTasks(tasks);
    } else {
      fetchTasksByEmployee(employeeId);
    }
  };
  
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [employeesRes, tasksRes, usersRes] = await Promise.all([
        fetch('http://localhost:5000/api/employees', { credentials: 'include' }),
        user && (user.role === 'Admin' || user.permissions?.includes('task:read'))
          ? fetch('http://localhost:5000/api/employee-tasks', { credentials: 'include' })
          : Promise.resolve({ ok: false }),
        user && (user.role === 'Admin' || user.permissions?.includes('admin:manage'))
          ? fetch('http://localhost:5000/api/users', { credentials: 'include' })
          : Promise.resolve({ ok: false })
      ]);

      const employeesData = employeesRes.ok ? await employeesRes.json() : [];
      const tasksData = tasksRes.ok ? await tasksRes.json() : [];
      const usersData = usersRes.ok ? await usersRes.json() : [];
      
      setEmployees(employeesData);
      setTasks(tasksData);
      setFilteredTasks(tasksData); // Initially show all tasks

      setStats({
        totalEmployees: employeesData.length,
        totalTasks: tasksData.length,
        pendingTasks: tasksData.filter(t => ['open', 'claimed', 'in_progress', 'paused'].includes(t.status)).length,
        completedTasks: tasksData.filter(t => t.status === 'completed').length,
        totalUsers: usersData.length,
        recentEmployees: employeesData.slice(-5).reverse(),
        recentTasks: tasksData.slice(-5).reverse()
      });
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Update filtered tasks when selectedEmployee changes
  useEffect(() => {
    if (selectedEmployee === 'all') {
      setFilteredTasks(tasks);
    } else {
      fetchTasksByEmployee(selectedEmployee);
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployee, tasks]);

  // Render components
  const StatCard = ({ title, value, icon, color, description }) => (
    <div className={`bg-gradient-to-br ${color} rounded-2xl shadow-lg p-6 text-white transition-all duration-300 hover:shadow-2xl hover:scale-105`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {description && <p className="text-white/70 text-xs mt-1">{description}</p>}
        </div>
        <div className="text-4xl opacity-80">{icon}</div>
      </div>
    </div>
  );

  const RecentActivityCard = ({ title, items, emptyMessage, renderItem }) => (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>
      <div className="space-y-3">
        {items.length > 0 ? (
          items.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              {renderItem(item)}
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">{emptyMessage}</p>
        )}
      </div>
    </div>
  );
  
  const ChartCard = ({ title, chartData, period }) => (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>
      <div className="h-80">
        <Bar 
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: { display: true, text: `Average Task Ratings by ${period === 'weekly' ? 'Day of Week' : 'Month'}` },
              legend: { position: 'top' },
              tooltip: {
                callbacks: {
                  label: (context) => `${context.dataset.label}: ${context.parsed.y.toFixed(1)}/5`,
                },
              },
            },
            scales: {
              y: { beginAtZero: true, max: 5, title: { display: true, text: 'Rating (1-5)' } },
              x: { title: { display: true, text: period === 'weekly' ? 'Day of the Week' : 'Month' } },
            },
            interaction: { intersect: false, mode: 'index' },
          }}
        />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name || 'User'}! 👋</h1>
        <p className="text-blue-100 text-lg">Here's what's happening in your organization today.</p>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Employees" value={stats.totalEmployees} icon="👥" color="from-blue-500 to-blue-600" description="Active employees" />
        {user && (user.role === 'Admin' || user.permissions?.includes('task:read')) && (
          <>
            <StatCard title="Total Tasks" value={stats.totalTasks} icon="📋" color="from-green-500 to-green-600" description="All tasks" />
            <StatCard title="Pending Tasks" value={stats.pendingTasks} icon="⏳" color="from-yellow-500 to-orange-500" description="In progress + pending" />
            <StatCard title="Completed Tasks" value={stats.completedTasks} icon="✅" color="from-purple-500 to-purple-600" description="Successfully completed" />
          </>
        )}
        {user && (user.role === 'Admin' || user.permissions?.includes('admin:manage')) && (
          <StatCard title="Total Users" value={stats.totalUsers} icon="👤" color="from-indigo-500 to-indigo-600" description="System users" />
        )}
      </div>

      {/* Task Rating Charts */}
      {user && (user.role === 'Admin' || user.permissions?.includes('task:read')) && stats.completedTasks > 0 && (
        <div className="space-y-6">
          {user?.role === 'Admin' && (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center gap-4">
                <label htmlFor="employee-filter" className="text-sm font-medium text-gray-700">Filter by Employee:</label>
                <select id="employee-filter" value={selectedEmployee} onChange={(e) => handleEmployeeSelection(e.target.value)} className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="all">All Employees</option>
                  {employees.map((employee) => (
                    <option key={employee._id} value={employee._id}>{employee.name} ({employee.empId})</option>
                  ))}
                </select>
                {selectedEmployee !== 'all' && <button onClick={() => handleEmployeeSelection('all')} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Clear Filter</button>}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ChartCard title="Weekly Task Ratings" chartData={generateChartData('weekly')} period="weekly" />
            <ChartCard title="Monthly Task Ratings" chartData={generateChartData('monthly')} period="monthly" />
          </div>
        </div>
      )}

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentActivityCard
          title="Recent Employees"
          items={stats.recentEmployees}
          emptyMessage="No employees found"
          renderItem={(employee) => (
            <>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">{employee.name?.charAt(0)?.toUpperCase()}</div>
                <div>
                  <p className="font-medium text-gray-800">{employee.name}</p>
                  <p className="text-sm text-gray-500">{employee.empId}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600">{employee.role}</p>
                <p className="text-xs text-gray-400">{employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString() : ''}</p>
              </div>
            </>
          )}
        />
        {user && (user.role === 'Admin' || user.permissions?.includes('task:read')) && (
          <RecentActivityCard
            title="Recent Tasks"
            items={stats.recentTasks}
            emptyMessage="No tasks found"
            renderItem={(task) => (
              <>
                <div>
                  <p className="font-medium text-gray-800">{task.title}</p>
                  <p className="text-sm text-gray-500">{task.description?.substring(0, 50)}...</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    task.status === 'completed' ? 'bg-green-100 text-green-800' :
                    task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>{task.status}</span>
                  <p className="text-xs text-gray-400 mt-1">Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</p>
                </div>
              </>
            )}
          />
        )}
      </div>

       {/* Quick Actions */}
       <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {user && (user.role === 'Admin' || user.permissions?.includes('employee:create')) && (
            <button onClick={() => window.location.href = '/layout/employees'} className="flex items-center justify-center space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-3 px-6 rounded-lg transition-colors">
              <span>👥</span>
              <span>Manage Employees</span>
            </button>
          )}
          {user && (user.role === 'Admin' || user.permissions?.includes('task:create')) && (
            <button onClick={() => window.location.href = '/layout/tasks'} className="flex items-center justify-center space-x-2 bg-green-50 hover:bg-green-100 text-green-700 font-medium py-3 px-6 rounded-lg transition-colors">
              <span>📋</span>
              <span>Manage Tasks</span>
            </button>
          )}
          {user && (user.role === 'Admin' || user.permissions?.includes('admin:manage')) && (
            <button onClick={() => window.location.href = '/layout/users'} className="flex items-center justify-center space-x-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium py-3 px-6 rounded-lg transition-colors">
              <span>👤</span>
              <span>Manage Users</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;