/// <reference lib="webworker" />
const CACHE_NAME = 'pwa-cards-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/sw.js',
    '/cards.json',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];
/**
 * Установка service worker и кэширование статических файлов
 */
self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE_NAME)
        .then((cache) => {
        console.log('Кэширование файлов');
        return cache.addAll(urlsToCache.map(url => new Request(url, { cache: 'reload' })));
    })
        .catch((error) => {
        console.error('Ошибка при кэшировании:', error);
    }));
    self.skipWaiting();
});
/**
 * Активация service worker и удаление старых кэшей
 */
self.addEventListener('activate', (event) => {
    event.waitUntil(caches.keys().then((cacheNames) => {
        return Promise.all(cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
                console.log('Удаление старого кэша:', cacheName);
                return caches.delete(cacheName);
            }
            return Promise.resolve();
        }));
    }));
    self.clients.claim();
});
/**
 * Стратегия cache-first для всех запросов
 */
self.addEventListener('fetch', (event) => {
    event.respondWith(caches.match(event.request)
        .then((response) => {
        if (response) {
            return response;
        }
        const fetchRequest = event.request.clone();
        return fetch(fetchRequest).then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
                .then((cache) => {
                cache.put(event.request, responseToCache);
            });
            return response;
        }).catch(() => {
            return caches.match('/index.html').then((response) => {
                return response || new Response('Offline');
            });
        });
    }));
});
export {};
