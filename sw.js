const CACHE_NAME = 'clario-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/css/styles.css',
  '/assets/css/components.css',
  '/assets/css/animations.css',
  '/assets/css/theme.css',
  '/assets/js/app.js',
  '/assets/js/modules/TaskManager.js',
  '/assets/js/modules/UIManager.js',
  '/assets/js/modules/theme.js',
  '/assets/js/utils/helpers.js',
  '/assets/js/keyboard.js',
  '/assets/images/logo_Clario_removebg-preview.png',
  '/assets/favicons/favicon-32x32.png',
  '/assets/favicons/favicon-16x16.png',
  '/assets/favicons/apple-touch-icon.png'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('🔄 Mise en cache des ressources...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Toutes les ressources sont en cache');
        self.skipWaiting();
      })
  );
});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activé');
      self.clients.claim();
    })
  );
});

// Stratégie Cache First avec fallback réseau
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Si trouvé en cache, le retourner
        if (response) {
          return response;
        }
        
        // Sinon, essayer le réseau
        return fetch(event.request)
          .then((response) => {
            // Vérifier si c'est une réponse valide
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Cloner la réponse pour la mettre en cache
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // En cas d'erreur réseau, retourner page offline si disponible
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
      })
  );
});
