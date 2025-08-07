import React, { useEffect, useState } from 'react';
import { useConfig } from '../context/ConfigContext';

// The API URL is correct for managing user roles and permissions.
const API_URL = 'http://localhost:5000/api/users';

// --- MODIFIED: Added all necessary permissions for the system ---
const PERMISSIONS = [
  'employee:read', 'employee:create', 'employee:update', 'employee:delete',
  'task:read', 'task:create', 'task:update', 'task:delete',
  'leave:read', 'leave:create', 'leave:update', 'leave:delete',
  'attendance:read', 'attendance:update', // For viewing reports and making manual edits
  'payroll:read', 'payroll:create',      // For viewing and generating payslips
  'admin:manage'
];
const ROLES = ['Admin', 'HR', 'Manager', 'Employee']; // Added 'Manager' for consistency

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
    const { name, value, checked } = e.target;
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
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update user');
      }
      closeEdit();
      // Refresh users list
      const res2 = await fetch(API_URL, { credentials: 'include' });
      const data = await res2.json();
      setUsers(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

  const filteredAndSortedUsers = users
    .filter(u => 
        (u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (filterRole === '' || u.role === filterRole)
    )
    .sort((a, b) => {
      let aValue = a[sortBy] || '';
      let bValue = b[sortBy] || '';
      if (sortBy === 'permissions') {
        aValue = (a.permissions || []).length;
        bValue = (b.permissions || []).length;
      } else {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }
      if (sortOrder === 'asc') return aValue < bValue ? -1 : 1;
      return aValue > bValue ? -1 : 1;
    });

  const handleSort = (field) => {
    setSortBy(field);
    setSortOrder(sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const SortIcon = ({ field }) => (sortBy !== field ? <span className="text-gray-400">↕️</span> : <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>);

  if (userLoading || loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user || (user.role !== 'Admin' && !(user.permissions && user.permissions.includes('admin:manage')))) {
    return <div className="text-red-600 p-8">Access denied.</div>;
  }

  return (
    <div className="max-w-full mx-auto bg-white rounded-2xl shadow-lg p-8 mt-8 transition-all duration-200 hover:shadow-2xl">
      <h2 className="text-3xl font-extrabold text-blue-900 mb-8 tracking-tight drop-shadow">User Management</h2>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search Users</label>
            <input type="text" id="search" placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
          <div>
            <label htmlFor="roleFilter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Role</label>
            <select id="roleFilter" value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Roles</option>
              {ROLES.map(role => (<option key={role} value={role}>{role}</option>))}
            </select>
          </div>
          <div>
            <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select id="sortBy" value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="role">Role</option>
              <option value="permissions">Permissions Count</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={() => { setSearchTerm(''); setFilterRole(''); setSortBy('name'); setSortOrder('asc'); }} className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium">Clear Filters</button>
          </div>
        </div>
        <div className="mt-3 text-sm text-gray-600">Showing {filteredAndSortedUsers.length} of {users.length} users</div>
      </div>
      
      <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-lg bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-base">
          <thead className="bg-blue-100 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('name')}><div className="flex items-center gap-1">Name <SortIcon field="name" /></div></th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('email')}><div className="flex items-center gap-1">Email <SortIcon field="email" /></div></th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('role')}><div className="flex items-center gap-1">Role <SortIcon field="role" /></div></th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('permissions')}><div className="flex items-center gap-1">Permissions <SortIcon field="permissions" /></div></th>
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
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{(u.permissions || []).length} permissions</span>
                  {u.permissions && u.permissions.length > 0 && (<div className="mt-1 text-xs text-gray-500">{u.permissions.slice(0, 2).join(', ')}{u.permissions.length > 2 && ` +${u.permissions.length - 2} more`}</div>)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded shadow font-semibold" onClick={() => openEdit(u)}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- MODIFIED: SCROLLABLE EDIT MODAL --- */}
      {editUser && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-blue-800">Edit User: {editUser.name}</h3>
                <button onClick={closeEdit} className="text-gray-400 hover:text-blue-600 text-3xl font-bold">&times;</button>
              </div>
            </div>
            
            <form onSubmit={saveEdit} className="flex-grow overflow-y-auto">
              <div className="p-6 space-y-6">
                <div>
                  <label className="block mb-2 font-semibold text-gray-700">Role</label>
                  <select name="role" value={editForm.role} onChange={handleEditChange} className="w-full border border-gray-300 rounded-lg px-4 py-2" required>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-2 font-semibold text-gray-700">Permissions</label>
                  <div className="space-y-4">
                    {/* Employee Permissions */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-600 mb-2 border-b pb-1">Employee Management</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {PERMISSIONS.filter(p => p.startsWith('employee:')).map(p => (
                          <label key={p} className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 cursor-pointer">
                            <input type="checkbox" name={`perm:${p}`} checked={editForm.permissions.includes(p)} onChange={handleEditChange} className="form-checkbox h-5 w-5 text-blue-600 rounded"/>
                            <span className="text-sm font-medium">{p.replace('employee:', '').replace(/\b\w/g, l => l.toUpperCase())}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    {/* Task Permissions */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-600 mb-2 border-b pb-1">Task Management</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {PERMISSIONS.filter(p => p.startsWith('task:')).map(p => (
                          <label key={p} className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 cursor-pointer">
                            <input type="checkbox" name={`perm:${p}`} checked={editForm.permissions.includes(p)} onChange={handleEditChange} className="form-checkbox h-5 w-5 text-blue-600 rounded"/>
                            <span className="text-sm font-medium">{p.replace('task:', '').replace(/\b\w/g, l => l.toUpperCase())}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    {/* Leave Permissions */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-600 mb-2 border-b pb-1">Leave Management</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {PERMISSIONS.filter(p => p.startsWith('leave:')).map(p => (
                          <label key={p} className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 cursor-pointer">
                            <input type="checkbox" name={`perm:${p}`} checked={editForm.permissions.includes(p)} onChange={handleEditChange} className="form-checkbox h-5 w-5 text-blue-600 rounded"/>
                            <span className="text-sm font-medium">{p.replace('leave:', '').replace(/\b\w/g, l => l.toUpperCase())}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    {/* --- NEW: Attendance Permissions Section --- */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-600 mb-2 border-b pb-1">Attendance Management</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {PERMISSIONS.filter(p => p.startsWith('attendance:')).map(p => (
                          <label key={p} className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 cursor-pointer">
                            <input type="checkbox" name={`perm:${p}`} checked={editForm.permissions.includes(p)} onChange={handleEditChange} className="form-checkbox h-5 w-5 text-blue-600 rounded"/>
                            <span className="text-sm font-medium">{p.replace('attendance:', '').replace(/\b\w/g, l => l.toUpperCase())}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                     {/* --- NEW: Payroll Permissions Section --- */}
                     <div>
                      <h4 className="text-sm font-semibold text-gray-600 mb-2 border-b pb-1">Payroll Management</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {PERMISSIONS.filter(p => p.startsWith('payroll:')).map(p => (
                          <label key={p} className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 cursor-pointer">
                            <input type="checkbox" name={`perm:${p}`} checked={editForm.permissions.includes(p)} onChange={handleEditChange} className="form-checkbox h-5 w-5 text-blue-600 rounded"/>
                            <span className="text-sm font-medium">{p.replace('payroll:', '').replace(/\b\w/g, l => l.toUpperCase())}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    {/* Admin Permissions */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-600 mb-2 border-b pb-1">Administration</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {PERMISSIONS.filter(p => p.startsWith('admin:')).map(p => (
                          <label key={p} className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 cursor-pointer">
                            <input type="checkbox" name={`perm:${p}`} checked={editForm.permissions.includes(p)} onChange={handleEditChange} className="form-checkbox h-5 w-5 text-blue-600 rounded"/>
                            <span className="text-sm font-medium">{p.replace('admin:', '').replace(/\b\w/g, l => l.toUpperCase())}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t bg-gray-50 rounded-b-2xl">
                <div className="flex justify-end">
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-8 rounded-xl shadow-lg" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;