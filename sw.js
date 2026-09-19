/* MyKajian service worker: simpan apps dan pustaka untuk kegunaan luar talian */
const CACHE = 'mykajian-v2.1.2';
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-512-maskable.png', './vis-timeline.min.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(CORE.map(u => c.add(u)))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // Firestore dan Gemini: sentiasa rangkaian (Firestore ada cache sendiri)
  if (/googleapis\.com|firebaseio|firebaseapp|identitytoolkit|securetoken/.test(url.host) && !/fonts\.googleapis/.test(url.host)) return;
  // Pustaka dan fon: cache dahulu, kemudian rangkaian
  if (/gstatic\.com|cdnjs\.cloudflare\.com|fonts\.googleapis\.com/.test(url.host)) {
    e.respondWith(caches.open(CACHE).then(async c => { const hit = await c.match(e.request); if (hit) return hit; try { const r = await fetch(e.request); if (r.ok) c.put(e.request, r.clone()); return r; } catch (err) { return hit || Response.error(); } }));
    return;
  }
  // Apps sendiri: rangkaian dahulu supaya kemas kini diterima, cache sebagai sandaran
  if (url.origin === location.origin) {
    e.respondWith((async () => { const c = await caches.open(CACHE); try { const r = await fetch(e.request); if (r.ok) c.put(e.request, r.clone()); return r; } catch (err) { return (await c.match(e.request)) || (await c.match('./index.html')); } })());
  }
});
self.addEventListener('notificationclick', e => { e.notification.close(); e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => { const c = cs.find(x => 'focus' in x); if (c) return c.focus(); return self.clients.openWindow('./index.html'); })); });
