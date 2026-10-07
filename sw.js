/* Service worker — Painel de Produção.
   PARA PUBLICAR UMA ACTUALIZAÇÃO: altere o ficheiro (index.html, etc.) e suba VERSION (painel-v2, v3…).
   Os utilizadores recebem um aviso e escolhem quando instalar. */
const VERSION = 'painel-v1';
const CORE = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION)
      .then(c => c.addAll(CORE.map(u => new Request(u, { cache: 'reload' }))))
      // primeira instalação: activa logo. Actualização: fica à espera até o utilizador aceitar.
      .then(() => { if (!self.registration.active) return self.skipWaiting(); })
  );
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
  if (e.data === 'GET_VERSION' && e.source) e.source.postMessage({ version: VERSION });
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // tudo da cache desta versão (assim a app fica coerente até a actualização ser aceite)
  e.respondWith(
    caches.open(VERSION).then(c => c.match(req, { ignoreSearch: true }).then(hit => {
      if (hit) return hit;
      if (req.mode === 'navigate') return c.match('./index.html');
      return fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; });
    }))
  );
});
