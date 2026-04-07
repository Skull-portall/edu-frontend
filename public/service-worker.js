// eDu Live Service Worker v1.0
// Handles: caching, offline fallback, push notifications

const CACHE_NAME = 'edu-live-v1';
const OFFLINE_URL = '/offline.html';

// Assets to pre-cache on install
const PRECACHE_ASSETS = [
    '/',
    '/offline.html',
    '/manifest.json',
    '/images/logo.svg',
];

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS).catch((err) => {
                console.warn('[SW] Pre-cache failed for some assets:', err);
            });
        })
    );
    self.skipWaiting(); // Activate immediately
});

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        })
    );
    self.clients.claim(); // Take control of all clients immediately
});

// ─── Fetch (Cache Strategy: Network First, Fallback to Cache) ─────────────────
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests and browser extensions
    if (request.method !== 'GET' || url.protocol === 'chrome-extension:') return;

    // Skip API calls — never cache API responses
    if (url.pathname.startsWith('/api/')) return;

    // Skip socket.io requests
    if (url.pathname.startsWith('/socket.io/')) return;

    event.respondWith(
        fetch(request)
            .then((networkResponse) => {
                // Cache valid responses from same origin
                if (
                    networkResponse.ok &&
                    networkResponse.type !== 'opaque' &&
                    url.origin === self.location.origin
                ) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                // Network failed — serve from cache
                return caches.match(request).then((cachedResponse) => {
                    if (cachedResponse) return cachedResponse;

                    // For navigation requests, return the offline page
                    if (request.destination === 'document') {
                        return caches.match(OFFLINE_URL);
                    }
                });
            })
    );
});

// ─── Push Notifications ───────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
    console.log('[SW] Push received');

    let data = {
        title: 'eDu Live',
        body: 'You have a new notification',
        icon: '/images/logo.svg',
        badge: '/images/logo.svg',
        tag: 'edu-live-notification',
        url: '/notifications',
    };

    try {
        if (event.data) {
            const parsed = event.data.json();
            data = { ...data, ...parsed };
        }
    } catch (e) {
        if (event.data) {
            data.body = event.data.text();
        }
    }

    const notificationOptions = {
        body: data.body,
        icon: data.icon || '/images/logo.svg',
        badge: data.badge || '/images/logo.svg',
        tag: data.tag || 'edu-live-notification',
        data: { url: data.url || '/notifications' },
        requireInteraction: data.requireInteraction || false,
        vibrate: [200, 100, 200],
        actions: data.actions || [
            { action: 'view', title: '👁 View' },
            { action: 'dismiss', title: '✕ Dismiss' },
        ],
    };

    event.waitUntil(
        self.registration.showNotification(data.title, notificationOptions)
    );
});

// ─── Notification Click ───────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
    const { action, notification } = event;
    notification.close();

    if (action === 'dismiss') return;

    const targetUrl = notification.data?.url || '/notifications';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Focus existing window if open
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(targetUrl);
                    return client.focus();
                }
            }
            // Open new window
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});

// ─── Background Sync (future-ready) ───────────────────────────────────────────
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-notifications') {
        console.log('[SW] Background sync: notifications');
    }
});
