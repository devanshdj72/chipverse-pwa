const CACHE_VERSION = 'v1';
const CACHE_NAME = `chipverse-${CACHE_VERSION}`;
const API_CACHE_NAME = `chipverse-api-${CACHE_VERSION}`;

// App shell — always cached
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// ─── INSTALL ────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ─── ACTIVATE ───────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== API_CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ─── FETCH ──────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, cross-origin (except fonts), and socket.io
  if (request.method !== 'GET') return;
  if (url.pathname.startsWith('/socket.io')) return;

  // API calls — Network first, no offline cache for fresh data
  if (url.pathname.startsWith('/api/') || url.hostname !== self.location.hostname) {
    // For Google Fonts — cache them
    if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
      event.respondWith(
        caches.open(CACHE_NAME).then(async (cache) => {
          const cached = await cache.match(request);
          if (cached) return cached;
          const response = await fetch(request);
          cache.put(request, response.clone());
          return response;
        })
      );
      return;
    }
    // Other API/external — network only
    return;
  }

  // App shell & static assets — Network first, cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(async () => {
        // Offline fallback
        const cached = await caches.match(request);
        if (cached) return cached;
        // For navigation requests, serve index.html (SPA fallback)
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('Offline', { status: 503 });
      })
  );
});

// ─── BACKGROUND SYNC ────────────────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'chipverse-sync') {
    event.waitUntil(syncPendingData());
  }
});

async function syncPendingData() {
  // Placeholder for future offline sync logic
  console.log('[ChipVerse SW] Background sync triggered');
}

// ─── PUSH NOTIFICATIONS ─────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title ?? 'ChipVerse';
  const options = {
    body: data.body ?? 'You have a new update!',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.tag ?? 'chipverse-notification',
    data: { url: data.url ?? '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url ?? '/')
  );
});
