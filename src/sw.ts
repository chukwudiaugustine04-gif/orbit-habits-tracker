/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';

precacheAndRoute(self.__WB_MANIFEST || []);

// Notification action buttons — the alarm notification posts a message
// to all open client windows so the in-page audio engine can react.
self.addEventListener('notificationclick', (event) => {
  const action = event.action;
  const notification = event.notification;

  if (action === 'stop-alarm') {
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => client.postMessage({ type: 'STOP_ALARM' }));
    });
    notification.close();
  } else if (action === 'snooze') {
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => client.postMessage({ type: 'SNOOZE_ALARM', minutes: 5 }));
    });
    notification.close();
  } else {
    // No action (body click) — focus or open the app
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) return client.focus();
        }
        if (self.clients.openWindow) return self.clients.openWindow('/');
      })
    );
    notification.close();
  }
});
