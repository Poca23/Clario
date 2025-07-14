const CACHE_NAME = 'clario-v1.0.3';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './assets/css/styles.css',
  './assets/css/components.css',
  './assets/css/animations.css',
  './assets/css/theme.css',
  './assets/js/app.js',
  './assets/js/modules/TaskManager.js',
  './assets/js/modules/UIManager.js',
  './assets/js/modules/theme.js',
  './assets/js/utils/helpers.js',
  './assets/js/keyboard.js',
  './assets/images/logo_Clario_removebg-preview.png',
  './assets/favicons/favicon-16x16.png',
  './assets/favicons/favicon-32x32.png',
  './assets/favicons/apple-touch-icon.png',
  './assets/favicons/favicon.png'
];

// Installation optimisée
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('🔄 Mise en cache...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Cache OK');
        self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Erreur cache:', error);
      })
  );
});

// Activation améliorée
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ SW activé');
      self.clients.claim();
    })
  );
});

// Stratégie cache-first
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
      .catch(() => {
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      })
  );
});
