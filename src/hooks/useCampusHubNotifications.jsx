import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { campusHubAPI } from '../services/api';
import toast from 'react-hot-toast';

/**
 * Polls for new Campus Hub orders (provider) and new chat messages (both),
 * shows toast when detected. Runs when user is authenticated.
 */
export function useCampusHubNotifications(user) {
  const lastOrderCountRef = useRef(null);

  const { data: orders = [] } = useQuery({
    queryKey: ['campusHubOrders'],
    queryFn: async () => {
      const res = await campusHubAPI.getMyOrders();
      return res.data.data || [];
    },
    enabled: !!user,
    refetchInterval: 15000, // Poll every 15s
  });

  useEffect(() => {
    if (!user) return;
    const prevCount = lastOrderCountRef.current;
    const currentCount = orders.length;

    if (prevCount === null) {
      lastOrderCountRef.current = currentCount;
      return;
    }

    if (currentCount > prevCount && user.role === 'provider') {
      const newCount = currentCount - prevCount;
      toast((t) => (
        <span>
          New order{newCount > 1 ? 's' : ''} received!{' '}
          <a href="/campus-hub/orders" className="underline font-medium" onClick={() => toast.dismiss(t.id)}>
            View
          </a>
        </span>
      ), { duration: 5000, icon: '📬' });
    }

    lastOrderCountRef.current = currentCount;
  }, [user, orders]);

  return null;
}
