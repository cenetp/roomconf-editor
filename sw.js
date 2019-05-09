var cacheName = 'graphui-cache';
var filesToCache = [
  'index.html',
  'js/babel.min.js',
  'js/vis.min.js',
  'js/config.js',
  //'js/app.js',
  'css/w3.css',
  'css/w3-theme-dark-grey.css',
  'css/vis-network.min.css',
  //'css/style.css',
  'manifest.json'
];
this.addEventListener('install', function(e) {
  console.log('SW: Installing...');
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      console.log('SW: Caching app shell...');
      return cache.addAll(filesToCache);
    })
  );
});
this.addEventListener('activate', function(e) {
  console.log('SW: Activating...');
  e.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (key !== cacheName) {
          console.log('SW: Removing old cache...', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return this.clients.claim();
});
this.addEventListener('fetch', function(e) {
  console.log('SW: Fetching... ', e.request.url);
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request);
    })
  );
});
