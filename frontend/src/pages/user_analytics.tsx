// USER ANALYTICS DASHBOARD

import { useState } from 'react';
import { useEffect } from 'react';
import { userAPI } from '../services/api';
import { BarChart3, Briefcase, TrendingUp, CheckCircle, Bell, Activity } from 'lucide-react';
import StatCard from '../components/StatCard';
import { CategoryBar } from '../components/CategoryBar';
import { SimpleBarChart } from '../components/SimpleBarChart';

function UserDashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('week');

    useEffect(() => {
        loadData();
    }, [timeRange]);

    const loadData = async () => {
        setLoading(true);
        const result = await userAPI.getUserDashboard(timeRange);
        setData(result);
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img
                            src={data.user.avatar}
                            alt={data.user.name}
                            className="w-16 h-16 rounded-full border-4 border-white shadow-lg"
                        />
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Your Analytics</h1>
                            <p className="text-gray-600">
                                Member since {new Date(data.user.member_since).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="year">This Year</option>
                    </select>
                </div>

                {/* Stats Cards */}
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        icon={Briefcase}
                        label="Jobs Matched"
                        value={data.summary.total_jobs_matched}
                        trend={+12.5}
                        color="blue"
                    />
                    <StatCard
                        icon={Bell}
                        label="Notifications"
                        value={data.summary.total_notifications}
                        trend={+8.3}
                        color="green"
                    />
                    <StatCard
                        icon={TrendingUp}
                        label="Avg Jobs/Day"
                        value={data.summary.avg_jobs_per_day}
                        trend={+5.2}
                        color="purple"
                    />
                    <StatCard
                        icon={CheckCircle}
                        label="Response Rate"
                        value={`${data.summary.response_rate}%`}
                        trend={0}
                        color="orange"
                    />
                </div>

                {/* Charts Row */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {/* Jobs Trend Chart */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-blue-500" />
                            Jobs Over Time
                        </h3>
                        <div className="h-64">
                            <SimpleBarChart data={data.breakdown.daily_trend} />
                        </div>
                    </div>

                    {/* Category Breakdown */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-green-500" />
                            Jobs by Category
                        </h3>
                        <div className="space-y-4">
                            {data.breakdown.jobs_by_category.map((cat: any) => (
                                <CategoryBar key={cat.category} {...cat} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Preferences */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Your Preferences</h3>
                    <div className="flex flex-wrap gap-3">
                        {data.user.preferences.map((pref: string) => (
                            <span
                                key={pref}
                                className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                            >
                                {pref.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
