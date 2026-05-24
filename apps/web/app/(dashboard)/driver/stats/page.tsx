'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { DriverStats } from '@/types/api';
import { StatsCard } from '@/components/stats/StatsCard';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/utils';
import { Banknote, CheckCircle2, Truck, Clock } from 'lucide-react';

export default function DriverStatsPage() {
  const { data, isLoading } = useQuery<DriverStats>({
    queryKey: ['driver-stats'],
    queryFn: () => api.get('/drivers/me/stats').then((r) => r.data),
  });

  if (isLoading) {
    return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>;
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">הסטטיסטיקות שלי</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title='סה"כ הכנסות (נטו)' value={formatPrice(data.totalNetEarningsCents)} icon={Banknote} />
        <StatsCard title="הושלם" value={data.jobsByStatus.COMPLETED + data.jobsByStatus.PAID} icon={CheckCircle2} />
        <StatsCard title="בביצוע" value={data.jobsByStatus.IN_PROGRESS} icon={Truck} />
        <StatsCard title="מאושר" value={data.jobsByStatus.ACCEPTED} icon={Clock} />
      </div>
    </div>
  );
}
