import React from 'react';

const Navbar = ({ onLogout }) => (
  <nav className="bg-white shadow h-16 flex items-center px-8 justify-between">
    <div className="text-xl font-bold text-gray-800">HRMS Admin Dashboard</div>
    <button
      onClick={onLogout}
      className="ml-auto bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded shadow"
    >
      Logout
    </button>
  </nav>
);

export default Navbar; 