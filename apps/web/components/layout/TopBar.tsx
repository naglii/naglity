'use client';

import { useRouter } from 'next/navigation';
import { clearAuth } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Menu } from 'lucide-react';

interface Props {
  user: AuthUser;
  onMenuClick?: () => void;
}

export function TopBar({ user, onMenuClick }: Props) {
  const router = useRouter();

  const handleLogout = async () => {
    await api.post('/auth/logout').catch(() => {});
    clearAuth();
    router.push('/login');
  };

  const initials = (user.username ?? user.email ?? '??').slice(0, 2).toUpperCase();

  return (
    <header className="h-14 border-b bg-card flex items-center px-4 md:px-6 shrink-0">
      <button
        className="md:hidden p-1 rounded-md hover:bg-muted transition-colors"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </button>
      <div className="ml-auto flex items-center gap-3">
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
