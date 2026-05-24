'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { initSocket } from '@/hooks/useSocket';
import { getUser } from '@/lib/auth';
import type { Notification } from '@/types/api';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Notification[]>('/notifications').then((r) => {
      setNotifications(r.data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const currentUser = getUser();
    const socket = initSocket();
    const handler = (data: { notification: Notification }) => {
      if (!currentUser || data.notification.userId !== currentUser.id) return;
      setNotifications((prev) => [data.notification, ...prev]);
    };
    socket.on('notification:new', handler);
    return () => { socket.off('notification:new', handler); };
  }, []);

  const markAllRead = async () => {
    await api.patch('/notifications/read');
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">כל ההתראות</h1>
        {unread > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead}>
            סמן הכל כנקרא
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
          <Bell className="size-10 opacity-30" />
          <p className="text-sm">אין התראות</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden shadow-sm">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                'px-4 py-4 border-b last:border-0 transition-colors',
                !n.read ? 'bg-primary/8' : 'bg-card',
              )}
            >
              <div className="flex items-start gap-3">
                <span className={cn(
                  'mt-1.5 size-2 rounded-full shrink-0',
                  !n.read ? 'bg-primary' : 'bg-muted-foreground/20',
                )} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-4">
                    <p className={cn('text-sm leading-snug', !n.read ? 'font-semibold' : 'font-medium')}>
                      {n.title}
                    </p>
                    <p className="text-xs text-muted-foreground/60 shrink-0">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: he })}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-snug">{n.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
