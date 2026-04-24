import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Auth from './components/Auth.jsx'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'

function Root() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <App /> : <Auth />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <SocketProvider>
        <Root />
      </SocketProvider>
    </AuthProvider>
  </StrictMode>,
)
