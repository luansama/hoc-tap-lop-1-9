const CACHE_NAME = 'hoc-tap-lop-1-9-v2';
const CORE_ASSETS = [
  './', './index.html', './manifest.json',
  './assets/css/base.css', './assets/css/layout.css', './assets/css/components.css', './assets/css/themes.css',
  './assets/js/knowledge.js', './assets/js/app.js', './assets/js/navigation.js', './assets/js/quiz.js',
  './assets/js/flashcards.js', './assets/js/progress.js', './assets/js/planner.js', './assets/js/storage.js', './assets/js/question-audit.js',
  './assets/images/icon-192.png', './assets/images/icon-512.png',
  './data/curriculum.json', './data/lessons.json',
  './data/questions/grade-1.json', './data/questions/grade-2.json', './data/questions/grade-3.json',
  './data/questions/grade-4.json', './data/questions/grade-5.json', './data/questions/grade-6.json',
  './data/questions/grade-7.json', './data/questions/grade-8.json', './data/questions/grade-9.json'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy));
      return response;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response && response.ok) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
    }
    return response;
  })));
});
