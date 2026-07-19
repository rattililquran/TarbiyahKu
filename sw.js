/* TarbiyahKu Service Worker — cache shell + font, network-first untuk API */
var CACHE = 'tarbiyahku-v1';
var SHELL = ['./', './index.html', './manifest.webmanifest'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { if (k !== CACHE) return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (e) {
  var url = e.request.url;
  /* API GAS: selalu network (frontend punya antrean offline sendiri) */
  if (url.indexOf('script.google.com') !== -1 || e.request.method !== 'GET') return;

  /* Font & thumbnail: cache-first */
  var cacheFirst = url.indexOf('fonts.g') !== -1 || url.indexOf('img.youtube.com') !== -1;

  e.respondWith(
    caches.match(e.request).then(function (hit) {
      if (hit && cacheFirst) return hit;
      var net = fetch(e.request).then(function (res) {
        if (res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')) {
          var clone = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, clone); });
        }
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    })
  );
});
