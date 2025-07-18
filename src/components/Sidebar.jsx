import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';

const Sidebar = () => {
  const location = useLocation();
  const { user } = useConfig();
  const navItems = [
    { to: '/layout', label: 'Dashboard' },
    { to: '/layout/employees', label: 'Employees', perm: 'employee:read' },
    { to: '/layout/hr-policy', label: 'HR Policy', perm: null },
    { to: '/layout/tasks', label: 'Tasks', perm: 'task:read' },
    { to: '/layout/task-status', label: 'Task Status', perm: null },
    { to: '/layout/profile', label: 'Profile', perm: null },
  ];
  // Only show User Management for admins or users with admin:manage permission
  if (user && (user.role === 'Admin' || (user.permissions && user.permissions.includes('admin:manage')))) {
    navItems.push({ to: '/layout/users', label: 'User Management', perm: 'admin:manage' });
  }
  // Hide 'Tasks' for Employee role
  const filteredNavItems = navItems.filter(item => {
    if (item.label === 'Tasks' && user && user.role === 'Employee') return false;
    if (!item.perm) return true;
    if (!user) return false;
    if (user.role === 'Admin') return true;
    return user.permissions && user.permissions.includes(item.perm);
  });

  return (
    <div className="bg-gray-800 text-white w-60 min-h-screen flex flex-col p-4">
      <h2 className="text-2xl font-bold mb-8">Admin Panel</h2>
      <nav className="flex flex-col gap-4">
        {filteredNavItems.map(item => (
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