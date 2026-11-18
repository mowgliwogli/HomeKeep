const CACHE_NAME = 'homekeep-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './assets/icons/favicon.svg'
];

// Install event - cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
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
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        return fetch(event.request).then(response => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // Offline fallback
        return caches.match('./index.html');
      })
  );
});

// Background sync for offline task updates
self.addEventListener('sync', event => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncTasks());
  }
});

async function syncTasks() {
  // This would sync with a backend server when online
  console.log('Syncing tasks...');
}

// Push notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Maintenance reminder',
    icon: './assets/icons/icon-192.png',
    badge: './assets/icons/icon-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {action: 'complete', title: 'Mark Complete'},
      {action: 'snooze', title: 'Snooze'}
    ]
  };

  event.waitUntil(
    self.registration.showNotification('HomeKeep', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'complete') {
    // Handle complete action
    console.log('Task completed from notification');
  } else if (event.action === 'snooze') {
    // Handle snooze action
    console.log('Task snoozed');
  } else {
    // Open app
    event.waitUntil(
      clients.openWindow('./')
    );
  }
});
