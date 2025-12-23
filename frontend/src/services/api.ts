import axios from 'axios';
import type { Job } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const authAPI = {
  register: (email: string, password: string, preferences: string[]) =>
    api.post('/api/auth/register', { email, password, preferences }),

  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),

  loginWithTwitter: () => {
    window.location.href = `${API_URL}/api/auth/twitter/login`;
  },

  onboarding: (telegram_id: string | null, preferences: string[], alert_speed: string, in_app_notifications: boolean) =>
    api.post('/api/auth/onboarding', {
      telegram_id,
      preferences,
      alert_speed,
      in_app_notifications,
    }),
};

// Jobs endpoints
export const jobsAPI = {
  getJobs: (category?: string, limit?: number): Promise<Job[]> =>
    api.get('/api/jobs', { params: { category, limit } }).then(res => res.data),

  getStats: () =>
    api.get('/api/stats').then(res => res.data),
};

// User endpoints
export const userAPI = {
  getUserDashboard: (timeRange = 'week') =>
    api.get(`/api/analytics/user/dashboard?time_range=${timeRange}`).then(res => res.data),
};

// Admin endpoints
export const adminAPI = {
  getAdminOverview: () =>
    api.get('/api/admin/overview').then(res => res.data),

  getAdminUsers: (page: number = 1, search: string = '') =>
    api.get('/api/admin/users', {
      params: {
        skip: (page - 1) * 50,
        limit: 50,
        search
      }
    }).then(res => res.data),
};

export default api;