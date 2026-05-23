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
      <h1 className="text-xl font-semibold">Platform Revenue</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard title="Platform Revenue (10%)" value={formatPrice(data.totalPlatformRevenueCents)} icon={TrendingUp} />
        <StatsCard title="Driver Payouts (90%)" value={formatPrice(data.totalDriverPayoutsCents)} icon={Banknote} />
        <StatsCard title="Gross Volume" value={formatPrice(data.totalGrossCents)} icon={DollarSign} />
        <StatsCard title="Total Drivers" value={data.driversCount} icon={Truck} />
        <StatsCard title="Total Businesses" value={data.businessesCount} icon={Building2} />
        <StatsCard title="Total Jobs" value={data.totalJobs} icon={Users} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Jobs by Status</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {Object.entries(data.jobsByStatus).map(([status, count]) => (
              <div key={status} className="text-center">
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground">{status.replace('_', ' ')}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
