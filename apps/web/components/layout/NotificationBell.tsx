'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { initSocket } from '@/hooks/useSocket';
import { getUser } from '@/lib/auth';
import type { Notification } from '@/types/api';

const PREVIEW_COUNT = 5;

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const preview = notifications.slice(0, PREVIEW_COUNT);
  const hasMore = notifications.length > PREVIEW_COUNT;

  // Fetch on mount
  useEffect(() => {
    api.get<Notification[]>('/notifications')
      .then((r) => setNotifications(r.data))
      .catch(() => {});
  }, []);

  // Socket listener — uses the singleton socket, no dependency on ref
  useEffect(() => {
    const currentUser = getUser();
    const socket = initSocket();

    const handler = (data: { notification: Notification }) => {
      // Only accept notifications for the currently logged-in user
      if (!currentUser || data.notification.userId !== currentUser.id) return;
      setNotifications((prev) => [data.notification, ...prev]);
    };

    socket.on('notification:new', handler);
    return () => { socket.off('notification:new', handler); };
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    if (notifications.some((n) => !n.read)) {
      await api.patch('/notifications/read');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  const handleMarkRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAllRead();
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen((v) => { if (!v) markAllRead(); return !v; }); }}
        className={cn(
          'relative flex size-8 items-center justify-center rounded-full transition-colors',
          open ? 'bg-muted' : 'hover:bg-muted',
        )}
        aria-label="התראות"
      >
        <Bell className={cn('size-4 transition-colors', unreadCount > 0 ? 'text-foreground' : 'text-muted-foreground')} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -end-1 flex min-w-[16px] h-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground leading-none ring-2 ring-background">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute end-0 top-10 z-50 w-72 max-w-[calc(100vw-1rem)] rounded-xl border bg-popover shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b bg-muted/40">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">התראות</span>
              {unreadCount > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkRead}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                סמן הכל כנקרא
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <Bell className="size-8 opacity-25" />
              <p className="text-xs">אין התראות</p>
            </div>
          ) : (
            <>
              {preview.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    'px-3.5 py-3 border-b last:border-0',
                    !n.read ? 'bg-primary/5' : '',
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <span className={cn(
                      'mt-1.5 size-1.5 rounded-full shrink-0',
                      !n.read ? 'bg-primary' : 'bg-transparent',
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">{n.body}</p>
                      <p className="text-xs text-muted-foreground/50 mt-1">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: he })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border-t"
              >
                {hasMore ? `ראה את כל ההתראות (${notifications.length})` : 'ראה את כל ההתראות'}
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
