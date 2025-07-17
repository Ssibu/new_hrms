import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { Outlet, useNavigate } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';

const Layout = () => {
  const { setUser, backendUrl } = useConfig();
  const navigate = useNavigate();

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

  return (
    <div className="flex min-h-screen">
      <div className="fixed top-0 left-0 h-full z-20">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col min-w-0 ml-60">
        <div className="fixed top-0 left-60 right-0 z-30">
          <Navbar onLogout={handleLogout} />
        </div>
        <main className="flex-1 p-8 bg-gray-50 overflow-y-auto min-h-0 pt-20">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout; 