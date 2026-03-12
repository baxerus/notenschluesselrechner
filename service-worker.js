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

const CACHE_NAME = "notenschluessel-v7";

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
  // iOS splash screens
  "/assets/splash/splash-iphone-se-gen1.png",
  "/assets/splash/splash-iphone-se-gen2.png",
  "/assets/splash/splash-iphone-8-plus.png",
  "/assets/splash/splash-iphone-x-xs-11pro.png",
  "/assets/splash/splash-iphone-xs-max-11pro-max.png",
  "/assets/splash/splash-iphone-xr-11.png",
  "/assets/splash/splash-iphone-12-mini-13-mini.png",
  "/assets/splash/splash-iphone-12-13-14-16e.png",
  "/assets/splash/splash-iphone-12-pro-max-13-pro-max-14-plus.png",
  "/assets/splash/splash-iphone-14-pro-15-16.png",
  "/assets/splash/splash-iphone-14-pro-max-15-plus-16-plus.png",
  "/assets/splash/splash-iphone-16-pro-max.png",
  "/assets/splash/splash-ipad-9-7.png",
  "/assets/splash/splash-ipad-10-5-air3-pro10-5.png",
  "/assets/splash/splash-ipad-mini-6-7.png",
  "/assets/splash/splash-ipad-pro-11-gen1-2-3-4.png",
  "/assets/splash/splash-ipad-10-gen10-air4-5.png",
  "/assets/splash/splash-ipad-pro-12-9.png",
  "/assets/splash/splash-ipad-pro-13.png",
  "/assets/splash/splash-ipad-pro-11-gen6.png",
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
