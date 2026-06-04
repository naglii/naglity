'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth } from 'date-fns';
import { he } from 'date-fns/locale';
import api from '@/lib/api';
import type { Job, JobStatus } from '@/types/api';
import { StatsCard } from '@/components/stats/StatsCard';
import { StatHero, HeroPill } from '@/components/stats/StatHero';
import { MonthNavigator } from '@/components/stats/MonthNavigator';
import { JobStatusBadge } from '@/components/jobs/JobStatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice, formatHoursLabel, durationMins, isInMonth, cn } from '@/lib/utils';
import { CheckCircle2, Clock, Timer, Wallet, CalendarClock, MapPin, Inbox, Banknote } from 'lucide-react';

const sum = (jobs: Job[], pick: (j: Job) => number) => jobs.reduce((t, j) => t + pick(j), 0);

type Filter = 'all' | 'PAID' | 'COMPLETED' | 'upcoming';

export default function DriverStatsPage() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [filter, setFilter] = useState<Filter>('all');

  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ['driver-jobs'],
    queryFn: () => api.get('/drivers/me/jobs').then((r) => r.data),
  });

  const m = useMemo(() => {
    const inMonth = jobs.filter((j) => isInMonth(j.scheduledAt, month));
    const paid = inMonth.filter((j) => j.status === 'PAID');
    const completed = inMonth.filter((j) => j.status === 'COMPLETED');
    const done = [...paid, ...completed];
    const upcoming = inMonth.filter((j) => j.status === 'ACCEPTED' || j.status === 'IN_PROGRESS');
    return {
      inMonth,
      paid,
      completed,
      done,
      upcoming,
      earnedNet: sum(done, (j) => j.netPriceCents),
      paidNet: sum(paid, (j) => j.netPriceCents),
      pendingNet: sum(completed, (j) => j.netPriceCents),
      totalMins: sum(done, (j) => durationMins(j.scheduledAt, j.estimatedEndAt)),
      avgNet: done.length ? Math.round(sum(done, (j) => j.netPriceCents) / done.length) : 0,
    };
  }, [jobs, month]);

  const filtered = useMemo(() => {
    const pool =
      filter === 'all' ? m.inMonth
      : filter === 'PAID' ? m.paid
      : filter === 'COMPLETED' ? m.completed
      : m.upcoming;
    return [...pool].sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
  }, [filter, m]);

  const chips: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'הכל', count: m.inMonth.length },
    { key: 'PAID', label: 'שולמו', count: m.paid.length },
    { key: 'COMPLETED', label: 'ממתין לתשלום', count: m.completed.length },
    { key: 'upcoming', label: 'מתוכננות', count: m.upcoming.length },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">סטטיסטיקות</h1>
          <p className="text-sm text-muted-foreground">סיכום הכנסות ופעילות לפי חודש</p>
        </div>
        <MonthNavigator month={month} onChange={setMonth} />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-36 rounded-2xl" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        </div>
      ) : (
        <>
          {/* ── Hero: net revenue merged with paid count ── */}
          <StatHero
            icon={Wallet}
            label={<>הכנסות נטו · <span className="capitalize">{format(month, 'MMMM yyyy', { locale: he })}</span></>}
            amount={formatPrice(m.earnedNet)}
          >
            <HeroPill icon={CheckCircle2} tone="success">{m.paid.length} שולמו · {formatPrice(m.paidNet)}</HeroPill>
            <HeroPill icon={Clock} tone="info">{m.completed.length} ממתינות לתשלום · {formatPrice(m.pendingNet)}</HeroPill>
          </StatHero>

          {/* ── Secondary stats ── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard title="עבודות שהושלמו" value={m.done.length} icon={CheckCircle2} tone="success" />
            <StatsCard title="עבודות ששולמו" value={m.paid.length} icon={Banknote} tone="brand" />
            <StatsCard title="שעות עבודה" value={formatHoursLabel(m.totalMins)} icon={Timer} tone="info" />
            <StatsCard title="מתוכננות החודש" value={m.upcoming.length} icon={CalendarClock} tone="warning" />
          </div>

          {/* ── Breakdown (was the history page) ── */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-bold">פירוט עבודות</h2>
              <div className="flex flex-wrap gap-1.5">
                {chips.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setFilter(c.key)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                      filter === c.key
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-accent',
                    )}
                  >
                    {c.label}
                    <span className={cn('text-[10px]', filter === c.key ? 'text-primary-foreground/80' : 'text-muted-foreground/70')}>
                      {c.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <Card className="p-0">
                <CardContent className="flex flex-col items-center justify-center gap-2 py-14 text-center">
                  <span className="icon-chip size-12 bg-accent text-brand-strong">
                    <Inbox className="size-6" />
                  </span>
                  <p className="text-sm text-muted-foreground">אין עבודות להצגה בחודש זה</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="divide-y p-0">
                {filtered.map((job) => (
                  <div key={job.id} className="flex items-center gap-4 p-4">
                    <div className="w-12 shrink-0 text-center">
                      <p className="text-sm font-bold leading-none">{format(new Date(job.scheduledAt), 'dd/MM')}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{format(new Date(job.scheduledAt), 'HH:mm')}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{job.title}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                        <MapPin className="size-3 shrink-0 text-brand-strong" />
                        <bdi>{job.fromLocation}</bdi>
                        <span className="text-muted-foreground/50">←</span>
                        <bdi>{job.toLocation}</bdi>
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <p className="text-sm font-bold">{formatPrice(job.netPriceCents)}</p>
                      <JobStatusBadge status={job.status as JobStatus} />
                    </div>
                  </div>
                ))}
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
