'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isToday, isTomorrow, isYesterday, startOfDay, startOfMonth } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from 'sonner';
import api from '@/lib/api';
import { initSocket } from '@/hooks/useSocket';
import type { Job, JobStatus } from '@/types/api';
import { JobStatusBadge } from '@/components/jobs/JobStatusBadge';
import { EscrowBadge } from '@/components/jobs/EscrowBadge';
import { MonthNavigator } from '@/components/stats/MonthNavigator';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice, isInMonth, cn } from '@/lib/utils';
import { MapPin, CalendarRange } from 'lucide-react';

type Filter = 'ALL' | JobStatus;

const STATUS_FILTERS: { key: Filter; label: string }[] = [
  { key: 'ALL', label: 'הכל' },
  { key: 'OPEN', label: 'פתוח' },
  { key: 'ACCEPTED', label: 'שובץ נהג' },
  { key: 'IN_PROGRESS', label: 'בביצוע' },
  { key: 'COMPLETED', label: 'ממתין לתשלום' },
  { key: 'PAID', label: 'שולם' },
  { key: 'DELETED', label: 'מחוק' },
];

function dayLabel(d: Date): string {
  if (isToday(d)) return 'היום';
  if (isTomorrow(d)) return 'מחר';
  if (isYesterday(d)) return 'אתמול';
  return format(d, 'EEEE, d בMMMM', { locale: he });
}

function groupByDay(jobs: Job[]) {
  const map = new Map<string, Job[]>();
  for (const job of jobs) {
    const key = format(new Date(job.scheduledAt), 'yyyy-MM-dd');
    (map.get(key) ?? map.set(key, []).get(key)!).push(job);
  }

  const groups = Array.from(map.values()).map((js) => {
    const sorted = js.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    return { key: format(new Date(sorted[0].scheduledAt), 'yyyy-MM-dd'), date: new Date(sorted[0].scheduledAt), jobs: sorted };
  });

  // Today on top, then upcoming days ascending, then past days (most recent first).
  const today = startOfDay(new Date()).getTime();
  groups.sort((a, b) => {
    const at = startOfDay(a.date).getTime();
    const bt = startOfDay(b.date).getTime();
    const aUpcoming = at >= today;
    const bUpcoming = bt >= today;
    if (aUpcoming && bUpcoming) return at - bt;
    if (!aUpcoming && !bUpcoming) return bt - at;
    return aUpcoming ? -1 : 1;
  });
  return groups;
}

function JobRow({ job, onMarkPaid }: { job: Job; onMarkPaid: (id: string) => void }) {
  return (
    <div className="flex items-center gap-3 p-3">
      <div className="w-11 shrink-0 text-center">
        <p className="text-sm font-bold leading-none">{format(new Date(job.scheduledAt), 'HH:mm')}</p>
      </div>

      <span className="bg-brand-gradient grid size-8 shrink-0 place-items-center rounded-lg text-[11px] font-bold text-white select-none">
        {(job.business?.name ?? '?').trim().charAt(0)}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">
          {job.title}
          <span className="font-normal text-muted-foreground"> · {job.business?.name ?? '—'}</span>
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
          <MapPin className="size-3 shrink-0 text-brand-strong" />
          <bdi>{job.fromLocation}</bdi>
          <span className="text-muted-foreground/50">←</span>
          <bdi>{job.toLocation}</bdi>
          {job.driver && <span className="text-muted-foreground/80">· נהג: {job.driver.name}</span>}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div className="flex flex-col items-end gap-1">
          <JobStatusBadge status={job.status} />
          <EscrowBadge status={job.escrowStatus} />
        </div>
        <p className="w-16 text-end text-sm font-bold">{formatPrice(job.grossPriceCents)}</p>
        {job.status === 'COMPLETED' && (
          <Button size="sm" variant="outline" onClick={() => onMarkPaid(job.id)}>סמן כשולם</Button>
        )}
      </div>
    </div>
  );
}

export default function AdminJobsPage() {
  const qc = useQueryClient();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [filter, setFilter] = useState<Filter>('ALL');

  const { data, isLoading } = useQuery<Job[]>({
    queryKey: ['admin-jobs'],
    queryFn: () => api.get('/admin/jobs').then((r) => r.data),
  });

  useEffect(() => {
    const socket = initSocket();
    const refresh = () => qc.invalidateQueries({ queryKey: ['admin-jobs'] });
    socket.on('job:new', refresh);
    socket.on('job:accepted', refresh);
    socket.on('job:updated', refresh);
    return () => {
      socket.off('job:new', refresh);
      socket.off('job:accepted', refresh);
      socket.off('job:updated', refresh);
    };
  }, [qc]);

  const paidMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/jobs/${id}/paid`),
    onSuccess: () => { toast.success('העבודה סומנה כשולמה'); qc.invalidateQueries({ queryKey: ['admin-jobs'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'שגיאה'),
  });

  const monthJobs = useMemo(
    () => (data ?? []).filter((j) => isInMonth(j.scheduledAt, month)),
    [data, month],
  );

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { ALL: monthJobs.length, OPEN: 0, ACCEPTED: 0, IN_PROGRESS: 0, COMPLETED: 0, PAID: 0, DELETED: 0 };
    for (const j of monthJobs) c[j.status]++;
    return c;
  }, [monthJobs]);

  const visible = filter === 'ALL' ? monthJobs : monthJobs.filter((j) => j.status === filter);
  const groups = groupByDay(visible);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">כל העבודות</h1>
          <p className="text-sm text-muted-foreground">סינון לפי סטטוס · מקובץ לפי יום</p>
        </div>
        <MonthNavigator month={month} onChange={setMonth} />
      </div>

      {/* status filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors',
              filter === f.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent',
            )}
          >
            {f.label}
            <span className={cn('text-[10px]', filter === f.key ? 'text-primary-foreground/80' : 'text-muted-foreground/70')}>
              {counts[f.key]}
            </span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-32 rounded-xl" />
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <span className="icon-chip size-12 bg-accent text-brand-strong">
            <CalendarRange className="size-6" />
          </span>
          <p className="text-sm text-muted-foreground">אין עבודות להצגה בחודש זה</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.key} className="space-y-2.5">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-bold capitalize">{dayLabel(g.date)}</h2>
                <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand-strong">{g.jobs.length}</span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <Card className="divide-y p-0">
                {g.jobs.map((job) => (
                  <JobRow key={job.id} job={job} onMarkPaid={paidMutation.mutate} />
                ))}
              </Card>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
