self.addEventListener('push', (event) => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch (error) {
    payload = {
      title: 'Atualizacao de partida',
      body: event.data ? event.data.text() : ''
    };
  }

  const tag = String(payload?.tag || 'notificacao-geral');
  if (payload?.closeTagOnly) {
    event.waitUntil(
      self.registration.getNotifications({ tag }).then((notificacoes) => {
        notificacoes.forEach((notificacao) => notificacao.close());
      })
    );
    return;
  }

  const closeTagPrefix = String(payload?.closeTagPrefix || '').trim();
  if (closeTagPrefix) {
    event.waitUntil(
      self.registration.getNotifications().then((notificacoes) => {
        notificacoes.forEach((notificacao) => {
          const notificationTag = String(notificacao?.tag || '').trim();
          if (notificationTag.startsWith(closeTagPrefix)) {
            notificacao.close();
          }
        });
      })
    );
    return;
  }

  const title = String(payload?.title || 'Nova notificacao');
  const icon = String(payload?.icon || '/logo.png');
  const image = String(payload?.image || '').trim();
  const actions = Array.isArray(payload?.actions)
    ? payload.actions
      .map((item) => ({
        action: String(item?.action || '').trim(),
        title: String(item?.title || '').trim()
      }))
      .filter((item) => item.action && item.title)
    : [];
  const options = {
    body: String(payload?.body || ''),
    icon,
    badge: String(payload?.badge || '/logo.png'),
    image: image || undefined,
    tag,
    renotify: Boolean(payload?.renotify),
    requireInteraction: Boolean(payload?.requireInteraction),
    silent: Boolean(payload?.silent),
    actions,
    data: payload?.data || {}
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification?.data || {};
  const urlRelativa = String(data?.url || '/visualizarplacarhome');
  const urlDestino = new URL(urlRelativa, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((lista) => {
      for (const cliente of lista) {
        if (typeof cliente.focus === 'function' && cliente.url === urlDestino) {
          return cliente.focus();
        }
      }

      if (lista.length > 0) {
        const primeiroCliente = lista[0];
        if (typeof primeiroCliente.navigate === 'function') {
          return primeiroCliente.navigate(urlDestino).then(() => primeiroCliente.focus());
        }
        if (typeof primeiroCliente.focus === 'function') {
          return primeiroCliente.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(urlDestino);
      }

      return null;
    })
  );
});
