// FILE: src/components/Dashboard/StatsCards.tsx

import { Zap, Bell, Briefcase } from 'lucide-react';

interface StatsCardsProps {
  savedCount: number;
  appliedCount: number;
  alertsToday: number;
}

export default function StatsCards({ savedCount, appliedCount, alertsToday }: StatsCardsProps) {
  return (
    <div className="mb-6">
      {/* Greeting */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-3xl">👋</span>
        <h1 className="text-2xl font-bold text-gray-900">
          Arabic هادئ, Hadi!
        </h1>
      </div>
      <p className="text-gray-600 mb-6">Let's see what's new in the world of video editing.</p>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Live Scan */}
        <div className="bg-gradient-to-br from-green-100 to-emerald-50 rounded-2xl p-6 border border-green-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-500 rounded-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-900">Live Scan Active</h3>
          </div>
          <p className="text-sm text-gray-700">
            Scanning X for video editing jobs in real time...
          </p>
        </div>

        {/* Alerts Today */}
        <div className="bg-gradient-to-br from-blue-100 to-cyan-50 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-900">Job Alerts Sent Today</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-blue-600">{alertsToday}</span>
            <span className="text-gray-600">matches sent</span>
          </div>
        </div>

        {/* Jobs Applied */}
        <div className="bg-gradient-to-br from-purple-100 to-pink-50 rounded-2xl p-6 border border-purple-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-500 rounded-lg">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-900">Jobs Applied To</h3>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <div className="text-2xl font-bold text-purple-600">{savedCount}</div>
              <div className="text-xs text-gray-600">Saved</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{appliedCount}</div>
              <div className="text-xs text-gray-600">Applied</div>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-2">Keep track of jobs you've shown interest in</p>
        </div>
      </div>
    </div>
  );
}