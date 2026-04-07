import { useState, useEffect, useCallback } from 'react';
import { subscribeToPushNotifications, getCurrentSubscription } from '../utils/pwa';
import api from '../services/api';

/**
 * Hook to manage push notification subscription for a logged-in user.
 * Automatically prompts for permission after first login.
 */
export function usePushNotifications(user) {
 const [permission, setPermission] = useState(
 typeof Notification !== 'undefined' ? Notification.permission : 'default'
 );
 const [isSubscribed, setIsSubscribed] = useState(false);

 // Send subscription object to backend to store against this user
 const sendSubscriptionToServer = useCallback(async (subscriptionJSON) => {
 try {
 await api.post('/push/subscribe', { subscription: subscriptionJSON });
 } catch (err) {
 console.warn('[Push] Failed to save subscription:', err?.response?.data?.message || err.message);
 }
 }, []);

 // Subscribe the user to push
 const subscribe = useCallback(async () => {
 const sub = await subscribeToPushNotifications(sendSubscriptionToServer);
 if (sub) {
 setIsSubscribed(true);
 setPermission('granted');
 }
 }, [sendSubscriptionToServer]);

 // Check current subscription state on mount
 useEffect(() => {
 if (!user) return;

 const checkAndSubscribe = async () => {
 const currentSub = await getCurrentSubscription();
 if (currentSub) {
 setIsSubscribed(true);
 setPermission('granted');
 // Re-send to server in case it was cleared (e.g. after server restart)
 await sendSubscriptionToServer(currentSub.toJSON());
 return;
 }

 // Auto-subscribe if permission not yet asked
 if (Notification.permission === 'default') {
 // Small delay so the prompt doesn't feel intrusive on first load
 setTimeout(subscribe, 5000);
 }
 };

 checkAndSubscribe();
 }, [user?._id]);

 return { permission, isSubscribed, subscribe };
}
