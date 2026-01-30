import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useHistory } from 'react-router-dom';
import apiService from '../services/apiService';
import storageService from '../services/storageService';
import { TOKEN_KEYS, CLIENT_ID } from '../constants/api';
import type { LoginData, RegisterData } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const history = useHistory();

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const accessToken = await storageService.getItem(TOKEN_KEYS.ACCESS_TOKEN);
      const storedUserId = await storageService.getItem(TOKEN_KEYS.USER_ID);

      if (accessToken && storedUserId) {
        setIsAuthenticated(true);
        setUserId(storedUserId);
      } else {
        setIsAuthenticated(false);
        setUserId(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      setUserId(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (data: LoginData) => {
    try {
      data.client_id = await storageService.getItem(CLIENT_ID) || undefined;
      const response = await apiService.login(data);

      // Store tokens and user ID
      await storageService.multiSet([
        [TOKEN_KEYS.ACCESS_TOKEN, response.access_token],
        [TOKEN_KEYS.REFRESH_TOKEN, response.refresh_token],
        [TOKEN_KEYS.USER_ID, response.user_id.toString()],
      ]);

      setIsAuthenticated(true);
      setUserId(response.user_id.toString());

      // Navigate to main app
      history.push('/tabs/book');
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const register = async (data: RegisterData) => {
    try {
      data.client_id = await storageService.getItem(CLIENT_ID) || undefined;
      await apiService.register(data);
      // Registration successful, redirect to login
      history.push('/login');
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      // Clear all stored tokens
      await storageService.multiRemove([
        TOKEN_KEYS.ACCESS_TOKEN,
        TOKEN_KEYS.REFRESH_TOKEN,
        TOKEN_KEYS.USER_ID,
      ]);

      setIsAuthenticated(false);
      setUserId(null);

      // Navigate to login
      history.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    userId,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
