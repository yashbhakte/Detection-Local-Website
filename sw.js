/* ═══════════════════════════════════════════════════════════════════
   NeuAI FabricGuard — Service Worker
   sw.js — Offline-first caching strategy
   ═══════════════════════════════════════════════════════════════════ */

const CACHE_NAME = 'fabricguard-v7';
const STATIC_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
];

/* Install: pre-cache static shell */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

/* Activate: clear old caches */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* Fetch: cache-first for static, network-first for API calls */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  /* Skip non-GET, chrome-extension, and cross-origin API calls */
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin && !url.hostname.endsWith('fonts.googleapis.com') && !url.hostname.endsWith('fonts.gstatic.com')) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request).then((response) => {
        /* Cache fresh copy of same-origin static assets */
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
      return cached || networkFetch;
    })
  );
});
