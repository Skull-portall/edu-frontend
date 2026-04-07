// PWA Service Worker Registration + Push Subscription Manager

// Your VAPID public key (generated once, static)
const VAPID_PUBLIC_KEY = 'BHaY7__rkGxwL2RrZHqbs8Egglcai95gQuBAlwLEMRWZ2YLGa8tz9j274lpwdJVOjjpz5LRz2KD0rDwwLeEknFU';

function urlBase64ToUint8Array(base64String) {
 const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
 const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
 const rawData = window.atob(base64);
 const outputArray = new Uint8Array(rawData.length);
 for (let i = 0; i < rawData.length; ++i) {
 outputArray[i] = rawData.charCodeAt(i);
 }
 return outputArray;
}

/**
 * Register the Service Worker
 */
export async function registerServiceWorker() {
 if (!('serviceWorker' in navigator)) {
 console.warn('[PWA] Service workers not supported');
 return null;
 }

 try {
 const registration = await navigator.serviceWorker.register('/service-worker.js', {
 scope: '/',
 });

 console.log('[PWA] Service worker registered:', registration.scope);

 // Handle updates
 registration.addEventListener('updatefound', () => {
 const newWorker = registration.installing;
 if (newWorker) {
 newWorker.addEventListener('statechange', () => {
 if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
 console.log('[PWA] New service worker installed – refresh for update');
 }
 });
 }
 });

 return registration;
 } catch (err) {
 console.error('[PWA] Service worker registration failed:', err);
 return null;
 }
}

/**
 * Request push notification permission and subscribe
 */
export async function subscribeToPushNotifications(sendSubscriptionToServer) {
 if (!('Notification' in window)) {
 console.warn('[PWA] Notifications not supported');
 return null;
 }

 // Request permission
 let permission = Notification.permission;
 if (permission === 'default') {
 permission = await Notification.requestPermission();
 }

 if (permission !== 'granted') {
 console.log('[PWA] Notification permission denied');
 return null;
 }

 if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
 console.warn('[PWA] Push not supported');
 return null;
 }

 try {
 const registration = await navigator.serviceWorker.ready;

 // Check if already subscribed
 let subscription = await registration.pushManager.getSubscription();

 if (!subscription) {
 subscription = await registration.pushManager.subscribe({
 userVisibleOnly: true,
 applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
 });
 console.log('[PWA] Push subscription created');
 } else {
 console.log('[PWA] Already subscribed to push');
 }

 // Send subscription to backend
 if (sendSubscriptionToServer && subscription) {
 await sendSubscriptionToServer(subscription.toJSON());
 }

 return subscription;
 } catch (err) {
 console.error('[PWA] Push subscription failed:', err);
 return null;
 }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush() {
 if (!('serviceWorker' in navigator)) return;
 const registration = await navigator.serviceWorker.ready;
 const subscription = await registration.pushManager.getSubscription();
 if (subscription) {
 await subscription.unsubscribe();
 console.log('[PWA] Unsubscribed from push');
 }
}

/**
 * Get current push subscription (returns null if none)
 */
export async function getCurrentSubscription() {
 if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
 const registration = await navigator.serviceWorker.ready;
 return registration.pushManager.getSubscription();
}
