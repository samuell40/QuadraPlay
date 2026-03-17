const PUSH_PREFS_CACHE = 'quadraplay-push-preferences-v1';
const PUSH_PREFS_REQUEST_URL = '/__quadraplay_push_preferences__';
const TAG_PREFIX_PARTIDA = 'partida-live-';

async function lerPreferenciasPush() {
  try {
    const cache = await caches.open(PUSH_PREFS_CACHE);
    const response = await cache.match(PUSH_PREFS_REQUEST_URL);
    if (!response) {
      return { partidasEnabled: true };
    }

    const data = await response.json();
    return {
      partidasEnabled: data?.partidasEnabled !== false
    };
  } catch (_) {
    return { partidasEnabled: true };
  }
}

async function salvarPreferenciasPush(preferencias = {}) {
  const cache = await caches.open(PUSH_PREFS_CACHE);
  const payload = {
    partidasEnabled: preferencias?.partidasEnabled !== false
  };

  await cache.put(
    PUSH_PREFS_REQUEST_URL,
    new Response(JSON.stringify(payload), {
      headers: { 'Content-Type': 'application/json' }
    })
  );

  return payload;
}

function ehNotificacaoPartida(payload = {}) {
  const tag = String(payload?.tag || '').trim();
  if (tag.startsWith(TAG_PREFIX_PARTIDA)) return true;
  return Number(payload?.data?.partidaId || 0) > 0;
}

async function fecharNotificacoesPorPrefixo(prefixo = '') {
  const prefixoNormalizado = String(prefixo || '').trim();
  if (!prefixoNormalizado) return;

  const notificacoes = await self.registration.getNotifications();
  notificacoes.forEach((notificacao) => {
    const tag = String(notificacao?.tag || '').trim();
    if (tag.startsWith(prefixoNormalizado)) {
      notificacao.close();
    }
  });
}

self.addEventListener('message', (event) => {
  const tipo = String(event?.data?.type || '').trim();
  if (tipo !== 'PUSH_PREFS_UPDATE') return;

  const preferencias = event?.data?.preferencias || {};
  event.waitUntil(
    salvarPreferenciasPush(preferencias).then((salvas) => {
      if (salvas?.partidasEnabled === false) {
        return fecharNotificacoesPorPrefixo(TAG_PREFIX_PARTIDA);
      }

      return null;
    })
  );
});

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

  event.waitUntil((async () => {
    const preferencias = await lerPreferenciasPush();

    if (ehNotificacaoPartida(payload) && preferencias?.partidasEnabled === false) {
      return;
    }

    const tag = String(payload?.tag || 'notificacao-geral');
    if (payload?.closeTagOnly) {
      const notificacoes = await self.registration.getNotifications({ tag });
      notificacoes.forEach((notificacao) => notificacao.close());
      return;
    }

    const closeTagPrefix = String(payload?.closeTagPrefix || '').trim();
    if (closeTagPrefix) {
      await fecharNotificacoesPorPrefixo(closeTagPrefix);
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

    await self.registration.showNotification(title, options);
  })());
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
