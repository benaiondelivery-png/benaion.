const CACHE_NAME = 'benaion-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/api.js',
  './js/auth.js',
  './js/utils.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
