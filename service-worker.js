/* ------------------------------------------------------------------
   service-worker.js — fonctionnement hors ligne
   Stratégie : cache d'abord pour la coquille de l'application (elle ne
   change qu'aux déploiements), réseau d'abord pour rien du tout — les
   données vivent dans localStorage, jamais sur le réseau.
   Après toute modification des fichiers, incrémenter CACHE.
------------------------------------------------------------------- */
const CACHE = 'molow-v15';

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/tokens.css',
  './css/layout.css',
  './css/components.css',
  './fonts/archivo-var.woff2',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/favicon.png',
  './js/data/catalog.js',
  './js/data/restaurant-foods.js',
  './js/data/personal-foods.js',
  './js/data/snacks.js',
  './js/core/utils.js',
  './js/core/store.js',
  './js/core/theme.js',
  './js/ui/shell.js',
  './js/screens/home.js',
  './js/screens/add.js',
  './vendor/zxing-browser.min.js',
  './js/screens/photo.js',
  './js/screens/macros.js',
  './js/screens/journal.js',
  './js/screens/profile.js',
  './js/app.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

/* Purge des anciens caches au changement de version. */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;

  e.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req)
        .then(res => {
          /* On met en cache au passage : utile si un fichier a été
             ajouté après l'installation du service worker.        */
          if (res && res.ok){
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
