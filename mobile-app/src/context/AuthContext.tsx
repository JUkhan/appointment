import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService, LoginData, RegisterData } from '../services/apiService';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Check if user is already logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const storedUserId = await AsyncStorage.getItem('user_id');

      if (token) {
        setIsAuthenticated(true);
        setUserId(storedUserId);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (data: LoginData) => {
    try {
      const response = await apiService.login(data);

      // Store tokens and user ID
      await AsyncStorage.multiSet([
        ['access_token', response.access_token],
        ['refresh_token', response.refresh_token],
        ['user_id', response.user_id.toString()],
      ]);

      setIsAuthenticated(true);
      setUserId(response.user_id.toString());
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(
        error.response?.data?.error || 'Login failed. Please try again.'
      );
    }
  };

  const register = async (data: RegisterData) => {
    try {
      await apiService.register(data);
      // Note: After registration, user needs to login
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(
        error.response?.data?.error ||
          'Registration failed. Please try again.'
      );
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([
        'access_token',
        'refresh_token',
        'user_id',
      ]);
      setIsAuthenticated(false);
      setUserId(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        userId,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
