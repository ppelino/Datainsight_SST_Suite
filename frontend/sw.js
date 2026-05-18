const CACHE_NAME = 'datainsight-sst-v1';

const urlsToCache = [
  '/',
  '/index.html',
  '/assets/style.css',
  '/assets/script.js',
  '/assets/datainsight.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});
