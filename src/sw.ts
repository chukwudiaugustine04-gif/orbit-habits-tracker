/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';

precacheAndRoute(self.__WB_MANIFEST || []);

self.addEventListener('notificationclick', (event) => {
  const action = event.action;
  const notification = event.notification;

  if (action === 'stop-alarm') {
    // Forward to any open clients so the in-page audio engine stops
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      clients.forEach((client) => client.postMessage({ type: 'STOP_ALARM' }));
    });
    notification.close();
  } else if (action === 'snooze') {
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      clients.forEach((client) => client.postMessage({ type: 'SNOOZE_ALARM', minutes: 5 }));
    });
    notification.close();
  } else {
    // No action (body click) — focus or open the app
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) return client.focus();
        }
        if (self.clients.openWindow) return self.clients.openWindow('/');
      })
    );
    notification.close();
  }
});
