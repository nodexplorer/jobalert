// FILE: src/components/Settings/ContactChannels.tsx (Updated)
// ============================================================================

import { Check, Mail, Send } from 'lucide-react';
import { useState } from 'react';

interface ContactChannelsProps {
  email: string;
  telegram: string;
  inAppNotifications: boolean;
  onSave: (data: any) => Promise<void>;
  saving: boolean;
}

export default function ContactChannels({
  email: initialEmail,
  telegram: initialTelegram,
  inAppNotifications: initialNotifications,
  onSave,
  saving,
}: ContactChannelsProps) {
  const [email, setEmail] = useState(initialEmail);
  const [telegram, setTelegram] = useState(initialTelegram);
  const [inAppNotifications, setInAppNotifications] = useState(initialNotifications);

  const handleSave = async () => {
    await onSave({
      email,
      telegram_username: telegram,
      in_app_notifications: inAppNotifications,
    });
  };

  const hasChanges = 
    email !== initialEmail ||
    telegram !== initialTelegram ||
    inAppNotifications !== initialNotifications;

  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Contact Channels</h3>
      
      {/* Email */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />
          {email === initialEmail && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Telegram */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Telegram Username
        </label>
        <div className="relative">
          <Send className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={telegram}
            onChange={(e) => setTelegram(e.target.value)}
            className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            placeholder="@username"
          />
          {telegram === initialTelegram && telegram && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* In-App Notifications Toggle */}
      <div className="flex items-center justify-between py-4 border-t border-gray-200 mb-6">
        <div>
          <h4 className="font-semibold text-gray-900">In-App Notifications</h4>
          <p className="text-sm text-gray-600">Get notified inside the app</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={inAppNotifications}
            onChange={(e) => setInAppNotifications(e.target.checked)}
          />
          <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
          <span className="ml-3 text-sm font-medium text-green-600">
            {inAppNotifications ? 'Turned On' : 'Turned Off'}
          </span>
        </label>
      </div>

      {/* Save Button */}
      {hasChanges && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      )}
    </div>
  );
}