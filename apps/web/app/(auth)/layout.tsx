'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    if (!user) return;
    switch (user.role) {
      case 'DRIVER': router.replace('/driver/feed'); break;
      case 'BUSINESS': router.replace('/business/jobs'); break;
      case 'ADMIN': router.replace('/admin/drivers'); break;
    }
  }, [router]);

  return (
    <div className="relative min-h-full flex items-center justify-center overflow-hidden p-4">
      {/* warm branded backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-background" />
      <div className="pointer-events-none absolute -top-24 -start-24 -z-10 size-96 rounded-full bg-brand/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -end-24 -z-10 size-96 rounded-full bg-brand-strong/15 blur-3xl" />
      {children}
    </div>
  );
}
