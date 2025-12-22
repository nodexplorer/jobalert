// FILE: src/components/Settings/PushNotificationToggle.tsx

import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { pushNotificationService } from '../../services/PushNotificationService';
import { authService } from '../../services/auth';
import { toast } from 'react-hot-toast';

export default function PushNotificationToggle() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [enabling, setEnabling] = useState(false);
  const user = authService.getCurrentUser();

  useEffect(() => {
    checkSupport();
  }, []);

  const checkSupport = async () => {
    const isSupported = pushNotificationService.isSupported();
    setSupported(isSupported);

    if (isSupported) {
      const isSubscribed = await pushNotificationService.isSubscribed();
      setSubscribed(isSubscribed);
    }
  };

  const handleToggle = async () => {
    if (!user) return;

    setEnabling(true);

    try {
      if (subscribed) {
        // Unsubscribe
        const success = await pushNotificationService.unsubscribe(user.id);
        if (success) {
          setSubscribed(false);
          toast.success('Push notifications disabled');
        }
      } else {
        // Subscribe
        const subscription = await pushNotificationService.subscribeToPush(user.id);
        if (subscription) {
          setSubscribed(true);
          toast.success('Push notifications enabled!');
          
          // Test notification
          setTimeout(() => {
            pushNotificationService.testNotification();
          }, 1000);
        } else {
          toast.error('Failed to enable push notifications');
        }
      }
    } catch (error) {
      console.error('Toggle push error:', error);
      toast.error('Failed to update push notifications');
    } finally {
      setEnabling(false);
    }
  };

  if (!supported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <BellOff className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-900 mb-1">
              Push Notifications Not Available
            </h3>
            <p className="text-sm text-yellow-700">
              Your browser doesn't support push notifications. Try using Chrome, Firefox, or Edge.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-4 border-t border-gray-200">
      <div className="flex items-start gap-3">
        <Bell className="w-5 h-5 text-blue-600 mt-1" />
        <div>
          <h4 className="font-semibold text-gray-900">Push Notifications</h4>
          <p className="text-sm text-gray-600">
            Get desktop notifications even when the app is closed
          </p>
        </div>
      </div>
      
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={subscribed}
          onChange={handleToggle}
          disabled={enabling}
        />
        <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
        <span className="ml-3 text-sm font-medium text-gray-700">
          {enabling ? 'Loading...' : subscribed ? 'Enabled' : 'Disabled'}
        </span>
      </label>
    </div>
  );
}