/* SKP offline layer. Pages load from the network first and fall back to the saved copy; images, fonts, styles and scripts are served from the saved copy and refreshed in the background. */
const VERSION = 'skp-v202611131655';
const CORE = ["index.html", "style.css", "app.js", "smart.js", "assist.js", "i18n.js", "commerce.js", "player.js", "data/catalog.js", "data/search-index.js", "vendor/qrcode.js", "assets/fonts/season.woff2", "assets/fonts/condensed.woff2", "assets/fonts/condensed-bold.woff2", "assets/skp-mark.png", "shop/index.html", "cart/index.html", "portal/index.html", "trace/index.html"];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => Promise.allSettled(CORE.map(u => c.add(u)))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== 'GET' || u.origin !== location.origin) return;
  const page = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
  if (page) {
    e.respondWith(fetch(req).then(res => { if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return res; }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => {
    const fresh = fetch(req).then(res => { if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return res; }).catch(() => hit);
    return hit || fresh;
  }));
});
