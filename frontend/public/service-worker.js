// FILE: public/service-worker.js
// ============================================================================

self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(clients.claim());
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received', event);
  
  const data = event.data ? event.data.json() : {};
  
  const title = data.title || 'New Job Alert!';
  const options = {
    body: data.body || 'A new job matching your preferences is available',
    icon: data.icon || '/logos.png',
    badge: '/badge.png',
    data: {
      url: data.url || '/',
      jobId: data.jobId,
    },
    actions: [
      {
        action: 'view',
        title: 'View Job',
      },
      {
        action: 'close',
        title: 'Close',
      },
    ],
    tag: data.tag || 'job-alert',
    requireInteraction: true,
    vibrate: [200, 100, 200],
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked', event);
  
  event.notification.close();
  
  if (event.action === 'view' || !event.action) {
    const url = event.notification.data.url;
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Check if there's already a window open
          for (let client of clientList) {
            if (client.url === url && 'focus' in client) {
              return client.focus();
            }
          }
          // Open new window
          if (clients.openWindow) {
            return clients.openWindow(url);
          }
        })
    );
  }
});