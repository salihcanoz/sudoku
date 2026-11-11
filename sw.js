'use strict';
// Bump the version whenever the application shell changes.
const CACHE_PREFIX = `sudoku-${self.registration.scope}-`;
const CACHE_NAME = `${CACHE_PREFIX}v3`;
const APP_FILES = [
  './', './index.html', './style.css', './languages.js', './script.js',
  './pwa.js', './manifest.webmanifest', './icons/icon-192.png',
  './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(async cache => {
    // Reload avoids filling a new offline cache with stale HTTP-cache files.
    await cache.addAll(APP_FILES.map(path => new Request(new URL(path, self.registration.scope), { cache: 'reload' })));
    await self.skipWaiting();
  }));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Keep each installed shell consistent until the next worker activates.
    const shellURL = new URL(request.url);
    shellURL.search = '';
    const cached = await cache.match(shellURL.href);
    if (cached) return cached;
    try {
      return await fetch(request);
    } catch (error) {
      if (request.mode === 'navigate') return await cache.match('./index.html');
      throw error;
    }
  })());
});
