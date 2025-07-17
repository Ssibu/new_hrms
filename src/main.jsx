import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BackendUrlProvider } from './BackendUrlContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BackendUrlProvider>
      <App />
    </BackendUrlProvider>
  </StrictMode>,
)
