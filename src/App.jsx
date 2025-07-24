import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Layout from './components/Layout';
import { useConfig } from './context/ConfigContext';
import Dashboard from './pages/Dashboard';
import EmployeesDetails from './pages/EmployeesDetails';
import HRPolicy from './pages/HRPolicy';
import Tasks from './pages/Tasks';
import TaskStatus from './pages/TaskStatus';
import Profile from './pages/Profile';
import UserManagement from './pages/UserManagement';

function ProtectedRoute({ children }) {
  const { user } = useConfig();
  return user ? children : <Navigate to="/auth" />;
}

function PermissionRoute({ permission, children, blockForEmployee }) {
  const { user } = useConfig();
  if (!user) return <Navigate to="/auth" />;
  if (blockForEmployee && user.role === 'Employee') {
    return <div className="text-red-600 p-8">Access denied.</div>;
  }
  if (user.role === 'Admin' || (user.permissions && user.permissions.includes(permission))) {
    return children;
  }
  return <div className="text-red-600 p-8">Access denied.</div>;
}

function App() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route
        path="/layout"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="employees" element={<PermissionRoute permission="employee:read"><EmployeesDetails /></PermissionRoute>} />
        <Route path="hr-policy" element={<PermissionRoute permission={null} blockForEmployee={true}><HRPolicy /></PermissionRoute>} />
        <Route path="tasks" element={<PermissionRoute permission="task:read" blockForEmployee={true}><Tasks /></PermissionRoute>} />
        <Route path="task-status" element={<PermissionRoute permission="task:read"><TaskStatus /></PermissionRoute>} />
        <Route path="profile" element={<Profile />} />
        <Route path="users" element={<PermissionRoute permission="admin:manage"><UserManagement /></PermissionRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/auth" />} />
    </Routes>
  );
}

export default App;
