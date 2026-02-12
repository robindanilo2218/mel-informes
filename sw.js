// Service Worker for PWA functionality

const CACHE_NAME = 'presupuesto-mto-v2';
const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    './css/styles.css',
    './js/app.js',
    './js/dataUtils.js',
    './js/charts.js',
    './js/views.js',
    './assets/informe_salidas_bodega.csv',
    // External CDN resources (will be cached on first load)
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.0/papaparse.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

// Install event - cache resources
self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching app resources');
                return cache.addAll(urlsToCache)
                    .catch(err => {
                        console.error('Error caching resources:', err);
                        // Continue even if some resources fail to cache
                        return Promise.resolve();
                    });
            })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network (Offline First Strategy)
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    console.log('Serving from cache:', event.request.url);
                    return response;
                }

                // Clone the request
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest).then(response => {
                    // Check if we received a valid response
                    if (!response || response.status !== 200) {
                        return response;
                    }

                    // For same-origin or CORS-enabled responses, cache them
                    // Allow both 'basic' (same-origin) and 'cors' (cross-origin with CORS headers)
                    if (response.type === 'basic' || response.type === 'cors') {
                        // Clone the response
                        const responseToCache = response.clone();

                        // Cache the new resource
                        caches.open(CACHE_NAME).then(cache => {
                            console.log('Caching new resource:', event.request.url);
                            cache.put(event.request, responseToCache);
                        });
                    }

                    return response;
                }).catch(error => {
                    console.error('Fetch failed for:', event.request.url, error);
                    // Return a meaningful offline response if available
                    return caches.match('./index.html').then(cachedResponse => {
                        if (cachedResponse && event.request.mode === 'navigate') {
                            return cachedResponse;
                        }
                        throw error;
                    });
                });
            })
    );
});

// Handle messages from the main app
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
