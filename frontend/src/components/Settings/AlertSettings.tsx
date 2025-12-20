// src/components/Settings/AlertSettings.tsx

import { Zap, Clock, Timer } from 'lucide-react';
import { useState } from 'react';

export default function AlertSettings() {
  const [alertSpeed, setAlertSpeed] = useState<'instant' | '30min' | 'hourly'>('instant');
  const [keywords, setKeywords] = useState(['YouTube Shorts', 'TikTok', 'Reels', 'Video Editing', 'CapCut']);
  const [newKeyword, setNewKeyword] = useState('');

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Alert Speed</h3>
      
      {/* Speed Options */}
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <button
          onClick={() => setAlertSpeed('instant')}
          className={`p-4 rounded-xl border-2 transition-all ${
            alertSpeed === 'instant'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 hover:border-green-300'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap className={`w-5 h-5 ${alertSpeed === 'instant' ? 'text-green-600' : 'text-gray-400'}`} />
            <span className="font-semibold text-gray-900">Instant</span>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              recommended
            </span>
          </div>
        </button>

        <button
          onClick={() => setAlertSpeed('30min')}
          className={`p-4 rounded-xl border-2 transition-all ${
            alertSpeed === '30min'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 hover:border-green-300'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock className={`w-5 h-5 ${alertSpeed === '30min' ? 'text-green-600' : 'text-gray-400'}`} />
            <span className="font-semibold text-gray-900">Every 30 mins</span>
          </div>
        </button>

        <button
          onClick={() => setAlertSpeed('hourly')}
          className={`p-4 rounded-xl border-2 transition-all ${
            alertSpeed === 'hourly'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 hover:border-green-300'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Timer className={`w-5 h-5 ${alertSpeed === 'hourly' ? 'text-green-600' : 'text-gray-400'}`} />
            <span className="font-semibold text-gray-900">Hourly</span>
          </div>
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-6">
        Receive alerts exactly when new jobs drop
      </p>

      {/* Keywords */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Keywords
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {keywords.map((keyword) => (
            <span
              key={keyword}
              className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm"
            >
              {keyword}
              <button
                onClick={() => removeKeyword(keyword)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
            placeholder="CapCut"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />
          <button
            onClick={addKeyword}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Add
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Get alerts for jobs containing any of your keywords (optional)
        </p>
      </div>

      {/* Save Button */}
      <button className="px-8 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors">
        Save
      </button>
    </div>
  );
}