import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../config/api';
import { queryClient } from '../config/queryClient';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coldStart, setColdStart] = useState(false);

  // Check if user is logged in on mount, with cold-start retry logic
  useEffect(() => {
    const MAX_RETRIES = 3;
    const ATTEMPT_TIMEOUT_MS = 18000;
    const RETRY_DELAYS_MS = [5000, 8000, 10000];

    const isNetworkError = (err) =>
      err.name === 'AbortError' ||
      err.message === 'Failed to fetch' ||
      err.message?.includes('NetworkError');

    const verifyWithTimeout = async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS);
      try {
        const response = await api.verifyToken({ signal: controller.signal });
        clearTimeout(timer);
        return response;
      } catch (err) {
        clearTimeout(timer);
        throw err;
      }
    };

    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          const response = await verifyWithTimeout();
          setUser(response.user);
          setColdStart(false);
          setLoading(false);
          return;
        } catch (err) {
          if (!isNetworkError(err)) {
            // Server replied quickly with a real auth error (401/403)
            console.error('Token verification failed (auth error):', err);
            localStorage.removeItem('token');
            setUser(null);
            setColdStart(false);
            setLoading(false);
            return;
          }
          // Network error / timeout → server is cold-starting
          if (attempt === 0) setColdStart(true);
          if (attempt < MAX_RETRIES) {
            await new Promise(res => setTimeout(res, RETRY_DELAYS_MS[attempt]));
          } else {
            // All retries exhausted
            console.error('Token verification failed after all retries (cold start):', err);
            localStorage.removeItem('token');
            setUser(null);
            setColdStart(false);
            setLoading(false);
          }
        }
      }
    };

    checkAuth();
  }, []);

  const login = async (identifier, password) => {
    try {
      setError(null);
      const response = await api.login(identifier, password);
      localStorage.setItem('token', response.token);
      queryClient.clear();
      setUser(response.user);
      return response;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  const register = async (email, fullName, username, password) => {
    try {
      setError(null);
      const response = await api.register(email, fullName, username, password);
      localStorage.setItem('token', response.token);
      queryClient.clear();
      setUser(response.user);
      return response;
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    }
  };

  const loginWithGoogle = async (code) => {
    try {
      setError(null);
      const response = await api.googleCallback(code);
      // New user — needs to pick username + password
      if (response.needsSetup) {
        return response;
      }
      localStorage.setItem('token', response.token);
      queryClient.clear();
      setUser(response.user);
      return response;
    } catch (err) {
      setError(err.message || 'Google login failed');
      throw err;
    }
  };

  const completeGoogleSetup = async ({ email, fullName, username, password, avatarUrl, googleId }) => {
    try {
      setError(null);
      const response = await api.googleRegister({ email, fullName, username, password, avatarUrl, googleId });
      localStorage.setItem('token', response.token);
      queryClient.clear();
      setUser(response.user);
      return response;
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateUser = (updatedFields) => {
    setUser(prev => prev ? { ...prev, ...updatedFields } : prev);
  };

  const value = {
    user,
    loading,
    error,
    coldStart,
    login,
    register,
    loginWithGoogle,
    completeGoogleSetup,
    logout,
    updateUser,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
