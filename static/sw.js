// Service Worker for Advanced Notes App
const CACHE_NAME = 'notes-app-v1.0.0';
const STATIC_CACHE_NAME = 'notes-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'notes-dynamic-v1.0.0';

// Assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/manifest.json',
    '/favicon.ico',
    '/android-chrome-192x192.png',
    '/android-chrome-512x512.png',
    '/apple-touch-icon.png',
    '/favicon-16x16.png',
    '/favicon-32x32.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');

    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('Service Worker: Installed successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Installation failed', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (
                            cacheName !== STATIC_CACHE_NAME &&
                            cacheName !== DYNAMIC_CACHE_NAME &&
                            cacheName !== CACHE_NAME
                        ) {
                            console.log('Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activated successfully');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip external requests
    if (url.origin !== location.origin) {
        return;
    }

    // Handle different types of requests
    if (url.pathname.startsWith('/_app/')) {
        // App assets - cache first
        event.respondWith(cacheFirst(request));
    } else if (url.pathname === '/' || url.pathname.startsWith('/notes')) {
        // App pages - network first with cache fallback
        event.respondWith(networkFirst(request));
    } else if (STATIC_ASSETS.includes(url.pathname)) {
        // Static assets - cache first
        event.respondWith(cacheFirst(request));
    } else {
        // Everything else - network first
        event.respondWith(networkFirst(request));
    }
});

// Cache-first strategy
async function cacheFirst(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        const networkResponse = await fetch(request);

        // Cache successful responses
        if (networkResponse.status === 200) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.error('Cache-first strategy failed:', error);

        // Return offline fallback for navigation requests
        if (request.mode === 'navigate') {
            return caches.match('/');
        }

        throw error;
    }
}

// Network-first strategy
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);

        // Cache successful responses
        if (networkResponse.status === 200) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.log('Network failed, trying cache:', request.url);

        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // Return offline fallback for navigation requests
        if (request.mode === 'navigate') {
            const offlinePage = await caches.match('/');
            if (offlinePage) {
                return offlinePage;
            }
        }

        throw error;
    }
}

// Background sync for offline functionality
self.addEventListener('sync', (event) => {
    console.log('Service Worker: Background sync triggered', event.tag);

    if (event.tag === 'notes-sync') {
        event.waitUntil(syncNotes());
    }
});

// Sync notes when back online
async function syncNotes() {
    try {
        // This would integrate with your notes storage system
        console.log('Service Worker: Syncing notes...');

        // Get pending sync data from IndexedDB or localStorage
        // Send to server if needed
        // Update local storage with server response

        console.log('Service Worker: Notes synced successfully');
    } catch (error) {
        console.error('Service Worker: Notes sync failed', error);
        throw error; // Will retry sync later
    }
}

// Push notifications (if implemented)
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push message received');

    const options = {
        body: event.data ? event.data.text() : 'New notification',
        icon: '/android-chrome-192x192.png',
        badge: '/favicon-32x32.png',
        vibrate: [200, 100, 200],
        data: {
            timestamp: Date.now()
        },
        actions: [
            {
                action: 'open',
                title: 'Open App'
            },
            {
                action: 'close',
                title: 'Close'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('Notes App', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Notification clicked');

    event.notification.close();

    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.matchAll({ type: 'window' })
                .then((clientList) => {
                    // Focus existing window if available
                    for (const client of clientList) {
                        if (client.url === '/' && 'focus' in client) {
                            return client.focus();
                        }
                    }

                    // Open new window
                    if (clients.openWindow) {
                        return clients.openWindow('/');
                    }
                })
        );
    }
});

// Message handling for communication with main app
self.addEventListener('message', (event) => {
    console.log('Service Worker: Message received', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
    console.log('Service Worker: Periodic sync triggered', event.tag);

    if (event.tag === 'notes-backup') {
        event.waitUntil(backupNotes());
    }
});

// Backup notes periodically
async function backupNotes() {
    try {
        console.log('Service Worker: Creating notes backup...');

        // This would create a backup of user's notes
        // Could upload to cloud service or save locally

        console.log('Service Worker: Notes backup completed');
    } catch (error) {
        console.error('Service Worker: Notes backup failed', error);
    }
}

// Error handling
self.addEventListener('error', (event) => {
    console.error('Service Worker: Error occurred', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('Service Worker: Unhandled promise rejection', event.reason);
});