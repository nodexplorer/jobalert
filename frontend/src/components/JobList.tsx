// FILE: src/components/Dashboard/JobsList.tsx
// ============================================================================

import { Zap, Star, Filter, MoreVertical } from 'lucide-react';
import JobCard from './JobCard';
import type { Job } from '../types';

interface JobsListProps {
  jobs: Job[];
  activeTab: 'latest' | 'saved';
  onTabChange: (tab: 'latest' | 'saved') => void;
  onSaveJob: (jobId: number) => void;
  onUnsaveJob: (jobId: number) => void;
  savedJobIds: number[];
  loading: boolean;
}

export default function JobsList({
  jobs,
  activeTab,
  onTabChange,
  onSaveJob,
  onUnsaveJob,
  savedJobIds,
  loading,
}: JobsListProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      {/* Tabs */}
      <div className="flex items-center justify-between mb-6 border-b border-gray-200">
        <div className="flex gap-6">
          <button
            onClick={() => onTabChange('latest')}
            className={`pb-3 px-2 font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'latest'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Zap className="w-5 h-5" />
            Latest Jobs
          </button>
          <button
            onClick={() => onTabChange('saved')}
            className={`pb-3 px-2 font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'saved'
                ? 'border-yellow-500 text-yellow-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Star className="w-5 h-5" />
            Saved Jobs
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Filter className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Jobs List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No jobs found. Adjust your filters or check back later!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isSaved={savedJobIds.includes(job.id)}
              onSave={() => onSaveJob(job.id)}
              onUnsave={() => onUnsaveJob(job.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}