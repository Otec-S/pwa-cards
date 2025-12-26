/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'pwa-cards-v2';
const urlsToCache: string[] = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/cards.json',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

/**
 * Установка service worker и кэширование статических файлов
 */
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache: Cache) => {
        console.log('Кэширование файлов');
        return cache.addAll(
          urlsToCache.map(url => new Request(url, { cache: 'reload' }))
        );
      })
      .catch((error: Error) => {
        console.error('Ошибка при кэшировании:', error);
      })
  );
  self.skipWaiting();
});

/**
 * Активация service worker и удаление старых кэшей
 */
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((cacheNames: string[]) => {
      return Promise.all(
        cacheNames.map((cacheName: string) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Удаление старого кэша:', cacheName);
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        })
      );
    })
  );
  self.clients.claim();
});

/**
 * Стратегия cache-first для всех запросов
 */
self.addEventListener('fetch', (event: FetchEvent) => {
  event.respondWith(
    caches.match(event.request)
      .then((response: Response | undefined) => {
        if (response) {
          return response;
        }

        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response: Response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache: Cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          return caches.match('/index.html').then((response) => {
            return response || new Response('Offline');
          });
        });
      })
  );
});

export {};
