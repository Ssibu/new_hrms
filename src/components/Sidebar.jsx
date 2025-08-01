import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';
import { getFilteredNavigation } from '../config/navigation';
import { ChevronDoubleLeftIcon } from '@heroicons/react/24/solid'; // Example icon

// --- MODIFIED: Component now accepts 'isSidebarOpen' prop ---
const Sidebar = ({ isSidebarOpen }) => {
  const location = useLocation();
  const { user } = useConfig();

  const filteredNavItems = getFilteredNavigation(user);

  return (
    // --- MODIFIED: Added overflow-x-hidden to hide text during transition ---
    <div className="bg-gray-800 text-white w-full min-h-screen flex flex-col p-4 overflow-x-hidden">
      {/* --- MODIFIED: Title now changes based on sidebar state --- */}
      <div className="flex items-center justify-center h-16 mb-4">
        <h2 className="text-xl font-bold text-center transition-opacity duration-300 ease-in-out">
            {isSidebarOpen ? (user.role === 'Admin' ? 'Admin Panel' : user.role === 'HR' ? 'HR Dashboard' : 'Dashboard') : '🚀'}
        </h2>
      </div>

      {/* --- MODIFIED: Navigation links adapt to the sidebar state --- */}
      <nav className="flex flex-col gap-4">
        {filteredNavItems.map(item => {
          const IconComponent = item.icon;
          const isActive = location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              title={isSidebarOpen ? '' : item.label} // Show tooltip when collapsed
              className={`
                flex items-center gap-3 px-3 py-2 rounded transition-colors duration-200 
                ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}
                ${!isSidebarOpen && 'justify-center'} // Center icon when collapsed
              `}
            >
              {IconComponent && <IconComponent className="h-6 w-6 flex-shrink-0" />}
              {/* --- MODIFIED: Label fades and shrinks with a smooth transition --- */}
              <span
                className={`
                  whitespace-nowrap transition-all duration-200 ease-in-out
                  ${isSidebarOpen ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0'}
                `}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;