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

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.verifyToken();
          setUser(response.user);
        } catch (err) {
          console.error('Token verification failed:', err);
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
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
      {!loading && children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
