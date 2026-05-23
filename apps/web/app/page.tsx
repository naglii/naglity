'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    switch (user.role) {
      case 'DRIVER':
        router.replace('/driver/feed');
        break;
      case 'BUSINESS':
        router.replace('/business/jobs');
        break;
      case 'ADMIN':
        router.replace('/admin/drivers');
        break;
    }
  }, [router]);

  return null;
}
