import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
axios.defaults.baseURL = 'http://localhost:5000';
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [refreshToken, setRefreshToken] = useState(
    localStorage.getItem('refreshToken')
  );
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Logout function (defined early for use in interceptors)
  const logout = () => {
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    window.location.href = '/login';
  };

  useEffect(() => {
    // Restore user state from localStorage on initialization
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    const storedRefreshToken = localStorage.getItem('refreshToken');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
        setRefreshToken(storedRefreshToken);
        axios.defaults.headers.common[
          'Authorization'
        ] = `Bearer ${storedToken}`;
        console.log('Restored user session:', parsedUser);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      }
    }

    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
    setLoading(false);
  }, [token]);

  // Axios interceptor for handling 401 errors and refreshing tokens
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't tried refreshing yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          const storedRefreshToken = localStorage.getItem('refreshToken');

          // If we have a refresh token, try to refresh
          if (storedRefreshToken && !isRefreshing) {
            try {
              setIsRefreshing(true);
              const response = await axios.post(
                '/refresh',
                {},
                {
                  headers: {
                    Authorization: `Bearer ${storedRefreshToken}`,
                  },
                }
              );

              const { access_token } = response.data;

              // Update tokens
              setToken(access_token);
              localStorage.setItem('token', access_token);
              axios.defaults.headers.common[
                'Authorization'
              ] = `Bearer ${access_token}`;

              // Retry the original request with new token
              originalRequest.headers[
                'Authorization'
              ] = `Bearer ${access_token}`;
              setIsRefreshing(false);
              return axios(originalRequest);
            } catch (refreshError) {
              setIsRefreshing(false);
              console.error('Token refresh failed:', refreshError);
              logout();
              return Promise.reject(refreshError);
            }
          } else {
            // No refresh token available, logout
            logout();
          }
        }

        return Promise.reject(error);
      }
    );

    // Cleanup interceptor on unmount
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [isRefreshing, refreshToken]);

  const login = async (username, password) => {
    try {
      const response = await axios.post('/login', { username, password });
      const { access_token, refresh_token, user_id } = response.data;

      setToken(access_token);
      setRefreshToken(refresh_token);
      setUser({ id: user_id, username });
      localStorage.setItem('token', access_token);
      localStorage.setItem('refreshToken', refresh_token);
      localStorage.setItem('user', JSON.stringify({ id: user_id, username }));

      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed',
      };
    }
  };

  const register = async (username, password) => {
    try {
      await axios.post('/register', { username, password });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed',
      };
    }
  };

  const value = {
    user,
    token,
    refreshToken,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
