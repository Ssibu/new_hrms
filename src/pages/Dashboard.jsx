import React, { useState, useEffect } from 'react';
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

  // Helper function to get week number from date
  const getWeekNumber = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  };

  // Helper function to format month-year
  const getMonthYear = (date) => {
    const d = new Date(date);
    return `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
  };

  // Helper function to get employee name by ID
  const getEmployeeName = (employeeId) => {
    if (!employeeId) return 'Unknown Employee';
    console.log("hey there....",employeeId)
    console.log("hi employee....",employeeId)
    const employee = employees.find(emp => emp._id === employeeId._id);
    
    return employee ? employee.name : `Employee ${employeeId._id.slice(-4)}`;
  };

  // Process weekly task ratings data
  const getWeeklyRatingsData = () => {
    const tasksToUse = user?.role === 'Admin' && selectedEmployee !== 'all' ? filteredTasks : tasks;
    const completedTasks = tasksToUse.filter(task => task.status === 'completed' && task.rating);
    console.log('Completed tasks with ratings:', completedTasks);
    const weeklyData = {};

    completedTasks.forEach(task => {
      if (task.completedAt && task.rating) {
        const weekKey = `Week ${getWeekNumber(task.completedAt)} ${new Date(task.completedAt).getFullYear()}`;
        const employeeName = getEmployeeName(task.assignedTo);
        
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = {};
        }
        if (!weeklyData[weekKey][employeeName]) {
          weeklyData[weekKey][employeeName] = [];
        }
        weeklyData[weekKey][employeeName].push(parseInt(task.rating));
      }
      console.log(completedTasks)
    });

    console.log('Weekly data before processing:', weeklyData);

    // Calculate average ratings for each employee per week
    const processedData = {};
    Object.keys(weeklyData).forEach(week => {
      processedData[week] = {};
      Object.keys(weeklyData[week]).forEach(employee => {
        const ratings = weeklyData[week][employee];
        processedData[week][employee] = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
      });
    });

    console.log('Processed weekly data:', processedData);
    return processedData;
  };

  // Process monthly task ratings data
  const getMonthlyRatingsData = () => {
    const tasksToUse = user?.role === 'Admin' && selectedEmployee !== 'all' ? filteredTasks : tasks;
    const completedTasks = tasksToUse.filter(task => task.status === 'completed' && task.rating);
    console.log('Monthly completed tasks with ratings:', completedTasks);
    const monthlyData = {};

    completedTasks.forEach(task => {
      if (task.completedAt && task.rating) {
        const monthKey = getMonthYear(task.completedAt);
        const employeeName = getEmployeeName(task.assignedTo);
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {};
        }
        if (!monthlyData[monthKey][employeeName]) {
          monthlyData[monthKey][employeeName] = [];
        }
        monthlyData[monthKey][employeeName].push(parseInt(task.rating));
      }
    });

    console.log('Monthly data before processing:', monthlyData);

    // Calculate average ratings for each employee per month
    const processedData = {};
    Object.keys(monthlyData).forEach(month => {
      processedData[month] = {};
      Object.keys(monthlyData[month]).forEach(employee => {
        const ratings = monthlyData[month][employee];
        processedData[month][employee] = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
      });
    });

    console.log('Processed monthly data:', processedData);
    return processedData;
  };

  // Generate chart data for weekly ratings
  const getWeeklyChartData = () => {
    try {
      const weeklyData = getWeeklyRatingsData();
      const weeks = Object.keys(weeklyData).sort();
      const allEmployees = [...new Set(Object.values(weeklyData).flatMap(week => Object.keys(week)))];
      
      console.log('Weekly chart - weeks:', weeks);
      console.log('Weekly chart - employees:', allEmployees);
      
      // Return empty chart data if no data available
      if (weeks.length === 0 || allEmployees.length === 0) {
        return {
          labels: [],
          datasets: []
        };
      }
      
      const colors = [
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 99, 132, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)',
        'rgba(255, 159, 64, 0.8)',
        'rgba(199, 199, 199, 0.8)',
        'rgba(83, 102, 255, 0.8)',
        'rgba(255, 99, 255, 0.8)'
      ];

      const datasets = allEmployees.map((employee, index) => {
        const data = weeks.map(week => weeklyData[week]?.[employee] || 0);
        console.log(`Weekly data for ${employee}:`, data);
        return {
          label: employee,
          data: data,
          backgroundColor: colors[index % colors.length],
          borderColor: colors[index % colors.length].replace('0.8', '1'),
          borderWidth: 1
        };
      });

      const chartData = {
        labels: weeks,
        datasets
      };
      
      console.log('Final weekly chart data:', chartData);
      return chartData;
    } catch (error) {
      console.error('Error generating weekly chart data:', error);
      return {
        labels: [],
        datasets: []
      };
    }
  };

  // Generate chart data for monthly ratings
  const getMonthlyChartData = () => {
    try {
      const monthlyData = getMonthlyRatingsData();
      const months = Object.keys(monthlyData).sort((a, b) => {
        return new Date(a + ' 1') - new Date(b + ' 1');
      });
      const allEmployees = [...new Set(Object.values(monthlyData).flatMap(month => Object.keys(month)))];
      
      console.log('Monthly chart - months:', months);
      console.log('Monthly chart - employees:', allEmployees);
      
      // Return empty chart data if no data available
      if (months.length === 0 || allEmployees.length === 0) {
        return {
          labels: [],
          datasets: []
        };
      }
      
      const colors = [
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 99, 132, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)',
        'rgba(255, 159, 64, 0.8)',
        'rgba(199, 199, 199, 0.8)',
        'rgba(83, 102, 255, 0.8)',
        'rgba(255, 99, 255, 0.8)'
      ];

      const datasets = allEmployees.map((employee, index) => {
        const data = months.map(month => monthlyData[month]?.[employee] || 0);
        console.log(`Monthly data for ${employee}:`, data);
        return {
          label: employee,
          data: data,
          backgroundColor: colors[index % colors.length],
          borderColor: colors[index % colors.length].replace('0.8', '1'),
          borderWidth: 1
        };
      });

      const chartData = {
        labels: months,
        datasets
      };
      
      console.log('Final monthly chart data:', chartData);
      return chartData;
    } catch (error) {
      console.error('Error generating monthly chart data:', error);
      return {
        labels: [],
        datasets: []
      };
    }
  };

  // Fetch tasks for a specific employee (admin only)
  const fetchTasksByEmployee = async (employeeId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/employee-tasks/employee/${employeeId}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setFilteredTasks(data);
        console.log(filteredTasks)
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Update filtered tasks when tasks or selectedEmployee changes
  useEffect(() => {
    if (selectedEmployee === 'all') {
      setFilteredTasks(tasks);
    } else if (selectedEmployee !== 'all' && selectedEmployee) {
      fetchTasksByEmployee(selectedEmployee);
    }
  }, [tasks, selectedEmployee]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch employees data
      const employeesRes = await fetch('http://localhost:5000/api/employees', { 
        credentials: 'include' 
      });
      const employeesData = employeesRes.ok ? await employeesRes.json() : [];
      setEmployees(employeesData);

      // Fetch tasks data if user has permission
      let tasksData = [];
      if (user && (user.role === 'Admin' || (user.permissions && user.permissions.includes('task:read')))) {
        const tasksRes = await fetch('http://localhost:5000/api/employee-tasks', { 
          credentials: 'include' 
        });
        tasksData = tasksRes.ok ? await tasksRes.json() : [];
        setTasks(tasksData);
        console.log('Tasks data:', tasksData);
      }

      // Fetch users data if user is admin
      let users = [];
      if (user && (user.role === 'Admin' || (user.permissions && user.permissions.includes('admin:manage')))) {
        const usersRes = await fetch('http://localhost:5000/api/users', { 
          credentials: 'include' 
        });
        users = usersRes.ok ? await usersRes.json() : [];
      }

      // Calculate statistics
      const pendingTasks = tasksData.filter(task => task.status === 'pending' || task.status === 'in-progress').length;
      const completedTasks = tasksData.filter(task => task.status === 'completed').length;
      
      // Debug logging
      console.log('All tasks data:', tasksData);
      console.log('Completed tasks:', tasksData.filter(task => task.status === 'completed'));
      console.log('Completed tasks with ratings:', tasksData.filter(task => task.status === 'completed' && task.rating));

      setStats({
        totalEmployees: employeesData.length,
        totalTasks: tasksData.length,
        pendingTasks,
        completedTasks,
        totalUsers: users.length,
        recentEmployees: employeesData.slice(-5).reverse(), // Last 5 employees
        recentTasks: tasksData.slice(-5).reverse() // Last 5 tasks
      });
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, description }) => (
    <div className={`bg-gradient-to-br ${color} rounded-2xl shadow-lg p-6 text-white transition-all duration-300 hover:shadow-2xl hover:scale-105`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {description && <p className="text-white/70 text-xs mt-1">{description}</p>}
        </div>
        <div className="text-4xl opacity-80">
          {icon}
        </div>
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
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.name || 'User'}! 👋
        </h1>
        <p className="text-blue-100 text-lg">
          Here's what's happening in your organization today.
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Always show employees stats */}
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees}
          icon="👥"
          color="from-blue-500 to-blue-600"
          description="Active employees"
        />

        {/* Show tasks stats only if user has permission */}
        {user && (user.role === 'Admin' || (user.permissions && user.permissions.includes('task:read'))) && (
          <>
            <StatCard
              title="Total Tasks"
              value={stats.totalTasks}
              icon="📋"
              color="from-green-500 to-green-600"
              description="All tasks"
            />
            <StatCard
              title="Pending Tasks"
              value={stats.pendingTasks}
              icon="⏳"
              color="from-yellow-500 to-orange-500"
              description="In progress + pending"
            />
            <StatCard
              title="Completed Tasks"
              value={stats.completedTasks}
              icon="✅"
              color="from-purple-500 to-purple-600"
              description="Successfully completed"
            />
          </>
        )}

        {/* Show users stats only for admin */}
        {user && (user.role === 'Admin' || (user.permissions && user.permissions.includes('admin:manage'))) && (
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon="👤"
            color="from-indigo-500 to-indigo-600"
            description="System users"
          />
        )}
      </div>

      {/* Task Rating Charts - only show if user has task permissions and there are completed tasks */}
      {user && (user.role === 'Admin' || (user.permissions && user.permissions.includes('task:read'))) && tasks.filter(task => task.status === 'completed' && task.rating).length > 0 && (
        <div className="space-y-6">
          {/* Employee Filter (Admin Only) */}
          {user?.role === 'Admin' && (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center gap-4">
                <label htmlFor="employee-filter" className="text-sm font-medium text-gray-700">
                  Filter by Employee:
                </label>
                <select
                  id="employee-filter"
                  value={selectedEmployee}
                  onChange={(e) => handleEmployeeSelection(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="all">All Employees</option>
                  {employees.map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.name} ({employee.empId})
                    </option>
                  ))}
                </select>
                {selectedEmployee !== 'all' && (
                  <button
                    onClick={() => handleEmployeeSelection('all')}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Weekly Task Ratings Chart */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Weekly Task Ratings</h3>
            <div className="h-80">
              <Bar 
                data={getWeeklyChartData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    title: {
                      display: true,
                      text: 'Average Task Ratings by Week'
                    },
                    legend: {
                      position: 'top',
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}/5`;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 5,
                      title: {
                        display: true,
                        text: 'Rating (1-5)'
                      }
                    },
                    x: {
                      title: {
                        display: true,
                        text: 'Week'
                      }
                    }
                  },
                  interaction: {
                    intersect: false,
                    mode: 'index'
                  }
                }}
              />
            </div>
          </div>

          {/* Monthly Task Ratings Chart */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Monthly Task Ratings</h3>
            <div className="h-80">
              <Bar 
                data={getMonthlyChartData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    title: {
                      display: true,
                      text: 'Average Task Ratings by Month'
                    },
                    legend: {
                      position: 'top',
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}/5`;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 5,
                      title: {
                        display: true,
                        text: 'Rating (1-5)'
                      }
                    },
                    x: {
                      title: {
                        display: true,
                        text: 'Month'
                      }
                    }
                  },
                  interaction: {
                    intersect: false,
                    mode: 'index'
                  }
                }}
              />
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Employees */}
        <RecentActivityCard
          title="Recent Employees"
          items={stats.recentEmployees}
          emptyMessage="No employees found"
          renderItem={(employee) => (
            <>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {employee.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{employee.name}</p>
                  <p className="text-sm text-gray-500">{employee.empId}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600">{employee.role}</p>
                <p className="text-xs text-gray-400">
                  {employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString() : ''}
                </p>
              </div>
            </>
          )}
        />

        {/* Recent Tasks - only show if user has permission */}
        {user && (user.role === 'Admin' || (user.permissions && user.permissions.includes('task:read'))) && (
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
                    task.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : task.status === 'in-progress'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {task.status}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">
                    Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}
                  </p>
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
          {/* Always show employee actions if user has permission */}
          {user && (user.role === 'Admin' || (user.permissions && user.permissions.includes('employee:create'))) && (
            <button 
              onClick={() => window.location.href = '/layout/employees'}
              className="flex items-center justify-center space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-3 px-6 rounded-lg transition-colors"
            >
              <span>👥</span>
              <span>Manage Employees</span>
            </button>
          )}

          {/* Show task actions only if user has permission */}
          {user && (user.role === 'Admin' || (user.permissions && user.permissions.includes('task:create'))) && (
            <button 
              onClick={() => window.location.href = '/layout/tasks'}
              className="flex items-center justify-center space-x-2 bg-green-50 hover:bg-green-100 text-green-700 font-medium py-3 px-6 rounded-lg transition-colors"
            >
              <span>📋</span>
              <span>Manage Tasks</span>
            </button>
          )}

          {/* Show user management only for admin */}
          {user && (user.role === 'Admin' || (user.permissions && user.permissions.includes('admin:manage'))) && (
            <button 
              onClick={() => window.location.href = '/layout/users'}
              className="flex items-center justify-center space-x-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium py-3 px-6 rounded-lg transition-colors"
            >
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
