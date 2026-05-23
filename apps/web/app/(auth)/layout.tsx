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
    <div className="min-h-full flex items-center justify-center bg-muted/40 p-4">
      {children}
    </div>
  );
}
