'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isSameDay, isToday, isTomorrow } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { Job } from '@/types/api';
import { JobStatusBadge } from '@/components/jobs/JobStatusBadge';
import { formatPrice, formatDuration, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Play, CalendarX2, CalendarDays } from 'lucide-react';
import {
  Dialog, DialogTrigger, DialogPortal, DialogOverlay,
  DialogContent, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

const accentByStatus: Record<string, string> = {
  ACCEPTED: 'border-warning',
  IN_PROGRESS: 'border-info',
};

function dayLabel(d: Date): string {
  if (isToday(d)) return 'היום';
  if (isTomorrow(d)) return 'מחר';
  return format(d, 'EEEE, d בMMMM', { locale: he });
}

export default function DriverSchedulePage() {
  const qc = useQueryClient();
  const [cancelOpen, setCancelOpen] = useState<string | null>(null);

  const { data: jobs, isLoading } = useQuery<Job[]>({
    queryKey: ['driver-jobs'],
    queryFn: () => api.get('/drivers/me/jobs').then((r) => r.data),
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => api.post(`/jobs/${id}/start`),
    onSuccess: () => { toast.success('העבודה החלה'); qc.invalidateQueries({ queryKey: ['driver-jobs'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'שגיאה'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.post(`/jobs/${id}/cancel`),
    onSuccess: () => {
      toast.success('העבודה בוטלה וחזרה לרשימת ההצעות');
      setCancelOpen(null);
      qc.invalidateQueries({ queryKey: ['driver-jobs'] });
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? 'שגיאה בביטול');
      setCancelOpen(null);
    },
  });

  if (isLoading) {
    return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>;
  }

  const active = (jobs ?? [])
    .filter((j) => ['ACCEPTED', 'IN_PROGRESS'].includes(j.status))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  if (active.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <span className="icon-chip size-16 bg-accent text-brand-strong">
          <CalendarDays className="size-7" />
        </span>
        <p className="mt-4 text-xl font-semibold">לוח הזמנים ריק</p>
        <p className="mt-1 text-sm text-muted-foreground">עבודות שתקבל יופיעו כאן מסודרות לפי יום ושעה</p>
        <Button className="mt-5" render={<a href="/driver/feed" />} nativeButton={false}>
          לעבודות זמינות
        </Button>
      </div>
    );
  }

  // Group by calendar day, preserving the time order.
  const groups: { key: string; date: Date; jobs: Job[] }[] = [];
  for (const job of active) {
    const d = new Date(job.scheduledAt);
    const last = groups[groups.length - 1];
    if (last && isSameDay(last.date, d)) last.jobs.push(job);
    else groups.push({ key: job.id, date: d, jobs: [job] });
  }

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-xl font-bold">לוח הזמנים שלי</h1>
        <p className="text-sm text-muted-foreground">{active.length} עבודות פעילות</p>
      </div>

      {groups.map((group) => (
        <section key={group.key} className="space-y-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-foreground">{dayLabel(group.date)}</h2>
            <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
              {group.jobs.length}
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-3">
            {group.jobs.map((job) => {
              const isJobToday = isSameDay(new Date(job.scheduledAt), new Date());
              return (
                <Card
                  key={job.id}
                  className={cn('overflow-hidden p-0 border-s-4', accentByStatus[job.status] ?? 'border-border')}
                >
                  <CardContent className="flex flex-col gap-0 p-0 sm:flex-row">
                    {/* time rail */}
                    <div className="flex shrink-0 items-center gap-3 bg-accent/50 px-4 py-3 sm:w-24 sm:flex-col sm:justify-center sm:gap-0.5 sm:py-4">
                      <span className="text-xl font-bold leading-none">{format(new Date(job.scheduledAt), 'HH:mm')}</span>
                      <span className="text-[11px] text-muted-foreground">{formatDuration(job.scheduledAt, job.estimatedEndAt)}</span>
                    </div>

                    {/* body */}
                    <div className="flex-1 space-y-2.5 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold leading-tight">{job.title}</h3>
                        <JobStatusBadge status={job.status} />
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="size-3.5 shrink-0 text-brand-strong" />
                        <bdi>{job.fromLocation}</bdi>
                        <span className="text-muted-foreground/50">←</span>
                        <bdi>{job.toLocation}</bdi>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <p className="text-sm font-bold">
                          {formatPrice(job.netPriceCents)}{' '}
                          <span className="text-xs font-normal text-muted-foreground">נטו</span>
                        </p>

                        <div className="flex items-center gap-2">
                          {job.status === 'ACCEPTED' && (
                            <Button size="sm" className="gap-1.5" onClick={() => startMutation.mutate(job.id)}>
                              <Play className="size-3.5" />
                              התחל עבודה
                            </Button>
                          )}
                          {job.status === 'ACCEPTED' && (
                            <Dialog open={cancelOpen === job.id} onOpenChange={(o) => setCancelOpen(o ? job.id : null)}>
                              <DialogTrigger render={
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={isJobToday}
                                  title={isJobToday ? 'לא ניתן לבטל ביום העבודה' : undefined}
                                  className="gap-1.5"
                                >
                                  <CalendarX2 className="size-3.5" />
                                  בטל
                                </Button>
                              } />
                              <DialogPortal>
                                <DialogOverlay />
                                <DialogContent className="max-w-sm">
                                  <DialogTitle>לבטל את קבלת העבודה?</DialogTitle>
                                  <DialogDescription className="mt-1">
                                    <span className="font-medium text-foreground">{job.title}</span>
                                    <br />
                                    העבודה תחזור לרשימת ההצעות לנהגים אחרים.
                                  </DialogDescription>
                                  <div className="mt-4 flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setCancelOpen(null)}>חזרה</Button>
                                    <Button
                                      variant="destructive"
                                      onClick={() => cancelMutation.mutate(job.id)}
                                      disabled={cancelMutation.isPending}
                                    >
                                      {cancelMutation.isPending ? 'מבטל…' : 'אישור ביטול'}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </DialogPortal>
                            </Dialog>
                          )}
                        </div>
                      </div>

                      {isJobToday && job.status === 'ACCEPTED' && (
                        <p className="text-[11px] text-muted-foreground">לא ניתן לבטל ביום העבודה</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
