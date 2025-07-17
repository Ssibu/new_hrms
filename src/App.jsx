import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Layout from './components/Layout';
import EmployeesDetails from './pages/EmployeesDetails';
import HRPolicy from './pages/HRPolicy';
import Tasks from './pages/Tasks';
import TaskStatus from './pages/TaskStatus';

function App() {
  const [user, setUser] = useState(null);

  function LoginWrapper() {
    const navigate = useNavigate();
    const handleLogin = (data) => {
      setUser(data.user);
      if (data.user.role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/');
      }
    };
    return <Login onLogin={handleLogin} />;
  }

  function handleLogout() {
    setUser(null);
    window.location.href = '/login';
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginWrapper />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/admin-dashboard"
          element={user && user.role === 'admin' ? <Layout onLogout={handleLogout} /> : <Navigate to="/login" />}
        >
          <Route index element={<div>Welcome to the Admin Dashboard</div>} />
          <Route path="employees" element={<EmployeesDetails />} />
          <Route path="hr-policy" element={<HRPolicy />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="task-status" element={<TaskStatus />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
