'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { BusinessStats } from '@/types/api';
import { StatsCard } from '@/components/stats/StatsCard';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/utils';
import { Banknote, Briefcase, Clock, CheckCircle2 } from 'lucide-react';

export default function BusinessStatsPage() {
  const { data, isLoading } = useQuery<BusinessStats>({
    queryKey: ['business-stats'],
    queryFn: () => api.get('/businesses/me/stats').then((r) => r.data),
  });

  if (isLoading) {
    return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>;
  }
  if (!data) return null;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">סטטיסטיקות</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title='סה"כ הוצאות' value={formatPrice(data.totalGrossSpendCents)} icon={Banknote} />
        <StatsCard title="פתוח" value={data.jobsByStatus.OPEN} icon={Briefcase} />
        <StatsCard title="בביצוע" value={data.jobsByStatus.ACCEPTED + data.jobsByStatus.IN_PROGRESS} icon={Clock} />
        <StatsCard title="הושלם" value={data.jobsByStatus.COMPLETED + data.jobsByStatus.PAID} icon={CheckCircle2} />
      </div>
    </div>
  );
}
