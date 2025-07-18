import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useConfig } from './context/ConfigContext';

const AuthGate = ({ children }) => {
  const { user, loading } = useConfig();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;
    if (user && location.pathname === '/auth') {
      navigate('/layout', { replace: true });
    } else if (!user && location.pathname !== '/auth') {
      navigate('/auth', { replace: true });
    }
  }, [user, loading, location.pathname, navigate]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return children;
};

export default AuthGate; 