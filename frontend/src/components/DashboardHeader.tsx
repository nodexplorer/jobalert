// FILE: src/components/Dashboard/DashboardHeader.tsx

import { Search, Bell } from 'lucide-react';
import { useState } from 'react';

export default function DashboardHeader() {
  const [searchQuery, setSearchQuery] = useState('');
  const user = { name: 'Hadi', avatar: '/user-avatar.jpg' };

  return (
    <header className="bg-gradient-to-r from-green-500 to-cyan-400 shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src="/logos.png" alt="Logo" className="w-10 h-10 rounded-xl" />
            <span className="text-white font-bold text-xl hidden sm:block">JobAlert</span>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jobs or keywords (e.g. reels, YouTube)"
                className="w-full pl-12 pr-4 py-3 rounded-xl border-none shadow-lg focus:ring-2 focus:ring-white/50 outline-none"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <button className="hidden sm:flex items-center gap-2 text-white font-medium hover:bg-white/20 px-4 py-2 rounded-lg transition-colors">
              <Search className="w-5 h-5" />
              Seert jobs
            </button>

            {/* Notifications */}
            <button className="relative p-2 hover:bg-white/20 rounded-lg transition-colors">
              <Bell className="w-6 h-6 text-white" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-yellow-400 rounded-full"></span>
            </button>

            {/* User Avatar */}
            <button className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/50 hover:ring-white transition-all">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${user.name}&background=667eea&color=fff`;
                }}
              />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
