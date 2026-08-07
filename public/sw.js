// Minimal service worker — no offline caching, just enough of a fetch
// handler for Chrome/Android to treat the app as installable.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Network passthrough — no caching strategy yet.
});
