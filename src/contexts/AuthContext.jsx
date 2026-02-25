import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import Loader from '../components/common/Loader';
import { useQueryClient } from '@tanstack/react-query';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const queryClient = useQueryClient();
  // const [loading,]
  // Check if user is logged in on mount
  useEffect(() => {
    // Immediately set loading to false if no token exists
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await authAPI.getCurrentUser();
      setUser(response.data.user);
      setIsAuthenticated(true);
    } catch (error) {
      // Don't log out if the request was cancelled (e.g. due to strict mode double-invocation)
      if (error.code === 'ERR_CANCELED') {
        return;
      }

      // Silently fail - user might not be logged in or backend might not be running
      console.warn('Auth check failed:', error.message);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
      queryClient.clear();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      setIsAuthenticated(true);
      queryClient.clear();

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      setIsAuthenticated(true);
      queryClient.clear();

      return { success: true };
    } catch (error) {
      return {
        success: false,
        errors: error.response?.data?.errors || [],
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
      queryClient.clear();
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth
  };

  if (loading) {
    return <div className='w-full h-screen bg-white flex items-center justify-center'>
      <Loader />
    </div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

