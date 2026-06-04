'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth } from 'date-fns';
import { he } from 'date-fns/locale';
import api from '@/lib/api';
import { initSocket } from '@/hooks/useSocket';
import type { AdminStats, Job } from '@/types/api';
import { StatsCard } from '@/components/stats/StatsCard';
import { StatHero, HeroPill } from '@/components/stats/StatHero';
import { MonthNavigator } from '@/components/stats/MonthNavigator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice, isInMonth } from '@/lib/utils';
import { TrendingUp, Users, Building2, Banknote, Truck, DollarSign, Briefcase } from 'lucide-react';

const sum = (jobs: Job[], pick: (j: Job) => number) => jobs.reduce((t, j) => t + pick(j), 0);

const STATUS_HE: Record<string, string> = {
  OPEN: 'פתוח',
  ACCEPTED: 'שובץ נהג',
  IN_PROGRESS: 'בביצוע',
  COMPLETED: 'הושלם',
  PAID: 'שולם',
  DELETED: 'מחוק',
};

const STATUS_ORDER = ['OPEN', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'PAID', 'DELETED'] as const;

export default function AdminRevenuePage() {
  const qc = useQueryClient();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const { data, isLoading } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/stats/admin').then((r) => r.data),
  });

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ['admin-jobs'],
    queryFn: () => api.get('/admin/jobs').then((r) => r.data),
  });

  // Live: job changes affect revenue figures.
  useEffect(() => {
    const socket = initSocket();
    const refresh = () => {
      qc.invalidateQueries({ queryKey: ['admin-jobs'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    };
    socket.on('job:new', refresh);
    socket.on('job:accepted', refresh);
    socket.on('job:updated', refresh);
    return () => {
      socket.off('job:new', refresh);
      socket.off('job:accepted', refresh);
      socket.off('job:updated', refresh);
    };
  }, [qc]);

  const m = useMemo(() => {
    const inMonth = jobs.filter((j) => isInMonth(j.scheduledAt, month));
    const done = inMonth.filter((j) => j.status === 'PAID' || j.status === 'COMPLETED');
    const gross = sum(done, (j) => j.grossPriceCents);
    const payouts = sum(done, (j) => j.netPriceCents);
    const byStatus: Record<string, number> = { OPEN: 0, ACCEPTED: 0, IN_PROGRESS: 0, COMPLETED: 0, PAID: 0, DELETED: 0 };
    for (const j of inMonth) byStatus[j.status] = (byStatus[j.status] ?? 0) + 1;
    return { inMonth, done, gross, payouts, platform: gross - payouts, byStatus };
  }, [jobs, month]);

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-36 rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">הכנסות פלטפורמה</h1>
          <p className="text-sm text-muted-foreground">הכנסות חודשיות וסקירה כוללת</p>
        </div>
        <MonthNavigator month={month} onChange={setMonth} />
      </div>

      {/* ── Monthly statement ── */}
      <StatHero
        icon={TrendingUp}
        label={<>הכנסות פלטפורמה (10%) · <span className="capitalize">{format(month, 'MMMM yyyy', { locale: he })}</span></>}
        amount={formatPrice(m.platform)}
      >
        <HeroPill icon={DollarSign} tone="info">מחזור {formatPrice(m.gross)}</HeroPill>
        <HeroPill icon={Banknote} tone="brand">לנהגים {formatPrice(m.payouts)}</HeroPill>
        <HeroPill icon={Briefcase} tone="muted">{m.done.length} עבודות</HeroPill>
      </StatHero>

      {/* ── Jobs by status — for the selected month ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            עבודות לפי סטטוס · <span className="capitalize font-medium text-muted-foreground">{format(month, 'MMMM yyyy', { locale: he })}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {STATUS_ORDER.map((status) => (
              <div key={status} className="rounded-xl bg-muted/50 p-3 text-center">
                <p className="text-2xl font-bold">{m.byStatus[status] ?? 0}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{STATUS_HE[status]}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── All-time totals (last) ── */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-foreground">סך הכל (מאז ומתמיד)</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCard title="הכנסות פלטפורמה (10%)" value={formatPrice(data.totalPlatformRevenueCents)} icon={TrendingUp} tone="success" />
          <StatsCard title="תשלומי נהגים (90%)" value={formatPrice(data.totalDriverPayoutsCents)} icon={Banknote} tone="brand" />
          <StatsCard title="מחזור גולמי" value={formatPrice(data.totalGrossCents)} icon={DollarSign} tone="info" />
          <StatsCard title='סה"כ נהגים' value={data.driversCount} icon={Truck} tone="info" href="/admin/drivers" />
          <StatsCard title='סה"כ עסקים' value={data.businessesCount} icon={Building2} tone="warning" href="/admin/businesses" />
          <StatsCard title='סה"כ עבודות' value={data.totalJobs} icon={Users} tone="brand" href="/admin/jobs" />
        </div>
      </div>
    </div>
  );
}
