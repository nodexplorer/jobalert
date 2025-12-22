// ADMIN DASHBOARD

import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { BarChart3, Users, Briefcase, Bell, Activity, RefreshCw, Download, Trash2, UserCheck, UserX, Filter, MoreVertical, Search } from 'lucide-react';

function AdminDashboard() {
    const [view, setView] = useState<'overview' | 'users' | 'jobs'>('overview');
    const [overview, setOverview] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOverview();
    }, []);

    const loadOverview = async () => {
        setLoading(true);
        const data = await adminAPI.getAdminOverview();
        setOverview(data);
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
        <div className="min-h-screen bg-gray-50">
            {/* Admin Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                            <p className="text-gray-600">System overview and management</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
                                <RefreshCw className="w-4 h-4" />
                                Refresh
                            </button>
                            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2">
                                <Download className="w-4 h-4" />
                                Export
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex gap-8">
                        {[
                            { id: 'overview', label: 'Overview', icon: BarChart3 },
                            { id: 'users', label: 'Users', icon: Users },
                            { id: 'jobs', label: 'Jobs', icon: Briefcase }
                        ].map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setView(tab.id as any)}
                                    className={`flex items-center gap-2 py-4 px-2 border-b-2 transition ${view === tab.id
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto p-6">
                {view === 'overview' && <AdminOverview data={overview} />}
                {view === 'users' && <AdminUsers />}
                {view === 'jobs' && <AdminJobs />}
            </div>
        </div>
    );
}

// Sub-components
function MetricCard({ title, value, subtitle, icon: Icon, color, trend }: any) {
    const colors: any = {
        blue: 'bg-blue-50 text-blue-600 text-blue-600',
        green: 'bg-green-50 text-green-600 text-green-600',
        purple: 'bg-purple-50 text-purple-600 text-purple-600',
    };
    // Fix duplication in color classes if any, just simple lookup
    const colorClass = colors[color] || 'bg-gray-50 text-gray-600';

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorClass}`}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend && <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">{trend}</span>}
            </div>
            <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
            <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-gray-900">{value}</span>
                <span className="text-sm text-gray-500">{subtitle}</span>
            </div>
        </div>
    );
}

function HealthIndicator({ label, status, value }: any) {
    return (
        <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">{label}</div>
            <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">{value}</span>
                <div className={`w-2 h-2 rounded-full ${status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`} />
            </div>
        </div>
    );
}

function ActionButton({ label, icon: Icon }: any) {
    return (
        <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition border border-gray-100 group">
            <span className="text-gray-700 font-medium group-hover:text-gray-900">{label}</span>
            <Icon className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
        </button>
    );
}

function AdminOverview({ data }: { data: any }) {
    if (!data) return null;
    return (
        <div>
            {/* Key Metrics */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
                <MetricCard
                    title="Total Users"
                    value={data?.users?.total?.toLocaleString() || 0}
                    subtitle={`${data?.users?.active_percentage || 0}% active`}
                    icon={Users}
                    color="blue"
                    trend={`+${data?.users?.new_this_week || 0} this week`}
                />
                <MetricCard
                    title="Total Jobs"
                    value={data?.jobs?.total?.toLocaleString() || 0}
                    subtitle={`${data?.jobs?.today || 0} today`}
                    icon={Briefcase}
                    color="green"
                    trend={`${data?.jobs?.duplicate_rate || 0} duplicates`}
                />
                <MetricCard
                    title="Notifications"
                    value={data?.notifications?.total?.toLocaleString() || 0}
                    subtitle={`${data?.notifications?.today || 0} today`}
                    icon={Bell}
                    color="purple"
                    trend={`Avg ${data?.notifications?.avg_per_user || 0} per user`}
                />
            </div>

            {/* System Health */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-500" />
                    System Health
                </h3>
                <div className="grid md:grid-cols-4 gap-4">
                    <HealthIndicator label="API Status" status="healthy" value="99.9%" />
                    <HealthIndicator label="Scraping" status="healthy" value="Active" />
                    <HealthIndicator label="Notifications" status="healthy" value="Queue: 23" />
                    <HealthIndicator label="Database" status="healthy" value="12.4 GB" />
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                        <ActionButton label="Trigger Manual Scrape" icon={RefreshCw} />
                        <ActionButton label="Send Test Notification" icon={Bell} />
                        <ActionButton label="Clean Up Duplicates" icon={Trash2} />
                        <ActionButton label="Export User Data" icon={Download} />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                        {[
                            { text: "127 new jobs scraped", time: "5 min ago" },
                            { text: "34 users registered", time: "2 hours ago" },
                            { text: "342 notifications sent", time: "3 hours ago" },
                            { text: "Database backup completed", time: "6 hours ago" }
                        ].map((activity, i) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                <span className="text-gray-700">{activity.text}</span>
                                <span className="text-sm text-gray-500">{activity.time}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function AdminUsers() {
    const [users, setUsers] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());

    useEffect(() => {
        loadUsers();
    }, [page, search]);

    const loadUsers = async () => {
        setLoading(true);
        const data = await adminAPI.getAdminUsers(page, search);
        setUsers(data.users);
        setLoading(false);
    };

    const toggleUser = (userId: number) => {
        const newSelected = new Set(selectedUsers);
        if (newSelected.has(userId)) {
            newSelected.delete(userId);
        } else {
            newSelected.add(userId);
        }
        setSelectedUsers(newSelected);
    };

    return (
        <div>
            {/* Toolbar */}
            <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        {selectedUsers.size > 0 && (
                            <>
                                <button className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition flex items-center gap-2">
                                    <UserCheck className="w-4 h-4" />
                                    Verify ({selectedUsers.size})
                                </button>
                                <button className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition flex items-center gap-2">
                                    <UserX className="w-4 h-4" />
                                    Deactivate ({selectedUsers.size})
                                </button>
                            </>
                        )}
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2">
                            <Filter className="w-4 h-4" />
                            Filter
                        </button>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300"
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedUsers(new Set(users.map(u => u.id)));
                                        } else {
                                            setSelectedUsers(new Set());
                                        }
                                    }}
                                />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Active</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.has(user.id)}
                                        onChange={() => toggleUser(user.id)}
                                        className="rounded border-gray-300"
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                                            {user.twitter_name[0]}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">{user.twitter_name}</div>
                                            <div className="text-sm text-gray-500">@{user.twitter_username}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                        {user.is_verified && (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                Verified
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {new Date(user.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {new Date(user.last_login).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                                        <MoreVertical className="w-5 h-5 text-gray-600" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, 1247)} of 1,247 users
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AdminJobs() {
    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Job Management</h3>
            <p className="text-gray-600">Job management interface coming soon...</p>
        </div>
    );
}

export default AdminDashboard;
