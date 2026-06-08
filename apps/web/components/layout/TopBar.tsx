'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { clearAuth } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import { queryClient } from '@/lib/queryClient';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { LogOut, Menu, ChevronDown, UserRound, Settings } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { disconnectSocket } from '@/hooks/useSocket';

const roleLabel: Record<string, string> = {
  DRIVER: 'נהג',
  BUSINESS: 'עסק',
  ADMIN: 'מנהל',
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'בוקר טוב';
  if (h < 17) return 'צהריים טובים';
  if (h < 21) return 'ערב טוב';
  return 'לילה טוב';
}

interface Props {
  user: AuthUser;
  onMenuClick?: () => void;
}

export function TopBar({ user, onMenuClick }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the menu on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleLogout = async () => {
    await api.post('/auth/logout').catch(() => {});
    disconnectSocket();
    clearAuth();
    queryClient.clear();
    router.push('/login');
  };

  const initials = (user.username ?? user.email ?? '??').slice(0, 2).toUpperCase();
  const isClient = user.role === 'BUSINESS' && user.accountType === 'INDIVIDUAL';
  const role = isClient ? 'לקוח' : (roleLabel[user.role] ?? user.role);

  return (
    <header className="h-16 border-b bg-topbar/80 backdrop-blur-md flex items-center gap-3 px-4 md:px-6 shrink-0 sticky top-0 z-30">
      <button
        className="md:hidden -ms-1 p-2 rounded-lg hover:bg-muted transition-colors"
        onClick={onMenuClick}
        aria-label="פתח תפריט"
      >
        <Menu className="size-5" />
      </button>

      <div className="min-w-0">
        <p className="text-sm font-semibold leading-tight truncate">
          {greeting()}, {user.username} 👋
        </p>
        <p className="text-xs text-muted-foreground leading-tight">{role}</p>
      </div>

      <div className="ms-auto flex items-center gap-1.5">
        <NotificationBell />

        {/* Account menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label="תפריט חשבון"
            className={cn(
              'flex items-center gap-1.5 rounded-full p-1 ps-1 transition-colors hover:bg-muted',
              open && 'bg-muted',
            )}
          >
            <span className="bg-brand-gradient grid size-9 place-items-center rounded-full text-xs font-bold text-white shadow-sm shadow-brand/30 select-none">
              {initials}
            </span>
            <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
          </button>

          {open && (
            <div
              role="menu"
              className="absolute end-0 mt-2 w-60 origin-top overflow-hidden rounded-xl border bg-popover p-1.5 shadow-xl animate-in fade-in-0 zoom-in-95 duration-100"
            >
              {/* identity header — the only place name + role appear */}
              <div className="flex items-center gap-3 rounded-lg px-2.5 py-2">
                <span className="bg-brand-gradient grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold text-white select-none">
                  {initials}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold leading-tight">{user.username}</p>
                  <p className="truncate text-xs text-muted-foreground leading-tight">
                    {user.email ?? role}
                  </p>
                  <span className="mt-1 inline-flex rounded-full bg-brand-soft px-1.5 py-0.5 text-[10px] font-semibold text-brand-strong">
                    {role}
                  </span>
                </div>
              </div>

              <div className="my-1 h-px bg-border" />

              <button
                role="menuitem"
                onClick={() => { setOpen(false); toast('עריכת פרופיל תהיה זמינה בקרוב 🔧'); }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                <UserRound className="size-4 text-muted-foreground" />
                הפרופיל שלי
              </button>
              <button
                role="menuitem"
                onClick={() => { setOpen(false); toast('הגדרות יתווספו בקרוב ⚙️'); }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                <Settings className="size-4 text-muted-foreground" />
                הגדרות
              </button>

              <div className="my-1 h-px bg-border" />

              <button
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="size-4" />
                יציאה
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
