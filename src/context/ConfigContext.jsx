import React, { createContext, useContext, useState, useEffect } from 'react';

const BACKEND_URL = 'http://localhost:5000'; // Change as needed

const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/auth/me`, {
      credentials: 'include',
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.user) setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <ConfigContext.Provider value={{ backendUrl: BACKEND_URL, user, setUser, loading }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => useContext(ConfigContext); 