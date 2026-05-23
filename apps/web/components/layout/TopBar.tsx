'use client';

import { useRouter } from 'next/navigation';
import { clearAuth } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut } from 'lucide-react';
import { useTheme, THEMES } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

export function TopBar({ user }: { user: AuthUser }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    await api.post('/auth/logout').catch(() => {});
    clearAuth();
    router.push('/login');
  };

  const initials = (user.username ?? user.email ?? '??').slice(0, 2).toUpperCase();

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-6 shrink-0">
      {/* Theme switcher */}
      <div className="flex items-center gap-1.5">
        {THEMES.map((t) => (
          <button
            key={t.id}
            title={t.label}
            onClick={() => setTheme(t.id)}
            className={cn(
              'size-4 rounded-full transition-transform hover:scale-110',
              t.dot,
              theme === t.id ? 'ring-2 ring-offset-2 ring-foreground/40 scale-110' : 'opacity-60',
            )}
          />
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Avatar className="size-8">
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="text-sm">
          <p className="font-medium leading-none">{user.username}</p>
          <p className="text-xs text-muted-foreground">{user.role}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  );
}
