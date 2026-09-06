// عقارلي — Service Worker خفيف (يجعل التطبيق قابلًا للتثبيت + تخزين مؤقت للأصول)
const CACHE = 'aqarly-v1';
const ASSETS = ['/dashboard', '/icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// شبكة أولًا لطلبات التنقّل، مع رجوع للكاش عند انقطاع الشبكة
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('/dashboard')));
  }
});
