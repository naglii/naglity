'use client';

import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import type { AuthUser } from '@/lib/auth';

interface Props {
  user: AuthUser;
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: Props) {
  return (
    <div className="flex h-full">
      <Sidebar role={user.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar user={user} />
        <main className="flex-1 overflow-y-auto p-6 bg-muted/20">{children}</main>
      </div>
    </div>
  );
}
