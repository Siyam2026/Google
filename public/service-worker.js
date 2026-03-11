const CACHE_NAME = 'hacker-messenger-v1';
const ASSETS = [
  '/',
  '/home.html',
  '/login.html',
  '/register.html',
  '/chat.html',
  '/css/style.css',
  '/js/app.js',
  '/js/login.js',
  '/js/register.js',
  '/js/chat.js',
  'https://cdnjs.cloudflare.com/ajax/libs/simple-peer/9.11.1/simplepeer.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
