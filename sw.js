/* Oboeru service worker — cache-first, want de app verandert nooit tijdens gebruik.
   6f2a99d736 wordt bij het bouwen vervangen door een hash van index.html; een nieuwe
   versie krijgt dus een nieuwe cache en de oude wordt opgeruimd.                      */
const V = '6f2a99d736';
const CACHE = 'oboeru-' + V;
const BESTANDEN = ['./', './index.html', './manifest.webmanifest',
                   './icon-192.png', './icon-512.png', './icon-maskable.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BESTANDEN)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(k => Promise.all(k.filter(n => n !== CACHE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  // Een navigatie moet altijd de app opleveren, ook diep in de geschiedenis of offline.
  if (r.mode === 'navigate') {
    e.respondWith(caches.match('./index.html').then(c => c || fetch(r)));
    return;
  }
  e.respondWith(
    caches.match(r).then(c => c || fetch(r).then(resp => {
      if (resp.ok && new URL(r.url).origin === location.origin) {
        const kopie = resp.clone();
        caches.open(CACHE).then(cache => cache.put(r, kopie));
      }
      return resp;
    }).catch(() => c))
  );
});
