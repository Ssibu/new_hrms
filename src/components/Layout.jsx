import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { Outlet, useNavigate } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';   

const Layout = () => {
  const { setUser, backendUrl } = useConfig();
  const navigate = useNavigate();

  // --- NEW: State to manage sidebar visibility ---
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    try {
      await fetch(`${backendUrl}/api/auth/logout`, { 
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      // Optionally handle error
    }
    setUser(null);
    navigate('/auth');
  };

  // --- NEW: Function to toggle the sidebar state ---
  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* --- MODIFIED: Sidebar container with dynamic width and transition --- */}
      <div
        className={`fixed top-0 left-0 h-full z-20 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'w-60' : 'w-20'
        }`}
      >
        <Sidebar isSidebarOpen={isSidebarOpen} />
      </div>

      {/* --- MODIFIED: Main content area with dynamic margin-left and transition --- */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'ml-60' : 'ml-20'
        }`}
      >
        {/* --- MODIFIED: Navbar container with dynamic left position and transition --- */}
        <div
          className={`fixed top-0 right-0 z-30 transition-all duration-300 ease-in-out ${
            isSidebarOpen ? 'left-60' : 'left-20'
          }`}
        >
          {/* --- MODIFIED: Pass the toggle function to Navbar --- */}
          <Navbar onLogout={handleLogout} onToggleSidebar={toggleSidebar} />
        </div>
        <main className="flex-1 p-8 overflow-y-auto min-h-0 pt-20">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;