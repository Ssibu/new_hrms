import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';

const Sidebar = () => {
  const location = useLocation();
  const { user } = useConfig();
  const navItems = [
    { to: '/layout', label: 'Dashboard' },
    { to: '/layout/employees', label: 'Employees', perm: 'employee:read' },
    { to: '/layout/hr-policy', label: 'HR Policy', perm: null, blockForEmployee: true },
    { to: '/layout/tasks', label: 'Tasks', perm: 'task:read', blockForEmployee: true },
    { to: '/layout/task-status', label: 'Task Status', perm: 'task:read' },
    { to: '/layout/profile', label: 'Profile', perm: null },
  ];
  // Only show User Management for admins or users with admin:manage permission
  if (user && (user.role === 'Admin' || (user.permissions && user.permissions.includes('admin:manage')))) {
    navItems.push({ to: '/layout/users', label: 'User Management', perm: 'admin:manage' });
  }
  
  // Filter nav items based on permissions
  const filteredNavItems = navItems.filter(item => {
    // Don't show if user is not logged in
    if (!user) return false;
    
    // Admin can see everything
    if (user.role === 'Admin') return true;
    
    // Hide items marked as blockForEmployee from Employee role users
    if (item.blockForEmployee && user.role === 'Employee') return false;
    
    // For items without permission requirements, show them (unless blocked above)
    if (!item.perm) return true;
    
    // For items with permission requirements, check if user has the required permission
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