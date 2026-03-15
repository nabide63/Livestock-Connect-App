/**
 * Livestock Connect - Service Worker
 * Network-first for HTML and app scripts so first load is always fresh; cache for offline fallback.
 */
const CACHE_NAME = 'livestock-connect-v2';
const BASE = (self.location.pathname.replace(/sw\.js.*$/, '') || '/').replace(/\/?$/, '/');

function isNetworkFirstRequest(request) {
  const url = request.url;
  if (request.mode === 'navigate') return true;
  if (/\.html(\?|$)/i.test(url)) return true;
  if (/\/js\/(app|auth|livestock|cloudinary)\.js(\?|$)/i.test(url)) return true;
  if (/\/data\/(seed|mock-data)\.js(\?|$)/i.test(url)) return true;
  return false;
}

function networkFirst(request) {
  return fetch(request)
    .then(function (res) {
      if (res.status === 200 && res.type === 'basic') {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(request, clone);
        });
      }
      return res;
    })
    .catch(function () {
      return caches.match(request).then(function (cached) {
        return cached || new Response('Offline', { status: 503, statusText: 'Offline' });
      });
    });
}

function cacheFirst(request) {
  return caches.match(request).then(function (cached) {
    if (cached) return cached;
    return fetch(request).then(function (res) {
      if (res.status === 200 && res.type === 'basic') {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(request, clone);
        });
      }
      return res;
    });
  });
}

self.addEventListener('install', function (event) {
  self.skipWaiting();
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
  if (isNetworkFirstRequest(event.request)) {
    event.respondWith(networkFirst(event.request));
    return;
  }
  event.respondWith(cacheFirst(event.request));
});
