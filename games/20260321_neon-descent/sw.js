/* Minimal service worker: cache app shell for offline-ish play */
const CACHE = "neon-descent-v3";
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
    )
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: "window", includeUncontrolled: true }))
      .then((clients) => {
        clients.forEach((c) => {
          try {
            c.postMessage({ type: "RELOAD" });
          } catch (_) {}
        });
      })
  );
});

self.addEventListener("message", (event) => {
  if (!event.data) return;
  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Only handle same-origin
  if (url.origin !== self.location.origin) return;

  // GitHub Pages project URL is /repo/ or /repo — those requests must not be served
  // from a stale cache entry that matched without query string (first paint / ?from=card).
  const swPath = new URL(self.location.href).pathname;
  const basePath = swPath.replace(/\/sw\.js$/i, "");
  const p = url.pathname;
  const isMainHtml =
    p.endsWith("/index.html") ||
    (basePath &&
      (p === basePath || p === basePath + "/" || p === basePath + "/index.html"));

  const isAppShell =
    isMainHtml ||
    p.endsWith("/manifest.webmanifest") ||
    p.endsWith("/sw.js") ||
    p.endsWith("/icon.svg");

  event.respondWith(
    isAppShell
      ? fetch(req, { cache: "no-store" })
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

