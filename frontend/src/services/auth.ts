// FILE: src/services/auth.ts

import api from './api';

export const authService = {
  // Redirect to X OAuth
  loginWithTwitter: () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/twitter/login`;
  },

  // Store token after callback
  handleCallback: async (token: string) => {
    localStorage.setItem('token', token);
    
    // Get user info (token is sent via Authorization header by interceptor)
    const response = await api.get('/api/auth/me');
    localStorage.setItem('user', JSON.stringify(response.data));
    
    return response.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  },

  // Get current user
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if logged in
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};