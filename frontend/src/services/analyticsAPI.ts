// frontend/src/services/analyticsAPI.ts

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const analyticsAPI = {
  // User Analytics
  async getUserDashboard(timeRange = 'week') {
    const { data } = await api.get(`/analytics/user/dashboard?time_range=${timeRange}`);
    return data;
  },
  
  async getUserJobsTrend(days = 30) {
    const { data } = await api.get(`/analytics/user/jobs-trend?days=${days}`);
    return data;
  },
  
  // Admin Analytics
  async getAdminOverview() {
    const { data } = await api.get('/analytics/admin/overview');
    return data;
  },
  
  async getUsersGrowth(days = 30) {
    const { data } = await api.get(`/analytics/admin/users-growth?days=${days}`);
    return data;
  },
  
  async getJobsStats(days = 7) {
    const { data } = await api.get(`/analytics/admin/jobs-stats?days=${days}`);
    return data;
  },
  
  async getUserEngagement() {
    const { data } = await api.get('/analytics/admin/user-engagement');
    return data;
  },
  
  async getSystemHealth() {
    const { data } = await api.get('/analytics/admin/system-health');
    return data;
  }
};

export const adminAPI = {
  // User Management
  async listUsers(params: any) {
    const { data } = await api.get('/admin/users', { params });
    return data;
  },
  
  async getUserDetails(userId: number) {
    const { data } = await api.get(`/admin/users/${userId}`);
    return data;
  },
  
  async updateUser(userId: number, updates: any) {
    const { data } = await api.patch(`/admin/users/${userId}`, updates);
    return data;
  },
  
  async deleteUser(userId: number) {
    const { data } = await api.delete(`/admin/users/${userId}`);
    return data;
  },
  
  async bulkAction(action: string, userIds: number[]) {
    const { data } = await api.post('/admin/users/bulk-action', {
      action,
      user_ids: userIds
    });
    return data;
  },
  
  // Job Management
  async listJobs(params: any) {
    const { data } = await api.get('/admin/jobs', { params });
    return data;
  },
  
  async deleteJob(jobId: number) {
    const { data } = await api.delete(`/admin/jobs/${jobId}`);
    return data;
  },
  
  async cleanupDuplicates(days: number) {
    const { data } = await api.post(`/admin/jobs/cleanup-duplicates?days=${days}`);
    return data;
  },
  
  // System
  async triggerScrape() {
    const { data } = await api.post('/admin/system/trigger-scrape');
    return data;
  },
  
  async sendTestNotification(userId: number) {
    const { data } = await api.post(`/admin/system/send-test-notification?user_id=${userId}`);
    return data;
  }
};