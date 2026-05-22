/**
 * Qyntra service worker.
 *
 * Strategy:
 *  - Cache static assets aggressively (cache-first).
 *  - Cache wiki + read + map-3d page shells (stale-while-revalidate) so users
 *    can re-open recently-viewed wiki pages while offline.
 *  - Never cache /api/* — always live.
 *  - Skip POSTs and non-http(s) requests.
 *
 * Versioning: bump CACHE_VERSION when shipping a breaking shell change.
 */

const CACHE_VERSION = "qyntra-v3";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const PAGE_CACHE = `${CACHE_VERSION}-pages`;

const STATIC_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/icon.png",
  "/apple-icon.png",
  "/logo.png",
  "/logo.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((c) => c.addAll(STATIC_ASSETS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => !k.startsWith(CACHE_VERSION)).map((k) => caches.delete(k)),
      ),
    ).then(() => self.clients.claim()),
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.match(/\.(?:png|jpg|jpeg|svg|webp|gif|ico|woff2?|ttf)$/i)
  );
}

function isCacheablePage(url) {
  if (url.pathname.startsWith("/api/")) return false;
  if (url.pathname.startsWith("/_next/data/")) return false;
  return url.pathname === "/" ||
    url.pathname.startsWith("/wiki") ||
    url.pathname.startsWith("/read") ||
    url.pathname.startsWith("/map") ||
    url.pathname.startsWith("/home") ||
    url.pathname === "/demo";
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(req).then((hit) => {
        if (hit) return hit;
        return fetch(req).then((res) => {
          if (res.ok) caches.open(STATIC_CACHE).then((c) => c.put(req, res.clone()));
          return res;
        });
      }),
    );
    return;
  }

  if (isCacheablePage(url) && req.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(PAGE_CACHE);
        const cached = await cache.match(req);
        const network = fetch(req)
          .then((res) => {
            if (res.ok) cache.put(req, res.clone()).catch(() => {});
            return res;
          })
          .catch(() => cached || caches.match("/"));
        return cached || network;
      })(),
    );
  }
});
