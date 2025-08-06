import React, { useState, useEffect } from 'react';
import { useConfig } from '../context/ConfigContext';

const API_URL = 'http://localhost:5000/api/employees';

const EmployeesDetails = () => {
  const { user } = useConfig();
  const [employees, setEmployees] = useState([]);

  // --- State for the form modal ---
  const [formData, setFormData] = useState({
    name: '',
    emailId: '', // Use emailId to match the backend schema
    empId: '',
    number: '',
    address: '',
    experience: '',
    dateOfJoining: '',
    salary: '',
    role: 'employee', // Add the new 'role' field
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --- State for filtering and sorting ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Permission checks
  const hasActionPermissions = user && (user.role === 'Admin' ||
    (user.permissions && (user.permissions.includes('employee:update') || user.permissions.includes('employee:delete'))));

  // Fetch employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  // --- API Interaction Functions ---

  const fetchEmployees = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(API_URL, { credentials: 'include' });
      if (!res.ok) {
        throw new Error('Failed to fetch employees. Please ensure you are logged in.');
      }
      const data = await res.json();
      setEmployees(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const getApiErrorMessage = async (response) => {
    try {
      const errorData = await response.json();
      return errorData.error || `Request failed with status ${response.status}`;
    } catch {
      return `Request failed with status ${response.status}`;
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee? This will also delete their user account.')) {
      return;
    }
    setError('');
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) {
        const message = await getApiErrorMessage(res);
        throw new Error(message);
      }
      fetchEmployees();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const url = editId ? `${API_URL}/${editId}` : API_URL;
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, salary: Number(formData.salary) }),
      });

      if (!res.ok) {
        const message = await getApiErrorMessage(res);
        throw new Error(message);
      }

      closeModal();
      fetchEmployees();
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  // --- UI Handlers ---

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const openAddModal = () => {
    setEditId(null);
    setError('');
    setFormData({
      name: '', emailId: '', empId: '', number: '', address: '', experience: '',
      dateOfJoining: '', salary: '', role: 'employee',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (emp) => {
    setEditId(emp._id);
    setError('');
    setFormData({
      name: emp.name || '',
      emailId: emp.emailId || '',
      empId: emp.empId || '',
      number: emp.number || '',
      address: emp.address || '',
      experience: emp.experience || '',
      dateOfJoining: emp.dateOfJoining ? emp.dateOfJoining.substring(0, 10) : '',
      salary: emp.salary || '',
      role: emp.role || 'employee',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // --- Derived State (Filtering and Sorting) ---

  const filteredAndSortedEmployees = employees
    .filter((emp) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        emp.name?.toLowerCase().includes(searchLower) ||
        emp.emailId?.toLowerCase().includes(searchLower) ||
        emp.empId?.toLowerCase().includes(searchLower);
      const matchesRole = filterRole === '' || emp.role === filterRole;
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      let aValue = a[sortBy] ?? '';
      let bValue = b[sortBy] ?? '';
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();
      if (sortOrder === 'asc') return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    });

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <span className="text-gray-400">↕️</span>;
    return <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  // --- Render ---

  return (
    <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-lg p-8 transition-all duration-200 hover:shadow-2xl">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-extrabold text-blue-900 tracking-tight drop-shadow">Employees</h2>
        <button
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-8 rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={!user || !(user.role === 'Admin' || user.permissions?.includes('employee:create'))}
        >
          + Add Employee
        </button>
      </div>
      
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">{error}</div>}
      
      <div className="mb-6 bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Search by name, email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Roles</option>
            <option value="hr">HR</option>
            <option value="manager">Manager</option>
            <option value="employee">Employee</option>
          </select>
        </div>
      </div>
      
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-3xl relative border-2 border-blue-100">
            <h3 className="text-2xl font-bold mb-6 text-blue-800">{editId ? 'Edit Employee' : 'Add Employee'}</h3>
            <button onClick={closeModal} className="absolute top-3 right-3 text-gray-400 hover:text-blue-600 text-3xl font-bold">&times;</button>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <input name="name" value={formData.name} onChange={handleInputChange} placeholder="Name" required className="w-full border border-gray-300 rounded-lg p-2" />
                <input name="emailId" type="email" value={formData.emailId} onChange={handleInputChange} placeholder="Email" required className="w-full border border-gray-300 rounded-lg p-2" />
                <input name="empId" value={formData.empId} onChange={handleInputChange} placeholder="Employee ID" required className="w-full border border-gray-300 rounded-lg p-2" />
                <input name="number" value={formData.number} onChange={handleInputChange} placeholder="Phone Number" required className="w-full border border-gray-300 rounded-lg p-2" />
                <input name="address" value={formData.address} onChange={handleInputChange} placeholder="Address" required className="w-full border border-gray-300 rounded-lg p-2" />
                <input name="experience" value={formData.experience} onChange={handleInputChange} placeholder="Experience (e.g., 3 years)" required className="w-full border border-gray-300 rounded-lg p-2" />
                <input type="date" name="dateOfJoining" value={formData.dateOfJoining} onChange={handleInputChange} required className="w-full border border-gray-300 rounded-lg p-2" />
                <input type="number" name="salary" value={formData.salary} onChange={handleInputChange} placeholder="Salary" required className="w-full border border-gray-300 rounded-lg p-2" />
                <select name="role" value={formData.role} onChange={handleInputChange} required className="w-full border border-gray-300 rounded-lg p-2">
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="hr">HR</option>
                </select>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-8 rounded-xl disabled:bg-gray-400">
                  {loading ? 'Saving...' : (editId ? 'Update Employee' : 'Add Employee')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-lg bg-white">
        {loading ? <p className="p-4">Loading employees...</p> : (
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-blue-100">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-200" onClick={() => handleSort('name')}><div className="flex items-center">Name <SortIcon field="name" /></div></th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-200" onClick={() => handleSort('emailId')}><div className="flex items-center">Email <SortIcon field="emailId" /></div></th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-200" onClick={() => handleSort('empId')}><div className="flex items-center">Emp ID <SortIcon field="empId" /></div></th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-200" onClick={() => handleSort('role')}><div className="flex items-center">Role <SortIcon field="role" /></div></th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Joining Date</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Salary</th>
              {hasActionPermissions && <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredAndSortedEmployees.map((emp) => (
              <tr key={emp._id} className="hover:bg-blue-50">
                <td className="px-6 py-4 whitespace-nowrap">{emp.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{emp.emailId}</td>
                <td className="px-6 py-4 whitespace-nowrap">{emp.empId}</td>
                <td className="px-6 py-4 whitespace-nowrap capitalize">{emp.role}</td>
                <td className="px-6 py-4 whitespace-nowrap">{emp.number}</td>
                <td className="px-6 py-4 whitespace-nowrap">{emp.dateOfJoining?.substring(0, 10)}</td>
                <td className="px-6 py-4 whitespace-nowrap">${emp.salary?.toLocaleString()}</td>
                {hasActionPermissions && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm flex gap-2">
                    <button onClick={() => handleEdit(emp)} className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded shadow">Edit</button>
                    <button onClick={() => handleDelete(emp._id)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded shadow">Delete</button>
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