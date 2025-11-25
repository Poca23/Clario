/**
 * 🔧 SERVICE WORKER
 *
 * WHO: Gestion cache et fonctionnement offline
 * WHAT: Cache des assets + stratégies réseau
 * WHY: Performance + mode offline
 * HOW: Cache API + Fetch interceptor
 */

const CACHE_NAME = "clario-v1.0.0";
const STATIC_CACHE = "clario-static-v1";
const DYNAMIC_CACHE = "clario-dynamic-v1";

// Assets à mettre en cache immédiatement
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/src/styles/theme.css",
  "/src/styles/components.css",
  "/src/styles/LoginForm.css",
  "/src/styles/TaskCard.css",
  "/src/styles/TasksForm.css",
  "/src/styles/FilterBar.css",
  "/src/styles/InstallButton.css",
  "/src/styles/Toast.css",
  "/src/styles/ProgressBar.css",
  "/src/app.js",
  "/src/config/firebase.js",
  "/src/config/constants.js",
  "/src/services/auth.service.js",
  "/src/services/storage.service.js",
  "/src/services/sync.service.js",
  "/src/services/offline.service.js",
  "/src/components/LoginForm.js",
  "/src/components/TaskCard.js",
  "/src/components/TaskForm.js",
  "/src/components/FilterBar.js",
  "/src/components/InstallButton.js",
  "/src/components/ProgressBar.js",
  "/src/components/Toast.js",
  "/src/utils/date.utils.js",
  "/src/utils/validation.utils.js",
  "/public/icons/android-chrome-192x192.png",
  "/public/icons/android-chrome-512x512.png",
  "/public/logo_Clario_removebg-preview.png",
];

// Limites du cache dynamique
const DYNAMIC_CACHE_LIMIT = 50;

/**
 * Helper: Nettoyer le cache dynamique
 * @param {string} cacheName - Nom du cache
 * @param {number} maxItems - Nombre max d'items
 */
const limitCacheSize = async (cacheName, maxItems) => {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    limitCacheSize(cacheName, maxItems);
  }
};

// ==========================================
// INSTALLATION
// ==========================================
self.addEventListener("install", (event) => {
  console.log("[SW] Installation...");

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("[SW] Mise en cache des assets statiques");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// ==========================================
// ACTIVATION
// ==========================================
self.addEventListener("activate", (event) => {
  console.log("[SW] Activation...");

  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
            .map((key) => {
              console.log("[SW] Suppression ancien cache:", key);
              return caches.delete(key);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// ==========================================
// FETCH - STRATÉGIE NETWORK FIRST
// ==========================================
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Ignorer les requêtes non-GET
  if (request.method !== "GET") return;

  // Ignorer Firebase et API externes
  if (
    request.url.includes("firestore.googleapis.com") ||
    request.url.includes("identitytoolkit.googleapis.com")
  ) {
    return;
  }

  event.respondWith(
    // Stratégie: Network First, fallback Cache
    fetch(request)
      .then(async (response) => {
        // Cloner la réponse car elle ne peut être lue qu'une fois
        const responseClone = response.clone();

        // Mettre en cache la nouvelle réponse
        const cache = await caches.open(DYNAMIC_CACHE);
        await cache.put(request, responseClone);

        // Limiter la taille du cache
        limitCacheSize(DYNAMIC_CACHE, DYNAMIC_CACHE_LIMIT);

        return response;
      })
      .catch(async () => {
        // En cas d'échec réseau, chercher dans le cache
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
          console.log("[SW] Réponse depuis le cache:", request.url);
          return cachedResponse;
        }

        // Si pas en cache et URL HTML, retourner page offline
        if (request.headers.get("accept").includes("text/html")) {
          return caches.match("/");
        }

        // Sinon retourner erreur
        return new Response("Ressource non disponible hors ligne", {
          status: 503,
          statusText: "Service Unavailable",
        });
      })
  );
});

// ==========================================
// MESSAGES (communication avec l'app)
// ==========================================
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.keys().then((keys) => {
        return Promise.all(keys.map((key) => caches.delete(key)));
      })
    );
  }
});

// ==========================================
// SYNC (Background Sync API)
// ==========================================
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync:", event.tag);

  if (event.tag === "sync-tasks") {
    event.waitUntil(
      // Notifier l'app pour synchroniser
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: "BACKGROUND_SYNC",
            timestamp: Date.now(),
          });
        });
      })
    );
  }
});

// ==========================================
// NOTIFICATIONS PUSH (optionnel)
// ==========================================
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};

  const options = {
    body: data.body || "Nouvelle notification Clario",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    vibrate: [200, 100, 200],
    data: {
      url: data.url || "/",
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Clario", options)
  );
});

// ==========================================
// CLICK NOTIFICATION
// ==========================================
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(self.clients.openWindow(event.notification.data.url));
});
