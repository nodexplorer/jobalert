// src/pages/Dashboard.tsx

import { useState, useEffect } from 'react';
import DashboardHeader from '../components/DashboardHeader';
import StatsCards from '../components/StatsCard';
import JobsList from '../components/JobList';
import Sidebar from '../components/Sidebar';
import { jobsAPI } from '../services/api';
import type { Job } from '../types';

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [filters, setFilters] = useState({
    jobType: ['short_form'],
    payment: ['paid'],
    postedWithin: 'last_10_mins',
    keywords: '',
  });
  const [activeTab, setActiveTab] = useState<'latest' | 'saved'>('latest');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadJobs, 30000);
    return () => clearInterval(interval);
  }, [filters]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await jobsAPI.getJobs('video_editing', 50);
      setJobs(data);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveJob = (jobId: number) => {
    const job = jobs.find(j => j.id === jobId);
    if (job && !savedJobs.find(j => j.id === jobId)) {
      setSavedJobs([...savedJobs, job]);
    }
  };

  const handleUnsaveJob = (jobId: number) => {
    setSavedJobs(savedJobs.filter(j => j.id !== jobId));
  };

  const displayedJobs = activeTab === 'latest' ? jobs : savedJobs;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-cyan-50 to-blue-50">
      <DashboardHeader />

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Main Content */}
          <div>
            <StatsCards
              savedCount={savedJobs.length}
              appliedCount={5}
              alertsToday={5}
            />

            <JobsList
              jobs={displayedJobs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onSaveJob={handleSaveJob}
              onUnsaveJob={handleUnsaveJob}
              savedJobIds={savedJobs.map(j => j.id)}
              loading={loading}
            />
          </div>

          {/* Sidebar */}
          <Sidebar
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>
      </div>
    </div>
  );
}
