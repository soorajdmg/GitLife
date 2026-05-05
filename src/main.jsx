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
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { queryClient } from './config/queryClient'

function SplashScreen({ coldStart }) {
  const { isDark } = useTheme();

  const bg      = isDark ? 'oklch(14% 0.008 260)' : 'oklch(98.5% 0.005 80)';
  const textPri = isDark ? 'oklch(94% 0.008 260)' : 'oklch(18% 0.015 260)';
  const textSec = isDark ? 'oklch(58% 0.01 260)'  : 'oklch(52% 0.01 260)';
  const accent  = 'oklch(52% 0.2 260)';

  return (
    <>
      <style>{`@keyframes splashSpin { to { transform: rotate(360deg); } }`}</style>
      <div style={{
        position: 'fixed', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: bg, gap: 20,
      }}>
        <svg width="44" height="44" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="8" fill={accent} />
          <line x1="10" y1="6" x2="10" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
          <path d="M10 11 C10 11 10 8 18 8" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
          <circle cx="10" cy="19" r="2.5" fill="white" />
          <circle cx="10" cy="11" r="2.5" fill="white" />
          <circle cx="18" cy="8" r="2.5" fill="white" opacity="0.7" />
        </svg>

        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          border: `2.5px solid ${isDark ? 'oklch(30% 0.01 260)' : 'oklch(85% 0.008 260)'}`,
          borderTopColor: accent,
          animation: 'splashSpin 0.75s linear infinite',
        }} />

        <div style={{ textAlign: 'center', maxWidth: 260 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: textPri, marginBottom: 6 }}>
            {coldStart ? 'Waking up server...' : 'Checking authentication...'}
          </p>
          {coldStart && (
            <p style={{ fontSize: 12.5, color: textSec, lineHeight: 1.5 }}>
              The server is starting up. This usually takes 30–60 seconds on first load.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

function Root() {
  const { isAuthenticated, loading, coldStart } = useAuth();

  if (loading) return <SplashScreen coldStart={coldStart} />;
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
