/**
 * Livestock Connect - Simple Service Worker
 * Caches static assets for offline use. Lightweight for slow connections.
 */
const CACHE_NAME = 'livestock-connect-v1';
const BASE = (self.location.pathname.replace(/sw\.js.*$/, '') || '/').replace(/\/?$/, '/');
const STATIC_URLS = [
  BASE + 'index.html',
  BASE + 'login.html',
  BASE + 'register.html',
  BASE + 'dashboard.html',
  BASE + 'livestock.html',
  BASE + 'add-livestock.html',
  BASE + 'prices.html',
  BASE + 'health.html',
  BASE + 'reports.html',
  BASE + 'profile.html',
  BASE + 'css/styles.css',
  BASE + 'js/app.js',
  BASE + 'data/mock-data.js'
];

self.addEventListener('install', function (event) {
  const origin = self.location.origin;
  const urls = STATIC_URLS.map(function (u) {
    return u.startsWith('http') ? u : origin + (u.startsWith('/') ? u : '/' + u);
  });
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(urls).catch(function () {});
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) {
        return k !== CACHE_NAME;
      }).map(function (k) {
        return caches.delete(k);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request).then(function (res) {
        const clone = res.clone();
        if (res.status === 200 && res.type === 'basic') {
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, clone);
          });
        }
        return res;
      }).catch(function () {
        var fallbackUrl = self.location.origin + BASE + 'index.html';
          return caches.match(fallbackUrl).then(function (c) {
            return c || new Response('Offline', { status: 503, statusText: 'Offline' });
          });
      });
    })
  );
});
