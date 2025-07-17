import React, { createContext, useContext, useState } from 'react';

const BACKEND_URL = 'http://localhost:5000'; // Change as needed

const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  return (
    <ConfigContext.Provider value={{ backendUrl: BACKEND_URL, user, setUser }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => useContext(ConfigContext); 