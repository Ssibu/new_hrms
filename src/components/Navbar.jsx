import React from 'react';
import { useConfig } from '../context/ConfigContext';

const Navbar = ({ onLogout }) => {
  const { user } = useConfig();
  console.log(user)
  const initial = user && user.name ? user.name.charAt(0).toUpperCase() : (user && user.email ? user.email.charAt(0).toUpperCase() : '');
  const tooltip = user ? `${user.name || ''} (${user.email || ''})` : '';
  console.log("the inital value is",initial)
  return (
    <nav className="bg-white shadow h-16 flex items-center px-8 justify-between">
      <div className="text-xl font-bold text-gray-800">HRMS Admin Dashboard</div>
      <div className="flex items-center gap-4 ml-auto">
        {initial && (
          <div
            className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 text-white font-bold text-lg shadow"
            title={tooltip}
          >
            {initial}
          </div>
        )}
        <button
          onClick={onLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded shadow"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar; 