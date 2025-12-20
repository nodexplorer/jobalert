// src/components/Dashboard/JobCard.tsx

import { ExternalLink, Bookmark, MoreVertical, Clock } from 'lucide-react';
import type { Job } from '../types';

interface JobCardProps {
  job: Job;
  isSaved: boolean;
  onSave: () => void;
  onUnsave: () => void;
}

export default function JobCard({ job, isSaved, onSave, onUnsave }: JobCardProps) {
  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes} mins ago`;
    return 'Just now';
  };

  const isNew = new Date().getTime() - new Date(job.created_at).getTime() < 300000; // 5 mins

  return (
    <div className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          {/* Avatar */}
          <img
            src={`https://ui-avatars.com/api/?name=${job.username}&background=667eea&color=fff`}
            alt={job.username}
            className="w-12 h-12 rounded-full"
          />
          
          {/* User Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900">@{job.username}</span>
              {isNew && (
                <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  NEW
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="text-blue-500">✓</span>
              <span>{job.author}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeAgo(job.created_at)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={isSaved ? onUnsave : onSave}
              className={`p-2 rounded-lg transition-colors ${
                isSaved 
                  ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Job Content */}
      <p className="text-gray-700 leading-relaxed mb-4">{job.text}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
          #VideoEditing
        </span>
        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">
          #Paid
        </span>
        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
          #Remote
        </span>
        <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-semibold">
          #Short-form
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>{timeAgo(job.posted_at)}</span>
        </div>

        <a
          href={job.tweet_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-all hover:translate-x-1"
        >
          View on X
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}








// // Job Card Component

// import { ExternalLink } from 'lucide-react';

// export default function JobCard() {
//   return (
//     <div className="bg-gray-50 rounded-xl p-6 border-l-4 border-blue-500">
//       {/* Header */}
//       <div className="flex items-start justify-between mb-4">
//         <div className="flex items-center gap-3">
//           <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
//             VE
//           </div>
//           <div>
//             <div className="font-bold text-gray-900">@VideoEditorPro</div>
//             <div className="text-sm text-gray-500 flex items-center gap-1">
//               <span>⏰</span> 2 mins ago
//             </div>
//           </div>
//         </div>
//         <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
//           NEW
//         </span>
//       </div>

//       {/* Content */}
//       <p className="text-gray-700 leading-relaxed mb-4">
//         I'm looking for a video editor for short, form content! 15-60 second clips. CapCut or 
//         Premiere Pro. Must be able to deliver fast in YouTube Shorts / TikTok / Reels format. 
//         Paid & remote. DM me your rates & examples.
//       </p>

//       {/* Tags */}
//       <div className="flex flex-wrap gap-2 mb-3">
//         <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
//           #VideoEditing
//         </span>
//         <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">
//           #Paid
//         </span>
//         <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
//           #Remote
//         </span>
//         <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-semibold">
//           #Short-form
//         </span>
//       </div>

//       {/* View Button */}
//       <button className="flex items-center gap-2 bg-blue-500 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-all hover:translate-x-1">
//         View on X
//         <ExternalLink className="w-4 h-4" />
//       </button>
//     </div>
//   );
// }
