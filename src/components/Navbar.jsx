import React, { useState } from 'react';
import { useConfig } from '../context/ConfigContext';
import { Bars3Icon } from '@heroicons/react/24/outline'; // Import the hamburger icon

// --- MODIFIED: Component now receives 'onToggleSidebar' prop ---
const Navbar = ({ onLogout, onToggleSidebar }) => {
  const { user } = useConfig();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const initial = user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?';
  const fullName = user?.name || user?.email || 'User';

  return (
    <nav className="bg-white shadow-sm h-16 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-4">
        {/* --- NEW: Sidebar Toggle Button --- */}
        <button
          onClick={onToggleSidebar}
          className="text-gray-600 hover:bg-gray-100 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          aria-label="Toggle sidebar"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>

        {/* --- MODIFIED: Kept your dashboard title --- */}
        <div className="hidden sm:block text-xl font-semibold text-gray-800 tracking-wide">
          HRMS Dashboard
        </div>
      </div>

      <div className="relative">
        {/* Profile Circle */}
        <button
          className="w-10 h-10 rounded-full bg-blue-600 text-white font-semibold text-lg flex items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-150 shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          onMouseEnter={() => setIsDropdownOpen(true)}
          onMouseLeave={() => setIsDropdownOpen(false)}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)} // For mobile/touch
          title={fullName}
          aria-haspopup="true"
          aria-expanded={isDropdownOpen}
        >
          {initial}
        </button>

        {/* Dropdown */}
        <div
          className={`absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-2xl transition-all duration-200 ease-in-out origin-top-right z-50 ring-1 ring-black ring-opacity-5 ${
            isDropdownOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'
          }`}
          onMouseEnter={() => setIsDropdownOpen(true)}
          onMouseLeave={() => setIsDropdownOpen(false)}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-menu-button"
        >
          <div className="py-1">
            <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
              <p className="font-semibold truncate">{fullName}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-150"
              role="menuitem"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;