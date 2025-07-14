const CACHE_NAME = 'clario-v1.0.2';
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
  console.log('🔄 Service Worker installation...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Mise en cache des ressources...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Installation terminée');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Erreur installation:', error);
      })
  );
});

// Activation optimisée
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activation...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Suppression cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Activation terminée');
        return self.clients.claim();
      })
  );
});

// Stratégie de cache optimisée
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        return fetch(event.request).catch(() => {
          // Fallback pour les pages HTML
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
