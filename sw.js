'use strict';

self.addEventListener('push', event => {
  let payload = {};
  try { payload = event.data?.json() || {}; } catch {}
  event.waitUntil(self.registration.showNotification(payload.title || 'Ciel · Terminerinnerung', {
    body: payload.body || 'Schau in deine Termine.',
    icon: new URL('icon.png', self.registration.scope).href,
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const url = new URL(self.registration.scope);
    const clients = await self.clients.matchAll({type: 'window', includeUncontrolled: true});
    const existing = clients.find(client => client.url.startsWith(url.href));
    if (existing) return existing.focus();
    return self.clients.openWindow(url.href);
  })());
});
