// Demo Card Component

import { Zap } from 'lucide-react';
import JobCard from './JobCard';

export default function DemoCard() {
  return (
    <div className="mt-6 max-w-3xl bg-white rounded-2xl shadow-2xl p-6 lg:p-8">
      {/* Search Bar */}
      <div className="flex items-center gap-4 bg-gray-50 rounded-xl px-4 py-3 mb-6">
        <span className="text-xl">🔍</span>
        <input
          type="text"
          placeholder="Search jobs or keywords (e.g. react, YouTube)"
          className="flex-1 bg-transparent border-none outline-none text-gray-700 placeholder-gray-400"
          readOnly
        />
        <button className="text-2xl hover:scale-110 transition-transform">😊</button>
      </div>

      {/* Live Scan Badge */}
      <div className="flex items-center gap-3x bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl px-4 py-3 mb-6">
        <div className="relative">
          <div className="w-3 h-3 bg-teal-500 rounded-full animate-ping absolute"></div>
          <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Zap className="w-5 h-5 text-teal-600" />
          <span className="font-bold text-gray-900">Live Scan Active</span>
          <span className="text-teal-700">Scanning X for video editing jobs in real time...</span>
        </div>
      </div>

      {/* Job Card */}
      <JobCard
        job={{
          id: 0,
          tweet_id: 'demo',
          tweet_url: '#',
          author: 'Demo User',
          username: 'demouser',
          text: 'This is a demo job showing how the alert system works. We scan X (Twitter) in real-time to find paid opportunities for you.',
          category: 'video_editing',
          posted_at: new Date().toISOString(),
          engagement: { likes: 10, retweets: 5 },
          created_at: new Date().toISOString(),
        }}
        isSaved={false}
        onSave={() => { }}
        onUnsave={() => { }}
      />

      {/* Info Text */}
      <p className="text-center text-gray-500 mt-6 flex items-center justify-center gap-2">
        <span>ℹ️</span>
        We're scanning X right now. Your first alert could drop any second
        <Zap className="w-4 h-4 text-yellow-500" />
      </p>
    </div>
  );
}
