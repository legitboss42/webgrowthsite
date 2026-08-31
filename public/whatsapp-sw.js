self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "New WhatsApp message", body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "New WhatsApp message";
  const options = {
    body: payload.body || "Open Web Growth to view the conversation.",
    icon: payload.icon || "/images/logo.webp",
    badge: payload.badge || "/favicon.ico",
    tag: payload.id || "webgrowth-whatsapp",
    renotify: true,
    data: { url: payload.url || "/admin/whatsapp/conversations/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/admin/whatsapp/conversations/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clients) => {
      for (const client of clients) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          if ("navigate" in client) await client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow ? self.clients.openWindow(target) : undefined;
    }),
  );
});
