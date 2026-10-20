// public/sw.js
self.addEventListener('notificationclick', (event) => {
  const action = event.action;
  const notification = event.notification;

  if (action === 'stop-alarm') {
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ type: 'STOP_ALARM' });
      });
    });
    notification.close();
  } else if (action === 'snooze') {
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ type: 'SNOOZE_ALARM', minutes: 5 });
      });
    });
    notification.close();
  } else {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url && 'focus' in client) return client.focus();
        }
        if (clients.openWindow) return clients.openWindow('/');
      })
    );
    notification.close();
  }
});