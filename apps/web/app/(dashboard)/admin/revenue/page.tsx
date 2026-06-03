'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { AdminStats } from '@/types/api';
import { StatsCard } from '@/components/stats/StatsCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';
import { TrendingUp, Users, Building2, Banknote, Truck, DollarSign } from 'lucide-react';

export default function AdminRevenuePage() {
  const { data, isLoading } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/stats/admin').then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">הכנסות פלטפורמה</h1>
        <p className="text-sm text-muted-foreground">סקירה כוללת של ההכנסות והפעילות</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard title="הכנסות פלטפורמה (10%)" value={formatPrice(data.totalPlatformRevenueCents)} icon={TrendingUp} tone="success" />
        <StatsCard title="תשלומי נהגים (90%)" value={formatPrice(data.totalDriverPayoutsCents)} icon={Banknote} tone="brand" />
        <StatsCard title="מחזור גולמי" value={formatPrice(data.totalGrossCents)} icon={DollarSign} tone="info" />
        <StatsCard title='סה"כ נהגים' value={data.driversCount} icon={Truck} tone="info" />
        <StatsCard title='סה"כ עסקים' value={data.businessesCount} icon={Building2} tone="warning" />
        <StatsCard title='סה"כ עבודות' value={data.totalJobs} icon={Users} tone="brand" />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold">עבודות לפי סטטוס</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {Object.entries(data.jobsByStatus).map(([status, count]) => (
              <div key={status} className="rounded-xl bg-muted/50 p-3 text-center">
                <p className="text-2xl font-bold">{count}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{status.replace('_', ' ')}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
