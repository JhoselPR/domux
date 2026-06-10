self.__WB_MANIFEST;

self.addEventListener('push', (event) => {
  let payload = {};

  if (event.data) {
    try {
      payload = event.data.json();
    } catch (_error) {
      payload = { body: event.data.text() };
    }
  }

  const title = payload.title || 'Domux';
  const options = {
    body: payload.body || 'Tienes un nuevo recordatorio.',
    icon: payload.icon || '/favicon.svg',
    badge: payload.badge || '/favicon.svg',
    tag: payload.tag || 'domux-reminder',
    data: payload.data || { route: '/tasks' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const route = event.notification.data?.route || '/tasks';
  const targetUrl = new URL(route, self.location.origin).href;

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const currentWindow = windows.find((client) => client.url.startsWith(self.location.origin));

    if (currentWindow) {
      if ('navigate' in currentWindow) {
        await currentWindow.navigate(targetUrl);
      }
      await currentWindow.focus();
      return;
    }

    await self.clients.openWindow(targetUrl);
  })());
});
