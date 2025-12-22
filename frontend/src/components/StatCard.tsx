// src/components/Statcard.tsx

import { ExternalLink, Trash2, Check, Mail, Smartphone, Send } from 'lucide-react';
import type { Notification } from '../types';



// Stat Card Component
// Stat Card Component
interface StatCardProps {
    label: string;
    value: number | string;
    icon: any; // Keeping any for flexibility, but treating it as a component in render
    color: 'blue' | 'red' | 'green' | 'purple' | 'orange';
    trend?: number;
}

export default function StatCard({ label, value, icon: Icon, color, trend }: StatCardProps) {
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-600',
        red: 'bg-red-100 text-red-600',
        green: 'bg-green-100 text-green-600',
        purple: 'bg-purple-100 text-purple-600',
        orange: 'bg-orange-100 text-orange-600',
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex justify-between items-start">
                <div className={`inline-flex p-2 rounded-lg ${colorClasses[color]} mb-2`}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center text-sm font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {trend > 0 ? '+' : ''}{trend}%
                    </div>
                )}
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-600">{label}</div>
        </div>
    );
}

// Notification Card Component
interface NotificationCardProps {
    notification: Notification;
    onMarkAsRead: () => void;
    onDelete: () => void;
    onClick: () => void;
}

export function NotificationCard({ notification, onMarkAsRead, onDelete, onClick }: NotificationCardProps) {
    const timeAgo = (date: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    };

    return (
        <div
            className={`bg-white rounded-xl shadow-lg p-6 transition-all hover:shadow-xl ${!notification.is_read ? 'border-l-4 border-green-500' : ''
                }`}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-gray-900">{notification.title}</h3>
                        {!notification.is_read && (
                            <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                                NEW
                            </span>
                        )}
                    </div>
                    <p className="text-gray-700 mb-3">{notification.message}</p>

                    {/* Job Details */}
                    {notification.job_title && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                {notification.job_category}
                            </span>
                            <span>•</span>
                            <span>{notification.job_title}</span>
                        </div>
                    )}

                    {/* Delivery Channels */}
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                        {notification.sent_via_email && (
                            <div className="flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                <span>Email</span>
                            </div>
                        )}
                        {notification.sent_via_telegram && (
                            <div className="flex items-center gap-1">
                                <Send className="w-4 h-4" />
                                <span>Telegram</span>
                            </div>
                        )}
                        {notification.sent_via_push && (
                            <div className="flex items-center gap-1">
                                <Smartphone className="w-4 h-4" />
                                <span>Push</span>
                            </div>
                        )}
                        <span>•</span>
                        <span>{timeAgo(notification.sent_at)}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                    {!notification.is_read && (
                        <button
                            onClick={onMarkAsRead}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Mark as read"
                        >
                            <Check className="w-5 h-5 text-gray-600" />
                        </button>
                    )}
                    <button
                        onClick={onDelete}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                    >
                        <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                </div>
            </div>

            {/* View Job Button */}
            {notification.job_url && (
                <button
                    onClick={onClick}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                    View Job
                    <ExternalLink className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}