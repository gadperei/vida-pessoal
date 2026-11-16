/// <reference lib="webworker" />
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

declare const self: ServiceWorkerGlobalScope;

// O "shell" do app (HTML, JS, CSS, ícones) fica guardado no aparelho: abre mesmo sem internet.
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')));

// "Atualizar" no aviso de versão nova: a versão que está esperando assume na hora.
self.addEventListener('message', (evento) => {
  if (evento.data?.type === 'SKIP_WAITING') void self.skipWaiting();
});

interface Carga { titulo: string; corpo: string; url: string }

// Notificação que chega do servidor (Edge Function enviar-notificacoes).
self.addEventListener('push', (evento) => {
  const carga: Carga = { titulo: 'Vida Pessoal', corpo: '', url: '/' };
  try {
    Object.assign(carga, evento.data?.json() as Partial<Carga>);
  } catch {
    carga.corpo = evento.data?.text() ?? '';
  }
  evento.waitUntil(self.registration.showNotification(carga.titulo, {
    body: carga.corpo,
    icon: '/pwa-192x192.png',
    data: { url: carga.url },
  }));
});

// Tocar na notificação: usa a janela do app que já está aberta ou abre uma nova.
self.addEventListener('notificationclick', (evento) => {
  evento.notification.close();
  const caminho = (evento.notification.data as { url?: string } | null)?.url ?? '/';
  const url = new URL(caminho, self.location.origin).href;
  evento.waitUntil((async () => {
    const janelas = await self.clients.matchAll({ type: 'window' });
    const janela = janelas.find((j) => new URL(j.url).origin === self.location.origin);
    if (janela) {
      await janela.focus();
      await janela.navigate(url);
      return;
    }
    await self.clients.openWindow(url);
  })());
});
