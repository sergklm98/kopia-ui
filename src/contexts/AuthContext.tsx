import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AxiosInstance } from 'axios';

interface AuthCredentials {
  username: string;
  password: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  credentials: AuthCredentials | null;
  login: (username: string, password: string) => void;
  logout: () => void;
  setAuthHeader: (axios: AxiosInstance) => void;
  clearAuthHeader: (axios: AxiosInstance) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [credentials, setCredentials] = useState<AuthCredentials | null>(null);

  const isAuthenticated = credentials !== null;

  const login = (username: string, password: string) => {
    const newCredentials = { username, password };
    setCredentials(newCredentials);
    // Store in sessionStorage for persistence across page reloads
    sessionStorage.setItem('kopia-auth', JSON.stringify(newCredentials));
  };

  const logout = () => {
    setCredentials(null);
    sessionStorage.removeItem('kopia-auth');
  };

  const setAuthHeader = (axios: AxiosInstance) => {
    if (credentials) {
      const authString = btoa(`${credentials.username}:${credentials.password}`);
      axios.defaults.headers.common['Authorization'] = `Basic ${authString}`;
    }
  };

  const clearAuthHeader = (axios: AxiosInstance) => {
    delete axios.defaults.headers.common['Authorization'];
  };

  // Restore credentials from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('kopia-auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCredentials(parsed);
      } catch (error) {
        console.error('Failed to parse stored credentials:', error);
        sessionStorage.removeItem('kopia-auth');
      }
    }
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    credentials,
    login,
    logout,
    setAuthHeader,
    clearAuthHeader,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 