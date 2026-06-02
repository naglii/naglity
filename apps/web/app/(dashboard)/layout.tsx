'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, type AuthUser } from '@/lib/auth';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { useSocket } from '@/hooks/useSocket';
import { DriverThemeProvider } from '@/components/theme/ThemeContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  useSocket(); // ensures socket is initialized for the session

  useEffect(() => {
    const u = getUser();
    if (!u) { router.replace('/login'); return; }
    setUser(u);
  }, [router]);

  if (!user) return null;

  return (
    <DriverThemeProvider>
      <DashboardShell user={user}>{children}</DashboardShell>
    </DriverThemeProvider>
  );
}
