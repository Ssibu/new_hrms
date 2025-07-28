import React, { useEffect, useState } from 'react';
import { useConfig } from '../context/ConfigContext';

const API_URL = 'http://localhost:5000/api/users';

const PERMISSIONS = [
  'employee:read', 'employee:create', 'employee:update', 'employee:delete',
  'task:read', 'task:create', 'task:update', 'task:delete',
  'leave:read', 'leave:create', 'leave:update', 'leave:delete',
  'admin:manage'
];
const ROLES = ['Admin', 'HR', 'Employee'];

const UserManagement = () => {
  const { user, loading: userLoading } = useConfig();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ role: '', permissions: [] });
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(API_URL, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch users');
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : data.data || []);
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const openEdit = (u) => {
    setEditUser(u);
    setEditForm({ role: u.role, permissions: u.permissions || [] });
  };
  const closeEdit = () => {
    setEditUser(null);
    setEditForm({ role: '', permissions: [] });
  };
  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'role') {
      setEditForm(f => ({ ...f, role: value }));
    } else if (name.startsWith('perm:')) {
      const perm = name.replace('perm:', '');
      setEditForm(f => ({
        ...f,
        permissions: checked
          ? [...f.permissions, perm]
          : f.permissions.filter(p => p !== perm)
      }));
    }
  };
  const saveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/${editUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editForm)
      });
      if (!res.ok) throw new Error('Failed to update user');
      closeEdit();
      // Refresh users
      const res2 = await fetch(API_URL, { credentials: 'include' });
      const data = await res2.json();
      setUsers(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

  // Filter and sort users
  const filteredAndSortedUsers = users
    .filter(u => {
      const matchesSearch = 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = filterRole === '' || u.role === filterRole;
      
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'permissions') {
        aValue = (aValue || []).length;
        bValue = (bValue || []).length;
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

  if (userLoading || loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user || (user.role !== 'Admin' && !(user.permissions && user.permissions.includes('admin:manage')))) {
    return <div className="text-red-600 p-8">Access denied.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg p-8 mt-8 transition-all duration-200 hover:shadow-2xl">
      <h2 className="text-3xl font-extrabold text-blue-900 mb-8 tracking-tight drop-shadow">User Management</h2>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      
      {/* Search and Filter Controls */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Input */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Users
            </label>
            <input
              type="text"
              id="search"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Role Filter */}
          <div>
            <label htmlFor="roleFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Role
            </label>
            <select
              id="roleFilter"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Roles</option>
              {ROLES.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          
          {/* Sort By */}
          <div>
            <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="role">Role</option>
              <option value="permissions">Permissions Count</option>
            </select>
          </div>
          
          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterRole('');
                setSortBy('name');
                setSortOrder('asc');
              }}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200 font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>
        
        {/* Results Count */}
        <div className="mt-3 text-sm text-gray-600">
          Showing {filteredAndSortedUsers.length} of {users.length} users
        </div>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-lg bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-base">
          <thead className="bg-blue-100 sticky top-0 z-10">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-200 transition-colors select-none"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1">
                  Name <SortIcon field="name" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-200 transition-colors select-none"
                onClick={() => handleSort('email')}
              >
                <div className="flex items-center gap-1">
                  Email <SortIcon field="email" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-200 transition-colors select-none"
                onClick={() => handleSort('role')}
              >
                <div className="flex items-center gap-1">
                  Role <SortIcon field="role" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-200 transition-colors select-none"
                onClick={() => handleSort('permissions')}
              >
                <div className="flex items-center gap-1">
                  Permissions <SortIcon field="permissions" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredAndSortedUsers.map(u => (
              <tr key={u._id} className="hover:bg-blue-50 transition">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{u.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{u.role}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {(u.permissions || []).length} permissions
                  </span>
                  {u.permissions && u.permissions.length > 0 && (
                    <div className="mt-1 text-xs text-gray-500">
                      {u.permissions.slice(0, 2).join(', ')}
                      {u.permissions.length > 2 && ` +${u.permissions.length - 2} more`}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded shadow font-semibold transition" onClick={() => openEdit(u)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-lg relative border-2 border-blue-100">
            <h3 className="text-2xl font-bold mb-6 text-blue-800">Edit User</h3>
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-blue-600 text-3xl font-bold focus:outline-none"
              onClick={closeEdit}
              aria-label="Close"
            >
              &times;
            </button>
            <form onSubmit={saveEdit} className="space-y-6">
              <div>
                <label className="block mb-2 font-semibold text-gray-700">Role</label>
                <select
                  name="role"
                  value={editForm.role}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block mb-2 font-semibold text-gray-700">Permissions</label>
                <div className="space-y-4">
                  {/* Employee Permissions */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-600 mb-2 border-b border-gray-200 pb-1">Employee Management</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {PERMISSIONS.filter(perm => perm.startsWith('employee:')).map(perm => (
                        <label key={perm} className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 transition cursor-pointer">
                          <input
                            type="checkbox"
                            name={`perm:${perm}`}
                            checked={editForm.permissions.includes(perm)}
                            onChange={handleEditChange}
                            className="form-checkbox h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition"
                          />
                          <span className="text-sm font-medium text-gray-700 select-none">{perm.replace('employee:', '').replace(/\b\w/g, l => l.toUpperCase())}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Task Permissions */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-600 mb-2 border-b border-gray-200 pb-1">Task Management</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {PERMISSIONS.filter(perm => perm.startsWith('task:')).map(perm => (
                        <label key={perm} className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 transition cursor-pointer">
                          <input
                            type="checkbox"
                            name={`perm:${perm}`}
                            checked={editForm.permissions.includes(perm)}
                            onChange={handleEditChange}
                            className="form-checkbox h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition"
                          />
                          <span className="text-sm font-medium text-gray-700 select-none">{perm.replace('task:', '').replace(/\b\w/g, l => l.toUpperCase())}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Leave Permissions */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-600 mb-2 border-b border-gray-200 pb-1">Leave Management</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {PERMISSIONS.filter(perm => perm.startsWith('leave:')).map(perm => (
                        <label key={perm} className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 transition cursor-pointer">
                          <input
                            type="checkbox"
                            name={`perm:${perm}`}
                            checked={editForm.permissions.includes(perm)}
                            onChange={handleEditChange}
                            className="form-checkbox h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition"
                          />
                          <span className="text-sm font-medium text-gray-700 select-none">{perm.replace('leave:', '').replace(/\b\w/g, l => l.toUpperCase())}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Admin Permissions */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-600 mb-2 border-b border-gray-200 pb-1">Administration</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {PERMISSIONS.filter(perm => perm.startsWith('admin:')).map(perm => (
                        <label key={perm} className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 transition cursor-pointer">
                          <input
                            type="checkbox"
                            name={`perm:${perm}`}
                            checked={editForm.permissions.includes(perm)}
                            onChange={handleEditChange}
                            className="form-checkbox h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition"
                          />
                          <span className="text-sm font-medium text-gray-700 select-none">{perm.replace('admin:', '').replace(/\b\w/g, l => l.toUpperCase())}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-8 rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl text-lg"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement; 