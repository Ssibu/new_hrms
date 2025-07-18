import React, { useState, useEffect } from 'react';
import { useConfig } from '../context/ConfigContext';

const API_URL = 'http://localhost:5000/api/employee-tasks';

function Tasks() {
  const { user, loading: userLoading } = useConfig();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch all tasks
  const fetchTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(API_URL, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : data.data || []);
      
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
    console.log(user)
  }, []);

  // Handle form submission
  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Prepare payload according to schema
      const payload = { title: form.title, description: form.description, createdBy: user.userId};
      console.log(payload)
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to create task');
      setSuccess('Task created successfully!');
      setShowModal(false);
      setForm({ title: '', description: '' });
      fetchTasks(); // Refresh task list after creation
    } catch (err) {
      setError(err.message);
    }
    setFormLoading(false);
  };

  if (userLoading) {
    return <div className="flex items-center justify-center h-screen">Loading user...</div>;
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Task Management</h2>
      <button className="bg-blue-600 text-white px-4 py-2 rounded mb-4" onClick={() => setShowModal(true)}>
        Create Task
      </button>
      {success && <div className="text-green-600 mb-4">{success}</div>}
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {/* Modal for create task */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded shadow-lg w-full max-w-lg relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
              onClick={() => setShowModal(false)}
            >
              &times;
            </button>
            <form onSubmit={handleCreate} className="space-y-4">
              <h3 className="text-xl font-bold mb-4">Create Task</h3>
              <div>
                <label className="block mb-1">Title <span className="text-red-500">*</span></label>
                <input
                  name="title"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block mb-1">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer"
                disabled={formLoading}
              >
                {formLoading ? 'Creating...' : 'Create'}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Task cards section */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center text-gray-500">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="col-span-full text-center text-gray-500">No tasks found.</div>
        ) : (
          tasks.map(task => (
            <div key={task._id} className="relative bg-white rounded-lg shadow-lg border-l-4 border-blue-600 p-6 flex flex-col gap-3 transition-transform hover:scale-[1.02] hover:shadow-xl">
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-full text-2xl">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6m9 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <div>
                  <div className="font-bold text-xl text-gray-800">{task.title}</div>
                  {task.description && <div className="text-gray-600 text-sm mt-1">{task.description}</div>}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-2 text-sm">
                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-medium">Assigned By: {task.assignedBy || '-'}</span>
                <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded">Created: {task.createdAt ? new Date(task.createdAt).toLocaleString() : '-'}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Tasks;