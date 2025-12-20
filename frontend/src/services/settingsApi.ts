// FILE: src/services/settingsAPI.ts
// ============================================================================

import api from './api';

export interface UserSettings {
  id: number;
  username: string;
  email: string;
  display_name?: string;
  profile_image?: string;
  preferences: string[];
  telegram_chat_id?: string;
  alert_speed: 'instant' | '30min' | 'hourly';
  keywords: string[];
  in_app_notifications: boolean;
  member_since: string;
}

export interface ContactChannels {
  email?: string;
  telegram_username?: string;
  in_app_notifications?: boolean;
}

export interface AlertSettings {
  alert_speed?: 'instant' | '30min' | 'hourly';
  keywords?: string[];
}

export interface UserStats {
  alerts_today: number;
  saved_jobs: number;
  subscribers: number;
  notification_status: string;
}

export const settingsAPI = {
  // Get user settings
  getUserSettings: async (): Promise<UserSettings> => {
    const response = await api.get('/api/settings/profile');
    return response.data;
  },

  // Update profile (name, avatar)
  updateProfile: async (data: { display_name?: string; profile_image?: string }) => {
    const response = await api.put('/api/settings/profile', data);
    return response.data;
  },

  // Update contact channels (email, telegram)
  updateContactChannels: async (data: ContactChannels) => {
    const response = await api.put('/api/settings/contact-channels', data);
    return response.data;
  },

  // Update alert settings (speed, keywords)
  updateAlertSettings: async (data: AlertSettings) => {
    const response = await api.put('/api/settings/alerts', data);
    return response.data;
  },

  // Update job preferences
  updatePreferences: async (preferences: string[]) => {
    const response = await api.put('/api/settings/preferences', preferences);
    return response.data;
  },

  // Upload avatar
  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/api/settings/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Disconnect social account
  disconnectAccount: async (provider: 'twitter' | 'google') => {
    const response = await api.delete(`/api/settings/disconnect-account?provider=${provider}`);
    return response.data;
  },

  // Get user stats
  getUserStats: async (): Promise<UserStats> => {
    const response = await api.get('/api/settings/stats');
    return response.data;
  },
};