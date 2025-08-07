import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';
import { getFilteredNavigation } from '../config/navigation';

const Sidebar = ({ isSidebarOpen }) => {
  const location = useLocation();
  const { user } = useConfig();

  const filteredNavItems = getFilteredNavigation(user);

  return (
    <div className="bg-gray-800 text-white w-full h-screen flex flex-col p-4 overflow-x-hidden">
      
      <div className="flex items-center justify-center h-16 mb-4 flex-shrink-0">
        <h2 className="text-xl font-bold text-center transition-opacity duration-300 ease-in-out">
            {isSidebarOpen ? (user.role === 'Admin' ? 'Admin Panel' : user.role === 'HR' ? 'HR Dashboard' : 'Dashboard') : '🚀'}
        </h2>
      </div>

      {/* --- MODIFIED: Added padding classes --- */}
      {/* `py-2`: Adds vertical padding (top and bottom) inside the scrollable area. */}
      {/* `pr-2`: Adds padding to the right, moving the scrollbar slightly to the left. */}
      <nav className="flex flex-col gap-4 flex-grow overflow-y-auto custom-scrollbar py-2 ">
        {filteredNavItems.map(item => {
          const IconComponent = item.icon;
          const isActive = location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              title={isSidebarOpen ? '' : item.label}
              className={`
                flex items-center gap-3 px-3 py-2 rounded transition-colors duration-200 
                ${isActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}
                ${!isSidebarOpen && 'justify-center'}
              `}
            >
              <IconComponent className="h-6 w-6 flex-shrink-0" />
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