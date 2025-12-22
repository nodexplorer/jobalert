// FILE: src/services/notificationAPI.ts
// ============================================================================

import api from './api';

export interface Notification {
  id: number;
  user_id: number;
  job_id?: number;
  title: string;
  message: string;
  notification_type: string;
  job_title?: string;
  job_category?: string;
  job_url?: string;
  is_read: boolean;
  is_clicked: boolean;
  sent_via_email: boolean;
  sent_via_telegram: boolean;
  sent_via_push: boolean;
  sent_at: string;
  read_at?: string;
  clicked_at?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  clicked: number;
  today: number;
  this_week: number;
}

interface GetNotificationsParams {
  skip?: number;
  limit?: number;
  notification_type?: string;
  is_read?: boolean;
}

export const notificationAPI = {
  // Get notifications with filters
  getNotifications: async (params: GetNotificationsParams = {}): Promise<Notification[]> => {
    const response = await api.get('/api/notifications', { params });
    return response.data;
  },

  // Get notification stats
  getStats: async (): Promise<NotificationStats> => {
    const response = await api.get('/api/notifications/stats');
    return response.data;
  },

  // Mark notifications as read
  markAsRead: async (notificationIds: number[]): Promise<void> => {
    await api.post('/api/notifications/mark-read', {
      notification_ids: notificationIds,
    });
  },

  // Mark all as read
  markAllAsRead: async (): Promise<void> => {
    await api.post('/api/notifications/mark-all-read');
  },

  // Mark notification as clicked
  markAsClicked: async (notificationId: number): Promise<void> => {
    await api.post(`/api/notifications/${notificationId}/click`);
  },

  // Delete notification
  deleteNotification: async (notificationId: number): Promise<void> => {
    await api.delete(`/api/notifications/${notificationId}`);
  },

  // Delete all notifications
  deleteAllNotifications: async (): Promise<void> => {
    await api.delete('/api/notifications');
  },
};
