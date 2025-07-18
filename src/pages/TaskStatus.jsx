import React, { useEffect, useState } from 'react';
import { useConfig } from '../context/ConfigContext';

const API_URL = 'http://localhost:5000/api/employee-tasks';

const statusColors = {
  Claimed: 'bg-yellow-100 text-yellow-800',
  Started: 'bg-blue-100 text-blue-800',
  Paused: 'bg-gray-100 text-gray-800',
  Completed: 'bg-green-100 text-green-800',
};

const TaskStatus = () => {
  const { user, loading: userLoading } = useConfig();
  const [tasks, setTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]); // NEW: all tasks
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [estimateTimes, setEstimateTimes] = useState({}); // Track estimate time per task
  const [taskStatusFilter, setTaskStatusFilter] = useState('all'); // Filter for allTasks

  // Fetch claimed/assigned tasks for the user
  const fetchTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/my`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data = await res.json();
      console.log(data)
      
      setTasks(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  // Fetch all tasks
  const fetchAllTasks = async () => {
    try {
      const response = await fetch(API_URL, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch all tasks');
      const data = await response.json();
      
      setAllTasks(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      // Optionally handle error
    }
  };

  useEffect(() => {
    if (user && user.userId) {
      fetchTasks();
      fetchAllTasks();
    }
  }, [user]);

  // Action handlers (real API calls)
  const handleAction = async (taskId, action, estimateTime) => {
    let endpoint = '';
    let method = 'POST';
    let body = { userId: user.userId };
    if (action === 'Claim') {
      endpoint = `${API_URL}/${taskId}/claim`;
      body.estimateTime = Number(estimateTime) || 60;
    } else if (action === 'Start') {
      endpoint = `${API_URL}/${taskId}/start`;
    } else if (action === 'Pause') {
      endpoint = `${API_URL}/${taskId}/pause`;
    } else if (action === 'Complete') {
      endpoint = `${API_URL}/${taskId}/complete`;
    } else {
      return;
    }
    try {
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error('Action failed');
      // Refresh both lists after action
      fetchTasks();
      fetchAllTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  if (userLoading) return <div className="flex items-center justify-center h-screen">Loading user...</div>;

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Task Status</h2>
      {/* All Tasks Section */}
      <div className="flex items-center gap-4 mb-4">
        <label htmlFor="task-status-filter" className="font-medium text-gray-700">Filter by Status:</label>
        <select
          id="task-status-filter"
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={taskStatusFilter}
          onChange={e => setTaskStatusFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="open">Open</option>
          <option value="claimed">Claimed</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-2">All Tasks in System</h3>
        <div className="bg-gray-50 rounded shadow p-4 max-h-64 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allTasks.filter(task =>
            taskStatusFilter === 'all' ? true : task.status === taskStatusFilter
          ).length === 0 ? (
            <div className="col-span-full text-gray-500">No tasks found in the system.</div>
          ) : (
            allTasks.filter(task =>
              taskStatusFilter === 'all' ? true : task.status === taskStatusFilter
            ).map(task => (
              <div key={task._id} className="bg-white border border-blue-100 rounded-xl p-5 flex flex-col gap-2 shadow-md hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                      <circle cx="12" cy="12" r="9" />
                    </svg>
                  </span>
                  <div className="font-bold text-lg text-blue-800">{task.title}</div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs mb-1">
                  <span className={`px-2 py-1 rounded font-medium ${statusColors[task.status] || 'bg-gray-50 text-gray-500'}`}>{task.status || 'Unclaimed'}</span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded">Assigned: {task.assignedTo?.name || task.assignedTo?.email || '-'}</span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded">Created By: {task.createdBy?.name || task.createdBy?.email || '-'}</span>
                </div>
                {/* Estimated Time input and Claim button */}
                {task.status === 'open' && (
                  <div className="flex flex-col gap-1 mt-2">
                    <label className="text-xs font-medium text-gray-700 flex items-center gap-1" htmlFor={`estimate-${task._id}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                        <circle cx="12" cy="12" r="9" />
                      </svg>
                      Estimated Time (min)
                    </label>
                    <input
                      id={`estimate-${task._id}`}
                      type="number"
                      min="1"
                      placeholder="Enter estimated time"
                      className="border border-blue-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                      value={estimateTimes[task._id] || ''}
                      onChange={e => setEstimateTimes(et => ({ ...et, [task._id]: e.target.value }))}
                    />
                    <span className="text-xs text-gray-400">How long do you expect this task to take?</span>
                    <button
                      className="mt-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow disabled:opacity-50 disabled:cursor-not-allowed transition"
                      disabled={!estimateTimes[task._id] || isNaN(Number(estimateTimes[task._id])) || Number(estimateTimes[task._id]) <= 0}
                      onClick={() => handleAction(task._id, 'Claim', estimateTimes[task._id])}
                    >
                      Claim Task
                    </button>
                  </div>
                )}
                {task.status === 'claimed' && (
                  <button className="mt-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold cursor-not-allowed" disabled>Claimed</button>
                )}
                {task.status === 'completed' && (
                  <button className="mt-2 bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-semibold cursor-not-allowed" disabled>Completed</button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-lg bg-white mt-8">
        {/* Table below shows only tasks claimed by the current user (assignedTo = userId) */}
        <table className="min-w-full divide-y divide-gray-200 text-base">
          <thead className="bg-blue-100 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Claimed At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-500">Loading tasks...</td></tr>
            ) : tasks.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-500">No claimed or assigned tasks.</td></tr>
            ) : (
              tasks.map((task, idx) => (
                <tr key={task._id} className={(idx % 2 === 0 ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-blue-50') + ' transition'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[task.status] || 'bg-gray-50 text-gray-500'}`}>{task.status || 'Unclaimed'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{task.claimedAt ? new Date(task.claimedAt).toLocaleString() : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-yellow-600">{task.status === 'completed' && task.rating ? task.rating : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm flex gap-2">
                    {task.status === 'claimed' && (
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded shadow font-semibold transition" onClick={() => handleAction(task._id, 'Start')}>Start</button>
                    )}
                    {task.status === 'in_progress' && (
                      <>
                        <button className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded shadow font-semibold transition" onClick={() => handleAction(task._id, 'Pause')}>Pause</button>
                        <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded shadow font-semibold transition" onClick={() => handleAction(task._id, 'Complete')}>Complete</button>
                      </>
                    )}
                    {task.status === 'paused' && (
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded shadow font-semibold transition" onClick={() => handleAction(task._id, 'Start')}>Resume</button>
                    )}
                    {task.status === 'completed' && (
                      <span className="text-green-700 font-semibold">Done</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TaskStatus; 