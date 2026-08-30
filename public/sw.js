self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.message,
      icon: '/logo_new.jpg',
      vibrate: [200, 100, 200, 100, 200, 100, 200],
      tag: 'weather-alert',
      requireInteraction: true,
      data: { url: '/' }
    };
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then( windowClients => {
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// For demonstration, we also allow the page to trigger a notification via message
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
