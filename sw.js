const CACHE = 'hcm-proj-v6';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './logo.jpg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  /* Never cache the shared database or its file storage */
  if (e.request.method !== 'GET' || e.request.url.includes('supabase.co')) return;
  /* Network-first for the app page and Google Fonts — always get latest, fall back offline */
  if (
    e.request.mode === 'navigate' ||
    e.request.url.includes('fonts.g') ||
    e.request.url.includes('index.html')
  ) {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
    );
    return;
  }
  /* Cache-first for icons, logo and manifest */
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    }))
  );
});
