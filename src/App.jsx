import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Layout from './components/Layout';
import { useConfig } from './context/ConfigContext';
import EmployeesDetails from './pages/EmployeesDetails';
import HRPolicy from './pages/HRPolicy';
import Tasks from './pages/Tasks';
import TaskStatus from './pages/TaskStatus';

function ProtectedRoute({ children }) {
  const { user } = useConfig();
  return user ? children : <Navigate to="/auth" />;
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
        <Route index element={<div>Welcome to the Dashboard!</div>} />
        <Route path="employees" element={<EmployeesDetails />} />
        <Route path="hr-policy" element={<HRPolicy />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="task-status" element={<TaskStatus />} />
      </Route>
      <Route path="*" element={<Navigate to="/auth" />} />
    </Routes>
  );
}

export default App;
