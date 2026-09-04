const CACHE_NAME = 'weathergpt-pwa-v2';

// Core assets required to render the application shell offline
const STATIC_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/logo.png',
  '/logo_new.jpg'
];

// 1. Install Event: Cache core static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_SHELL).catch((err) => {
        console.warn('PWA Pre-caching partial warning:', err);
      });
    })
  );
  self.skipWaiting();
});

// 2. Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch Event: Network-First for dynamic UI, Cache Fallback for offline
// IMPORTANT: Never intercept or cache API requests (/api/*) or non-GET requests to prevent any disruption to AI Chat or live data!
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Strictly bypass Service Worker for API endpoints, WebSocket streams, or non-GET calls
  if (
    event.request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.protocol === 'ws:' ||
    url.protocol === 'wss:'
  ) {
    return; // Pass through directly to live network
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache valid static responses for offline use
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === 'basic' &&
          !url.pathname.startsWith('/api/')
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Offline: Serve from cache if available
        const cached = await caches.match(event.request);
        if (cached) {
          return cached;
        }
        // If navigating to an HTML page while offline, serve cached index.html shell
        if (event.request.mode === 'navigate') {
          const shell = await caches.match('/');
          if (shell) return shell;
          return caches.match('/index.html');
        }
        return new Response('Offline: Content unavailable without network connection.', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain' })
        });
      })
  );
});

// 4. Push Notifications Handler
self.addEventListener('push', function(event) {
  let data = { title: '⚠️ Weather Alert', message: 'Severe weather advisory issued for your area.' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: '⚠️ Weather Alert', message: event.data.text() };
    }
  }

  const options = {
    body: data.message || data.body || 'Severe weather advisory issued.',
    icon: '/logo_new.jpg',
    badge: '/favicon.svg',
    vibrate: data.vibrate || [300, 100, 300, 100, 300],
    tag: data.tag || 'weather-alert',
    renotify: true,
    requireInteraction: true,
    data: { url: data.url || '/alerts' },
    actions: [
      { action: 'open', title: '🚨 View Alert' },
      { action: 'close', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '⚠️ WeatherGPT Emergency Alert', options)
  );
});

// 5. Notification Click Handler
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  if (event.action === 'close') return;

  const targetUrl = (event.notification.data && event.notification.data.url) || '/alerts';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if ('focus' in client) {
          if (client.url.includes(targetUrl)) {
            return client.focus();
          }
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// 6. Direct Message Notification Trigger
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    event.waitUntil(
      self.registration.showNotification(event.data.title, {
        body: event.data.message,
        icon: '/logo_new.jpg',
        requireInteraction: true
      })
    );
  }
});
