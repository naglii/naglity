// Shared notifications query + live socket updates (mirrors the web NotificationBell data flow).
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { initSocket } from '@/lib/socket';
import { getUserSync } from '@/lib/auth';
import type { Notification } from '@/types/api';

export const NOTIFICATIONS_KEY = ['notifications'];

export function useNotifications() {
  const qc = useQueryClient();

  const query = useQuery<Notification[]>({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: () => api.get('/notifications').then((r) => r.data),
  });

  useEffect(() => {
    const socket = initSocket();
    const me = getUserSync();
    const handler = (data: { notification: Notification }) => {
      if (!me || data.notification.userId !== me.id) return;
      qc.setQueryData<Notification[]>(NOTIFICATIONS_KEY, (old = []) => [data.notification, ...old]);
    };
    socket.on('notification:new', handler);
    return () => {
      socket.off('notification:new', handler);
    };
  }, [qc]);

  const notifications = query.data ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    if (notifications.some((n) => !n.read)) {
      qc.setQueryData<Notification[]>(NOTIFICATIONS_KEY, (old = []) =>
        old.map((n) => ({ ...n, read: true })),
      );
      api.patch('/notifications/read').catch(() => {});
    }
  };

  return { ...query, notifications, unreadCount, markAllRead };
}
