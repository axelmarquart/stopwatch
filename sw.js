// Service Worker: cached die statischen Dateien, damit die App auch offline startet.
// Alle Pfade sind relativ, damit das auch unter dem GitHub-Pages-Unterpfad
// (https://<user>.github.io/<repo>/) funktioniert.

// Version bei jeder Aenderung der gecachten Dateien erhoehen, damit alte
// Caches beim naechsten activate-Event aufgeraeumt werden.
const CACHE_NAME = 'stopwatch-static-v1';

const PRECACHE_URLS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  // Chart.js wird zusaetzlich zur woertlichen Spezifikation gecached, damit
  // das Diagramm auch offline funktioniert und nicht nur die restliche Seite.
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name.startsWith('stopwatch-static-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
});

// Cache-first: aus dem Cache bedienen, falls vorhanden, sonst per Netzwerk laden.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
