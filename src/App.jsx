import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Layout from './components/Layout';
import { useConfig } from './context/ConfigContext';
import { navigationConfig, hasPermission, isBlockedForEmployee } from './config/navigation';
import Dashboard from './pages/Dashboard';
import EmployeesDetails from './pages/EmployeesDetails';
import HRPolicy from './pages/HRPolicy';
import LeavePolicy from './pages/LeavePolicy';
import LeaveRequests from './pages/LeaveRequests';
import LeaveApplication from './pages/LeaveApplication';
import Tasks from './pages/Tasks';
import TaskStatus from './pages/TaskStatus';
import Profile from './pages/Profile';
import UserManagement from './pages/UserManagement';
import AttendancePage from './pages/AttendancePage';
import AttendanceReportPage from './pages/AttendanceReportPage'
import PayrollPage from './pages/PayrollPage';

function ProtectedRoute({ children }) {
  const { user } = useConfig();
  return user ? children : <Navigate to="/auth" />;
}

function PermissionRoute({ permission, children, blockForEmployee }) {
  const { user } = useConfig();
  if (!user) return <Navigate to="/auth" />;
  if (isBlockedForEmployee(user, blockForEmployee)) {
    return <div className="text-red-600 p-8">Access denied.</div>;
  }
  if (hasPermission(user, permission)) {
    return children;
  }
  return <div className="text-red-600 p-8">Access denied.</div>;
}

function App() {
  const { user } = useConfig();
  
  // Component mapping for routes
  const componentMap = {
    '/layout': Dashboard,
    '/layout/employees': EmployeesDetails,
    '/layout/hr-policy': HRPolicy,
    '/layout/leave-policy': LeavePolicy,
    '/layout/leave-requests': LeaveRequests,
    '/layout/leave-application': LeaveApplication,
    '/layout/attendance': AttendancePage,
    '/layout/attendance-report': AttendanceReportPage, 
    '/layout/payroll': PayrollPage,
    '/layout/tasks': Tasks,
    '/layout/task-status': TaskStatus,
    '/layout/profile': Profile,
    '/layout/users': UserManagement
  };

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
        {navigationConfig.filter(item => item.to !== '/layout').map(item => {
          const Component = componentMap[item.to];
          if (!Component) return null;
          
          return (
            <Route
              key={item.to}
              path={item.to.replace('/layout/', '')}
              element={
                <PermissionRoute 
                  permission={item.permission} 
                  blockForEmployee={item.blockForEmployee}
                >
                  <Component />
                </PermissionRoute>
              }
            />
          );
        })}
      </Route>
      <Route path="*" element={<Navigate to="/auth" />} />
    </Routes>
  );
}

export default App;
