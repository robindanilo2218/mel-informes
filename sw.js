// Service Worker for PWA functionality

const CACHE_NAME = 'presupuesto-mto-v1';
const urlsToCache = [
    '/presupuesto-app/',
    '/presupuesto-app/index.html',
    '/presupuesto-app/css/styles.css',
    '/presupuesto-app/js/app.js',
    '/presupuesto-app/js/dataUtils.js',
    '/presupuesto-app/js/charts.js',
    '/presupuesto-app/js/views.js',
    '/presupuesto-app/assets/informe_salidas_bodega.csv',
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js',
    'https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js'
];

// Install event - cache resources
self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching app resources');
                return cache.addAll(urlsToCache.map(url => new Request(url, { cache: 'reload' })))
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

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }

                // Clone the request
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest).then(response => {
                    // Check if valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response
                    const responseToCache = response.clone();

                    // Cache the new resource
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });

                    return response;
                }).catch(error => {
                    console.error('Fetch failed:', error);
                    // Could return a custom offline page here
                    throw error;
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
