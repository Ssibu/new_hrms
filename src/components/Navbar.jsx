import React, { useState } from 'react';
import { useConfig } from '../context/ConfigContext';

const Navbar = ({ onLogout }) => {
  const { user } = useConfig();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const initial = user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '';
  const fullName = user?.name || user?.email || '';

  return (
    <nav className="bg-white shadow-sm h-16 flex items-center justify-between px-6 md:px-10">
      <div className="text-2xl font-semibold text-gray-800 tracking-wide">
        HRMS Admin Dashboard
      </div>

      <div className="relative ml-auto">
        {/* Profile Circle */}
        <div
          className="w-10 h-10 rounded-full bg-blue-600 text-white font-semibold text-lg flex items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-150 shadow"
          onMouseEnter={() => setIsDropdownOpen(true)}
          onMouseLeave={() => setIsDropdownOpen(false)}
          title={fullName}
        >
          {initial}
        </div>

        {/* Dropdown */}
        <div
          className={`absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg transition-all duration-200 ease-in-out origin-top-right z-50 ${
            isDropdownOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'
          }`}
          onMouseEnter={() => setIsDropdownOpen(true)}
          onMouseLeave={() => setIsDropdownOpen(false)}
        >
          <div className="px-4 py-3 text-gray-700 font-medium border-b border-gray-100">
            {fullName}
          </div>
          <button
            onClick={onLogout}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-150"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
