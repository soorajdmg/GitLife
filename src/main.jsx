import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'
import Auth from './components/Auth.jsx'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'
import { ToastProvider } from './contexts/ToastContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { queryClient } from './config/queryClient'

function Root() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <App /> : <Auth />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <SocketProvider>
                <Root />
              </SocketProvider>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
)
