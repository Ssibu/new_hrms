import React, { createContext, useContext } from 'react';

// Set your backend URL here
const BACKEND_URL = 'http://localhost:5000'; // Change this to your backend URL as needed

const BackendUrlContext = createContext(BACKEND_URL);

export const BackendUrlProvider = ({ children }) => (
  <BackendUrlContext.Provider value={BACKEND_URL}>
    {children}
  </BackendUrlContext.Provider>
);

export const useBackendUrl = () => useContext(BackendUrlContext); 