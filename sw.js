const VERSION = 'v2.4';

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("pwa-cache").then(cache => {
      return cache.addAll(["/ffcts/index.html", "/ffcts/particles.js"]);
    })
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});
