/* Nachtwache mit Tanja – Service Worker (offline). Bei Änderungen Versionsnummer erhöhen. */
var CACHE = 'nachtwache-tanja-v1';
var DATEIEN = [
  './', './index.html', './styles.css', './inhalte.js', './aufmunterungen.js', './app.js',
  './manifest.webmanifest', './icons/icon.svg', './icons/icon-180.png', './icons/icon-192.png',
  './icons/icon-512.png', './icons/icon-maskable-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(DATEIEN.map(function (u) { return c.add(new Request(u, { cache: 'reload' })).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (namen) {
    return Promise.all(namen.map(function (n) { if (n !== CACHE && n.indexOf('nachtwache-tanja-') === 0) return caches.delete(n); }));
  }).then(function () { return self.clients.claim(); }));
});

// Sofort aus dem Speicher antworten (schnell, auch im Funkloch) und im Hintergrund
// die neue Fassung holen – geänderte Texte erscheinen dann beim nächsten Öffnen.
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  var auffrischen = fetch(req).then(function (antwort) {
    if (antwort && antwort.ok) {
      var k = antwort.clone();
      return caches.open(CACHE).then(function (c) { return c.put(req, k); }).then(function () { return antwort; });
    }
    return antwort;
  });
  e.waitUntil(auffrischen.catch(function () {}));
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(function (gespeichert) {
    if (gespeichert) return gespeichert;
    return auffrischen.catch(function () {
      return req.mode === 'navigate' ? caches.match('./index.html') : new Response('', { status: 504 });
    });
  }));
});
