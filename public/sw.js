// This origin also serves Drupal. The worker only exists so the site can
// be installed. It does not cache: a stored session or ficha would be
// private and quickly stale.
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', () => {})
