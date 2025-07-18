import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ConfigProvider } from './context/ConfigContext';
import { BrowserRouter as Router } from 'react-router-dom';
import AuthGate from './AuthGate';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfigProvider>
      <Router>
        <AuthGate>
          <App />
        </AuthGate>
      </Router>
    </ConfigProvider>
  </StrictMode>,
)
