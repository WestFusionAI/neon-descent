/* Minimal service worker: cache app shell for offline-ish play */
const CACHE = "neon-descent-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k === CACHE ? null : caches.delete(k))))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Only handle same-origin
  if (url.origin !== self.location.origin) return;

  const isAppShell =
    url.pathname.endsWith("/index.html") ||
    url.pathname.endsWith("/manifest.webmanifest") ||
    url.pathname.endsWith("/sw.js") ||
    url.pathname.endsWith("/icon.svg");

  event.respondWith(
    isAppShell
      ? fetch(req)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
            return res;
          })
          .catch(() => caches.match(req).then((cached) => cached || caches.match("./index.html")))
      : caches.match(req).then((cached) => {
          if (cached) return cached;
          return fetch(req)
            .then((res) => {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
              return res;
            })
            .catch(() => caches.match("./index.html"));
        })
  );
});

