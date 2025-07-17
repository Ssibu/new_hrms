import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { Outlet } from 'react-router-dom';

const Layout = ({ onLogout }) => (
  <div className="flex min-h-screen">
    <Sidebar />
    <div className="flex-1 flex flex-col min-w-0">
      <Navbar onLogout={onLogout} />
      <main className="flex-1 p-8 bg-gray-50 overflow-x-auto min-w-0">
        <Outlet />
      </main>
    </div>
  </div>
);

export default Layout; 