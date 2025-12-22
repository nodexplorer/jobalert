//  src/pages/NotificationHistory.tsx

import { useState, useEffect } from 'react';
import { Bell, CheckCheck, Filter } from 'lucide-react';
import DashboardHeader from '../components/DashboardHeader';
import { notificationAPI } from '../services/notificationAPI';
import type { Notification, NotificationStats } from '../types';
import { toast } from 'react-hot-toast';
import StatCard, { NotificationCard } from '../components/StatCard';

export default function NotificationHistory() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [notifs, statsData] = await Promise.all([
        notificationAPI.getNotifications({ is_read: filter === 'unread' ? false : undefined }),
        notificationAPI.getStats(),
      ]);
      setNotifications(notifs);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationAPI.markAsRead([id]);
      await loadData();
      toast.success('Marked as read');
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      await loadData();
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this notification?')) return;

    try {
      await notificationAPI.deleteNotification(id);
      await loadData();
      toast.success('Notification deleted');
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  const handleClick = async (notification: Notification) => {
    try {
      await notificationAPI.markAsClicked(notification.id);
      if (notification.job_url) {
        window.open(notification.job_url, '_blank');
      }
      await loadData();
    } catch (error) {
      console.error('Failed to mark as clicked:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-cyan-50 to-blue-50">
      <DashboardHeader />

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Notification History
              </h1>
              <p className="text-gray-600">
                View all your job alerts and notifications
              </p>
            </div>
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <CheckCheck className="w-5 h-5" />
              Mark All Read
            </button>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <StatCard
                label="Total"
                value={stats.total}
                icon={<Bell className="w-5 h-5" />}
                color="blue"
              />
              <StatCard
                label="Unread"
                value={stats.unread}
                icon={<Bell className="w-5 h-5" />}
                color="red"
              />
              <StatCard
                label="Today"
                value={stats.today}
                icon={<Bell className="w-5 h-5" />}
                color="green"
              />
              <StatCard
                label="This Week"
                value={stats.this_week}
                icon={<Bell className="w-5 h-5" />}
                color="purple"
              />
            </div>
          )}

          {/* Filter */}
          <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-gray-400" />
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'unread'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  Unread ({stats?.unread || 0})
                </button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No notifications yet
                </h3>
                <p className="text-gray-600">
                  You'll see your job alerts here when they arrive
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={() => handleMarkAsRead(notification.id)}
                  onDelete={() => handleDelete(notification.id)}
                  onClick={() => handleClick(notification)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
