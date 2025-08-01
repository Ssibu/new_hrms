import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';
import { getFilteredNavigation } from '../config/navigation';

const Sidebar = () => {
  const location = useLocation();
  const { user } = useConfig();
  console.log(user);

  // Get filtered navigation items based on user permissions
  const filteredNavItems = getFilteredNavigation(user);

  return (
    <div className="bg-gray-800 text-white w-60 min-h-screen flex flex-col p-4">
      <h2 className="text-2xl font-bold mb-8">{user.role === 'Admin' ? 'Admin Panel' : user.role === 'HR' ? 'HR Dashboard' : 'Employee Dashboard'}</h2>
      <nav className="flex flex-col gap-4">
        {filteredNavItems.map(item => {
          const IconComponent = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`hover:bg-gray-700 px-3 py-2 rounded flex items-center gap-3 ${location.pathname === item.to ? 'bg-gray-700' : ''}`}
            >
              {IconComponent && <IconComponent className="h-5 w-5" />}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar; 