/**
 * service-worker.js — Cache-first service worker for Notenschlüsselrechner.
 *
 * NOTE: This file must live at the project root, not in src/js/.
 * A service worker's scope is limited to its own directory and below,
 * so placing it anywhere other than root would prevent it from
 * controlling requests for index.html and other root-level resources.
 *
 * Strategy: cache-first with network fallback.
 * All app shell files are pre-cached on install.
 * Cache is versioned — bumping CACHE_NAME triggers re-caching on next visit.
 */

const CACHE_NAME = "notenschluessel-v3";

const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.json",
  "/src/js/app.js",
  "/src/js/grading.js",
  "/src/js/storage.js",
  "/src/css/style.css",
  "/assets/icons/apple-touch-icon.png",
  "/assets/icons/icon-192.png",
  "/assets/icons/icon-512.png",
];

// ---------------------------------------------------------------------------
// Install — pre-cache all app shell files
// ---------------------------------------------------------------------------

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

// ---------------------------------------------------------------------------
// Activate — delete old caches
// ---------------------------------------------------------------------------

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// ---------------------------------------------------------------------------
// Fetch — cache-first, fall back to network
// ---------------------------------------------------------------------------

self.addEventListener("fetch", (event) => {
  // Only handle GET requests for same-origin resources
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Cache successful responses for same-origin requests
        if (
          response.ok &&
          new URL(event.request.url).origin === self.location.origin
        ) {
          const clone = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    }),
  );
});
