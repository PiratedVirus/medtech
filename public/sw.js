// Service Worker for Push Notifications
const CACHE_NAME = 'caredb-notifications-v1';

console.log('Service Worker loaded');

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clear old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

// Push event
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  if (!event.data) {
    console.log('Push event but no data');
    return;
  }

  const data = event.data.json();
  console.log('Push data:', data);
  console.log('Notification title:', data.title);
  console.log('Notification body:', data.body);

  const options = {
    body: data.body || data.message,
    icon: '/placeholder.svg',
    badge: '/placeholder.svg',
    data: data.data || {},
    actions: [
      {
        action: 'view',
        title: 'View'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    requireInteraction: data.data?.priority === 'high',
    tag: data.data?.type || 'default',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'CareDB Notification', options)
      .then(() => {
        console.log('Notification displayed successfully');
      })
      .catch((error) => {
        console.error('Failed to display notification:', error);
      })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Handle notification click
  const data = event.notification.data;
  let url = '/dashboard';

  // Navigate based on notification type
  if (data?.action) {
    switch (data.action) {
      case 'VIEW_APPOINTMENT':
        url = '/dashboard/appointments';
        break;
      case 'VIEW_DIET_PLAN':
        url = '/dashboard/plans';
        break;
      case 'VIEW_RESULTS':
        url = '/dashboard/labs';
        break;
      case 'VIEW_PRESCRIPTION':
        url = '/dashboard/prescriptions';
        break;
      case 'BOOK_APPOINTMENT':
        url = '/dashboard/appointments';
        break;
      case 'RENEW_PLAN':
        url = '/dashboard/plans';
        break;
      default:
        url = '/dashboard';
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Background sync for offline notifications
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag);
  
  if (event.tag === 'notification-sync') {
    event.waitUntil(
      // Sync notifications when back online
      fetch('/api/notifications')
        .then(response => response.json())
        .then(data => {
          console.log('Synced notifications:', data);
        })
        .catch(error => {
          console.error('Sync failed:', error);
        })
    );
  }
});

// Message event for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
