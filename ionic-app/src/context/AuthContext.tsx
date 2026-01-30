import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import apiService from '../services/apiService';
import storageService from '../services/storageService';
import { TOKEN_KEYS, CLIENT_ID } from '../constants/api';
import { extractRole } from '../utils/jwtUtils';
import type { LoginData, RegisterData, UserRole, RoleChangeCallback, RoleChangeEvent } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  userRole: UserRole | null;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  onRoleChange: (callback: RoleChangeCallback) => () => void;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [roleChangeCallbacks, setRoleChangeCallbacks] = useState<RoleChangeCallback[]>([]);
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

        // Extract and set role from access token
        const role = extractRole(accessToken);
        setUserRole(role);
      } else {
        setIsAuthenticated(false);
        setUserId(null);
        setUserRole(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      setUserId(null);
      setUserRole(null);
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

      // Extract and set role from access token
      const role = extractRole(response.access_token);

      setIsAuthenticated(true);
      setUserId(response.user_id.toString());
      setUserRole(role);

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
      setUserRole(null);

      // Use window.location to do a full page reload and avoid React update loop
      // This ensures a clean state after logout
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  /**
   * Check if user has specific role(s)
   */
  const hasRole = useCallback((role: UserRole | UserRole[]): boolean => {
    if (!userRole) return false;

    if (Array.isArray(role)) {
      return role.includes(userRole);
    }

    return userRole === role;
  }, [userRole]);

  /**
   * Subscribe to role change events
   * Returns unsubscribe function
   */
  const onRoleChange = useCallback((callback: RoleChangeCallback): (() => void) => {
    setRoleChangeCallbacks(prev => [...prev, callback]);

    // Return unsubscribe function
    return () => {
      setRoleChangeCallbacks(prev => prev.filter(cb => cb !== callback));
    };
  }, []);

  /**
   * Notify all subscribers of role change
   */
  const notifyRoleChange = useCallback((oldRole: string | null, newRole: string | null) => {
    const event: RoleChangeEvent = {
      oldRole,
      newRole,
      timestamp: new Date(),
    };

    roleChangeCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in role change callback:', error);
      }
    });
  }, [roleChangeCallbacks]);

  /**
   * Refresh role from current access token
   * Call this after token refresh to detect role changes
   */
  const refreshRole = useCallback(async () => {
    try {
      const accessToken = await storageService.getItem(TOKEN_KEYS.ACCESS_TOKEN);
      if (!accessToken) {
        setUserRole(null);
        return;
      }

      const oldRole = userRole;
      const newRole = extractRole(accessToken);

      if (oldRole !== newRole) {
        setUserRole(newRole);
        notifyRoleChange(oldRole, newRole);
        console.log('Role changed:', { oldRole, newRole });
      }
    } catch (error) {
      console.error('Error refreshing role:', error);
    }
  }, [userRole, notifyRoleChange]);

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    userId,
    userRole,
    login,
    register,
    logout,
    hasRole,
    onRoleChange,
    refreshRole,
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
