import React, { useState, useEffect } from 'react';
import { useConfig } from '../context/ConfigContext';

const API_URL = 'http://localhost:5000/api/employees';

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

const EmployeesDetails = () => {
  const { user } = useConfig();
  const [employees, setEmployees] = useState([]);
  
  // Check if user has any action permissions
  const hasActionPermissions = user && (user.role === 'Admin' || 
    (user.permissions && (user.permissions.includes('employee:update') || user.permissions.includes('employee:delete'))));
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    empId: '',
    number: '',
    address: '',
    experience: '',
    dateOfJoining: '',
    salary: ''
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Fetch employees from backend
  useEffect(() => {
    fetchEmployees();
    console.log(employees)

  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(API_URL, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch employees');
      const data = await res.json();
      setEmployees(data);
      
    } catch (err) {
      setError(err.message);
    }
    
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (emp) => {
    setEditId(emp._id);
    setFormData({
      name: emp.name || '',
      email: emp.email || '',
      empId: emp.empId || '',
      number: emp.number || '',
      address: emp.address || '',
      experience: emp.experience || '',
      dateOfJoining: emp.dateOfJoining ? emp.dateOfJoining.substring(0, 10) : '',
      salary: emp.salary || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    setError('');
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed to delete employee');
      fetchEmployees();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editId) {
        // Edit mode
        const res = await fetch(`${API_URL}/${editId}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, salary: Number(formData.salary) })
        });
        if (!res.ok) throw new Error('Failed to update employee');
      } else {
        // Add mode
        const res = await fetch(API_URL, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, salary: Number(formData.salary) })
        });
        if (!res.ok) throw new Error('Failed to add employee');
      }
      setFormData({ name: '', email: '', empId: '', number: '', address: '', experience: '', dateOfJoining: '', salary: '' });
      setIsModalOpen(false);
      setEditId(null);
      fetchEmployees();
    } catch (err) {
      setError(err.message);
    }
  };

  // Filter and sort employees
  const filteredAndSortedEmployees = employees
    .filter(emp => {
      const matchesSearch = 
        emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.empId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.address?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = filterRole === '' || emp.role === filterRole;
      
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      // Handle different data types
      if (sortBy === 'salary') {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      } else if (sortBy === 'dateOfJoining') {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
      } else {
        aValue = String(aValue || '').toLowerCase();
        bValue = String(bValue || '').toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <span className="text-gray-400">↕️</span>;
    return <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-lg p-8 transition-all duration-200 hover:shadow-2xl">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-extrabold text-blue-900 tracking-tight drop-shadow">Employees</h2>
        <button
          onClick={() => { setIsModalOpen(true); setEditId(null); setFormData({ name: '', email: '', empId: '', number: '', address: '', experience: '', dateOfJoining: '', salary: '' }); }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-8 rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl text-lg"
          disabled={!user || !(user.role === 'Admin' || (user.permissions && user.permissions.includes('employee:create')))}
        >
          + Add Employee
        </button>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {/* Search and Filter Controls */}
      <div className="mb-6 bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Employees</label>
            <input
              type="text"
              placeholder="Search by name, email, ID, phone, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          
          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Role</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">All Roles</option>
              <option value="hr">HR</option>
              <option value="manager">Manager</option>
              <option value="employee">Employee</option>
            </select>
          </div>
          
          {/* Sort Controls */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="empId">Employee ID</option>
              <option value="dateOfJoining">Date of Joining</option>
              <option value="salary">Salary</option>
              <option value="role">Role</option>
            </select>
          </div>
        </div>
        
        {/* Results Summary */}
        <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
          <span>
            Showing {filteredAndSortedEmployees.length} of {employees.length} employees
          </span>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterRole('');
              setSortBy('name');
              setSortOrder('asc');
            }}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear Filters
          </button>
        </div>
      </div>
      
      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-3xl relative border-2 border-blue-100">
            <h3 className="text-2xl font-bold mb-6 text-blue-800">{editId ? 'Edit Employee' : 'Add Employee'}</h3>
            <button
              onClick={() => { setIsModalOpen(false); setEditId(null); }}
              className="absolute top-3 right-3 text-gray-400 hover:text-blue-600 text-3xl font-bold focus:outline-none"
              aria-label="Close"
            >
              &times;
            </button>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                  <input
                    name="empId"
                    value={formData.empId}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    name="number"
                    value={formData.number}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
                  <input
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    placeholder="e.g. 3 years"
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Joining</label>
                  <input
                    type="date"
                    name="dateOfJoining"
                    value={formData.dateOfJoining}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salary</label>
                  <input
                    type="number"
                    name="salary"
                    value={formData.salary}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-8 rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl text-lg"
                >
                  {editId ? 'Update Employee' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Employees Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-lg bg-white">
        {loading ? <p>Loading employees...</p> : (
        <table className="min-w-full divide-y divide-gray-200 text-base">
          <thead className="bg-blue-100 sticky top-0 z-10">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-200 transition-colors" onClick={() => handleSort('name')}>
                <div className="flex items-center space-x-1">
                  <span>Name</span>
                  <SortIcon field="name" />
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-200 transition-colors" onClick={() => handleSort('email')}>
                <div className="flex items-center space-x-1">
                  <span>Email</span>
                  <SortIcon field="email" />
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-200 transition-colors" onClick={() => handleSort('empId')}>
                <div className="flex items-center space-x-1">
                  <span>Employee ID</span>
                  <SortIcon field="empId" />
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-200 transition-colors" onClick={() => handleSort('dateOfJoining')}>
                <div className="flex items-center space-x-1">
                  <span>Date of Joining</span>
                  <SortIcon field="dateOfJoining" />
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-200 transition-colors" onClick={() => handleSort('salary')}>
                <div className="flex items-center space-x-1">
                  <span>Salary</span>
                  <SortIcon field="salary" />
                </div>
              </th>
              {hasActionPermissions && (
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredAndSortedEmployees.map((emp, idx) => (
              <tr key={emp._id || emp.id} className={idx % 2 === 0 ? 'bg-blue-50 hover:bg-blue-100 transition' : 'hover:bg-blue-50 transition'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{emp._id || emp.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.empId}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.number}</td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{emp.address}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.experience}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.dateOfJoining ? emp.dateOfJoining.substring(0, 10) : ''}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${emp.salary?.toLocaleString()}</td>
                {hasActionPermissions && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm flex gap-2">
                    {user && (user.role === 'Admin' || (user.permissions && user.permissions.includes('employee:update'))) && (
                      <button
                        onClick={() => handleEdit(emp)}
                        className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded shadow"
                      >
                        Edit
                      </button>
                    )}
                    {user && (user.role === 'Admin' || (user.permissions && user.permissions.includes('employee:delete'))) && (
                      <button
                        onClick={() => handleDelete(emp._id || emp.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded shadow"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
};

export default EmployeesDetails; 