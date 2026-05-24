'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isSameDay } from 'date-fns';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { Job } from '@/types/api';
import { JobStatusBadge } from '@/components/jobs/JobStatusBadge';
import { formatPrice, formatDuration } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Clock } from 'lucide-react';
import {
  Dialog, DialogTrigger, DialogPortal, DialogOverlay,
  DialogContent, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

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
    return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>;
  }

  const active = (jobs ?? []).filter((j) => ['ACCEPTED', 'IN_PROGRESS'].includes(j.status));

  if (active.length === 0) {
    return <p className="text-muted-foreground py-16 text-center">אין עבודות פעילות בלוח הזמנים.</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">לוח הזמנים שלי ({active.length})</h1>
      <div className="space-y-3">
        {active.map((job) => {
          const isToday = isSameDay(new Date(job.scheduledAt), new Date());
          return (
            <Card key={job.id}>
              <CardHeader className="pb-2 flex flex-row items-start justify-between">
                <CardTitle className="text-base">{job.title}</CardTitle>
                <JobStatusBadge status={job.status} />
              </CardHeader>
              <CardContent className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="size-3.5 shrink-0" />
                  <bdi>{job.fromLocation}</bdi> ← <bdi>{job.toLocation}</bdi>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="size-3.5 shrink-0" />
                  {format(new Date(job.scheduledAt), 'dd/MM/yy HH:mm')} · {formatDuration(job.scheduledAt, job.estimatedEndAt)}
                </div>
                <p className="font-semibold">
                  {formatPrice(job.netPriceCents)}{' '}
                  <span className="text-xs font-normal text-muted-foreground">נטו</span>
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {job.status === 'ACCEPTED' && (
                    <Button size="sm" onClick={() => startMutation.mutate(job.id)}>
                      התחל עבודה
                    </Button>
                  )}
                  {job.status === 'ACCEPTED' && (
                    <Dialog open={cancelOpen === job.id} onOpenChange={(o) => setCancelOpen(o ? job.id : null)}>
                      <DialogTrigger render={
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isToday}
                          title={isToday ? 'לא ניתן לבטל ביום העבודה' : undefined}
                        >
                          בטל קבלה
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
                          <div className="flex justify-end gap-2 mt-4">
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
                  {isToday && job.status === 'ACCEPTED' && (
                    <p className="text-xs text-muted-foreground">לא ניתן לבטל ביום העבודה</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
