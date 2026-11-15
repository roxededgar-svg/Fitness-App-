/* Vitalis Service Worker: App offline nutzbar machen.
 * - Modell + KI-Laufzeit (groß, ändern sich selten): cache-first
 * - App-Dateien (assets/ mit Hash im Namen): cache-first
 * - Seite selbst: network-first, offline aus dem Cache
 */
const VERSION = 'vitalis-v1';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon.svg', './apple-touch-icon.png', './icon-192.png'];
const HEAVY = ['./models/pose_landmarker_lite.task', './mediapipe/wasm/vision_wasm_internal.js', './mediapipe/wasm/vision_wasm_internal.wasm'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION).then(async (c) => {
      await c.addAll(CORE);
      // große Dateien im Hintergrund, Fehler blockieren die Installation nicht
      await Promise.allSettled(HEAVY.map((u) => c.add(u)));
    }).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const heavy = /\/(models|mediapipe)\//.test(url.pathname) || url.hostname.includes('mediapipe') || url.hostname === 'cdn.jsdelivr.net';
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then((r) => { const copy = r.clone(); caches.open(VERSION).then((c) => c.put('./index.html', copy)); return r; })
        .catch(() => caches.match('./index.html')),
    );
    return;
  }
  if (heavy || (sameOrigin && /\/assets\//.test(url.pathname)) || (sameOrigin && /\.(png|svg|webmanifest)$/.test(url.pathname)) || url.hostname.endsWith('fonts.gstatic.com') || url.hostname.endsWith('fonts.googleapis.com')) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((r) => {
        if (r.ok || r.type === 'opaque') { const copy = r.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
        return r;
      })),
    );
  }
});
