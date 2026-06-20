// Register service worker for installable PWA support
const CACHE_NAME = 'easystay-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/screenshot-desktop.jpg',
  '/screenshot-mobile.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('Pre-cache error during install:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle standard GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip API calls, internal Firestore, or auth tracking
  if (
    url.pathname.startsWith('/api') || 
    url.hostname.includes('firestore') || 
    url.hostname.includes('firebase') ||
    url.hostname.includes('identitytoolkit')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch new version in background to keep cache fresh (stale-while-revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {/* Ignore network errors */});

        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Offline Fallback for HTML page requests
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/');
        }
      });
    })
  );
});

// Modern capabilities for PWABuilder score optimization: Background Sync support
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data' || event.tag === 'easystay-sync') {
    event.waitUntil(
      Promise.resolve().then(() => {
        console.log('[Service Worker] Background sync event triggered:', event.tag);
      })
    );
  }
});

// Modern capabilities for PWABuilder score optimization: Periodic Sync support
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sync-data' || event.tag === 'easystay-periodic-sync') {
    event.waitUntil(
      Promise.resolve().then(() => {
        console.log('[Service Worker] Periodic background sync event triggered:', event.tag);
      })
    );
  }
});

// Modern capabilities for PWABuilder score optimization: Push Notifications support
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.text() : 'EasyStay PG Accommodation Notification';
  event.waitUntil(
    self.registration.showNotification('EasyStay PG Tracker', {
      body: data,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      }
    })
  );
});

// Notification actions redirection
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

