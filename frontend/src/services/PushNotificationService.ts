// FILE: src/services/pushNotificationService.ts
// ============================================================================

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export const pushNotificationService = {
  // Check if push notifications are supported
  isSupported: (): boolean => {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  },

  // Check current permission status
  getPermission: (): NotificationPermission => {
    return Notification.permission;
  },

  // Request notification permission
  requestPermission: async (): Promise<NotificationPermission> => {
    if (!pushNotificationService.isSupported()) {
      throw new Error('Push notifications not supported');
    }

    const permission = await Notification.requestPermission();
    return permission;
  },

  // Register service worker
  registerServiceWorker: async (): Promise<ServiceWorkerRegistration> => {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers not supported');
    }

    const registration = await navigator.serviceWorker.register('/service-worker.js');
    console.log('Service Worker registered:', registration);
    return registration;
  },

  // Subscribe to push notifications
  subscribeToPush: async (userId: number): Promise<PushSubscription | null> => {
    try {
      // Register service worker first
      const registration = await pushNotificationService.registerServiceWorker();

      // Request permission
      const permission = await pushNotificationService.requestPermission();
      if (permission !== 'granted') {
        console.log('Push notification permission denied');
        return null;
      }

      // Get VAPID public key from backend
      const vapidPublicKey = await pushNotificationService.getVapidPublicKey();

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: pushNotificationService.urlBase64ToUint8Array(vapidPublicKey),
      });

      // Convert to our format
      const subscriptionData: PushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
          auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))),
        },
      };

      // Send subscription to backend
      await pushNotificationService.saveSubscription(userId, subscriptionData);

      console.log('✅ Push subscription created:', subscriptionData);
      return subscriptionData;

    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  },

  // Unsubscribe from push notifications
  unsubscribe: async (userId: number): Promise<boolean> => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        await pushNotificationService.removeSubscription(userId);
        console.log('✅ Push subscription removed');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Unsubscribe failed:', error);
      return false;
    }
  },

  // Check if user is subscribed
  isSubscribed: async (): Promise<boolean> => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return !!subscription;
    } catch {
      return false;
    }
  },

  // Get VAPID public key from backend
  getVapidPublicKey: async (): Promise<string> => {
    const response = await fetch('/api/push/vapid-public-key');
    const data = await response.json();
    return data.publicKey;
  },

  // Save subscription to backend
  saveSubscription: async (userId: number, subscription: PushSubscription): Promise<void> => {
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(subscription),
    });
  },

  // Remove subscription from backend
  removeSubscription: async (userId: number): Promise<void> => {
    await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
  },

  // Test notification
  testNotification: async (): Promise<void> => {
    if (Notification.permission === 'granted') {
      new Notification('Test Notification', {
        body: 'This is a test notification from X Job Bot',
        icon: '/logos.png',
      });
    }
  },

  // Utility: Convert VAPID key
  urlBase64ToUint8Array: (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  },
};