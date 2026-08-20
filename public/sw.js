/**
 * Offline cache for /pitch (§11).
 *
 * Showroom wifi is unreliable and mobile data inside a concrete building is worse. We WILL be
 * presenting in those rooms, and a spinner mid-pitch is a lost deal. This worker is what lets
 * Omlan warm the whole deck at home on good wifi and then present with the network off.
 *
 * Scope is deliberately narrow: it is registered only by /pitch, it only ever caches
 * same-origin GETs, and it never caches an API response — a stale lead endpoint would be
 * worse than no endpoint.
 */

const CACHE = 'phoenix-pitch-v1';

/** Immutable build output and fonts: safe to serve from cache forever. */
const IMMUTABLE = [/^\/_next\/static\//, /\.(?:woff2?|ttf|otf)$/, /\.(?:glb|hdr|ktx2|mp3|ogg|m4a)$/];

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((name) => name !== CACHE).map((name) => caches.delete(name)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.type !== 'PRECACHE' || !Array.isArray(data.urls)) return;

  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);

      // One at a time and individually guarded: `cache.addAll` rejects the whole batch if a
      // single URL 404s, which on a partially-built deck would cache nothing at all.
      let cached = 0;
      for (const url of data.urls) {
        try {
          const response = await fetch(url, { credentials: 'same-origin' });
          if (response.ok) {
            await cache.put(url, response.clone());
            cached += 1;
          }
        } catch {
          // Ignore and keep going — the count reported back tells the operator the truth.
        }
      }

      const clients = await self.clients.matchAll();
      for (const client of clients) {
        client.postMessage({ type: 'PRECACHE_DONE', cached, total: data.urls.length });
      }
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  const immutable = IMMUTABLE.some((pattern) => pattern.test(url.pathname));

  if (immutable) {
    // Cache-first: these URLs are content-hashed, so a cached copy is always correct.
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
            return response;
          }),
      ),
    );
    return;
  }

  // Everything else — documents, RSC payloads — network-first, cache as a fallback. That way
  // a warm laptop still shows the latest build, and a dead network still shows the deck.
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request).then((hit) => hit ?? Response.error())),
  );
});
