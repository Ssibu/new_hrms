import React, { useEffect, useState } from 'react';
import { useConfig } from '../context/ConfigContext';

const API_URL = 'http://localhost:5000/api/users';

const PERMISSIONS = [
  'employee:read', 'employee:create', 'employee:update', 'employee:delete',
  'task:read', 'task:create', 'task:update', 'task:delete',
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

  if (userLoading || loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user || (user.role !== 'Admin' && !(user.permissions && user.permissions.includes('admin:manage')))) {
    return <div className="text-red-600 p-8">Access denied.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg p-8 mt-8 transition-all duration-200 hover:shadow-2xl">
      <h2 className="text-3xl font-extrabold text-blue-900 mb-8 tracking-tight drop-shadow">User Management</h2>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-lg bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-base">
          <thead className="bg-blue-100 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {users.map(u => (
              <tr key={u._id} className="hover:bg-blue-50 transition">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{u.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{u.role}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{u.permissions?.join(', ')}</td>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PERMISSIONS.map(perm => (
                    <label key={perm} className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 transition cursor-pointer">
                      <input
                        type="checkbox"
                        name={`perm:${perm}`}
                        checked={editForm.permissions.includes(perm)}
                        onChange={handleEditChange}
                        className="form-checkbox h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition"
                      />
                      <span className="text-sm font-medium text-gray-700 select-none">{perm.replace(':', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                    </label>
                  ))}
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