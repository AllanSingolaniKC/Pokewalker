// ── VERSÃO DO CACHE — mude este número ao subir uma atualização ──
const CACHE_VERSION = "pokewalker-v3";

const ASSETS = [
  "./index.html",
  "./manifest.json",
  "./icone-192.png",
  "./icone-512.png",
  "https://unpkg.com/react@18/umd/react.production.min.js",
  "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js",
  "https://unpkg.com/@babel/standalone/babel.min.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Remove caches antigos — localStorage NÃO é afetado, saves seguros
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first para index.html, cache-first para o resto
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  const isIndex = url.pathname.endsWith("/") || url.pathname.endsWith("index.html");
  if (isIndex) {
    event.respondWith(
      fetch(event.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(event.request, clone));
        }
        return res;
      }).catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(res => {
          if (!res || res.status !== 200) return res;
          const clone = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(event.request, clone));
          return res;
        }).catch(() => caches.match("./index.html"));
      })
    );
  }
});
