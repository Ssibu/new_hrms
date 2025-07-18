import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  const navItems = [
    { to: '/layout', label: 'Dashboard' },
    { to: '/layout/employees', label: 'Employees' },
    { to: '/layout/hr-policy', label: 'HR Policy' },
    { to: '/layout/tasks', label: 'Tasks' },
    { to: '/layout/task-status', label: 'Task Status' },
    { to: '/layout/profile', label: 'Profile' }, // Added Profile link
  ];

  return (
    <div className="bg-gray-800 text-white w-60 min-h-screen flex flex-col p-4">
      <h2 className="text-2xl font-bold mb-8">Admin Panel</h2>
      <nav className="flex flex-col gap-4">
        {navItems.map(item => (
          <Link
            key={item.to}
            to={item.to}
            className={`hover:bg-gray-700 px-3 py-2 rounded ${location.pathname === item.to ? 'bg-gray-700' : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar; 