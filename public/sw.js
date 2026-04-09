const CACHE_NAME = 'bakewise-v3'; // Bump version
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/robots.txt'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Strictly skip dev server/HMR/Vite requests from caching
  if (
    url.hostname === 'localhost' || 
    url.hostname === '127.0.0.1' ||
    url.pathname.includes('@vite') ||
    url.pathname.includes('node_modules') ||
    url.search.includes('v=') ||
    url.search.includes('token=')
  ) {
    return;
  }

  // Strictly skip supabase/API calls from caching
  if (url.hostname.includes('supabase.co')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((response) => {
        // Return valid response but don't cache if it's not successful
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch((err) => {
        // Handle navigation fallback
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
        // Instead of letting it throw, return a dummy response or re-throw properly
        throw err;
      });
    })
  );
});
