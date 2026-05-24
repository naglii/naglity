'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { AdminBusinessDetail } from '@/types/api';
import { JobTable } from '@/components/jobs/JobTable';
import { StatsCard } from '@/components/stats/StatsCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/lib/utils';
import { ArrowRight, Banknote, CheckCircle2, Briefcase } from 'lucide-react';

export default function AdminBusinessDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading } = useQuery<AdminBusinessDetail>({
    queryKey: ['admin-business', id],
    queryFn: () => api.get(`/admin/businesses/${id}`).then((r) => r.data),
  });

  if (isLoading) return <Skeleton className="h-64" />;
  if (!data) return <p>העסק לא נמצא.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowRight className="size-4" /></Button>
        <div>
          <h1 className="text-xl font-semibold">{data.name}</h1>
          <p className="text-sm text-muted-foreground">@{data.user.username} · {data.phone}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard title='סה"כ הוצאות' value={formatPrice(data.stats.totalGrossSpendCents)} icon={Banknote} />
        <StatsCard title='סה"כ עבודות' value={Object.values(data.stats.jobsByStatus).reduce((a, b) => a + b, 0)} icon={Briefcase} />
        <StatsCard title="הושלם" value={(data.stats.jobsByStatus.COMPLETED ?? 0) + (data.stats.jobsByStatus.PAID ?? 0)} icon={CheckCircle2} />
      </div>

      <Separator />
      <h2 className="font-semibold">היסטוריית עבודות</h2>
      <JobTable jobs={data.jobs} showDriver />
    </div>
  );
}
