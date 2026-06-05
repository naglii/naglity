'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isSameDay } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { initSocket } from '@/hooks/useSocket';
import type { Job, JobStatus } from '@/types/api';
import { JobTable } from '@/components/jobs/JobTable';
import { ReceiptDialog } from '@/components/jobs/ReceiptDialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Receipt } from 'lucide-react';
import {
  Dialog, DialogPortal, DialogOverlay,
  DialogContent, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

const SECTIONS: { label: string; statuses: JobStatus[]; emptyText: string }[] = [
  { label: 'פתוח', statuses: ['OPEN'], emptyText: 'אין עבודות פתוחות — פרסם עבודה כדי להתחיל.' },
  { label: 'פעיל', statuses: ['ACCEPTED', 'IN_PROGRESS'], emptyText: 'אין עבודות בביצוע כרגע.' },
  { label: 'הושלם', statuses: ['COMPLETED'], emptyText: 'אין עבודות שהושלמו עדיין.' },
  { label: 'שולם', statuses: ['PAID'], emptyText: 'אין עבודות ששולמו עדיין.' },
];

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="text-sm font-bold text-foreground">{label}</h2>
      <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand-strong">{count}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

export default function BusinessJobsPage() {
  const qc = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null);
  const [receiptJobId, setReceiptJobId] = useState<string | null>(null);

  const { data: jobs, isLoading } = useQuery<Job[]>({
    queryKey: ['business-jobs'],
    queryFn: () => api.get('/businesses/me/jobs').then((r) => r.data),
  });

  // Live: refresh when a driver accepts one of our jobs, or any status changes.
  useEffect(() => {
    const socket = initSocket();
    const refresh = () => qc.invalidateQueries({ queryKey: ['business-jobs'] });
    socket.on('job:accepted', refresh);
    socket.on('job:updated', refresh);
    return () => {
      socket.off('job:accepted', refresh);
      socket.off('job:updated', refresh);
    };
  }, [qc]);

  const completeMutation = useMutation({
    mutationFn: (id: string) => api.post(`/jobs/${id}/complete`),
    onSuccess: () => { toast.success('העבודה סומנה כהושלמה'); qc.invalidateQueries({ queryKey: ['business-jobs'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'שגיאה'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/jobs/${id}`),
    onSuccess: () => {
      toast.success('העבודה נמחקה');
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ['business-jobs'] });
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message ?? 'שגיאה במחיקה');
      setDeleteTarget(null);
    },
  });

  // Deletable unless a driver is already assigned AND it's the job's day.
  const canDelete = (job: Job) =>
    ['OPEN', 'ACCEPTED', 'IN_PROGRESS'].includes(job.status) &&
    (!job.driverId || !isSameDay(new Date(job.scheduledAt), new Date()));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">העבודות שלי</h1>
          <p className="text-sm text-muted-foreground">נהל את כל העבודות לפי שלב</p>
        </div>
        <Button size="lg" className="gap-1.5 font-semibold" nativeButton={false} render={<Link href="/business/jobs/new" />}>
          <PlusCircle className="size-4" />פרסם עבודה
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {SECTIONS.map((s) => (
            <div key={s.label} className="space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-40" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {SECTIONS.map(({ label, statuses, emptyText }) => {
            const sectionJobs = (jobs ?? []).filter((j) => statuses.includes(j.status));
            return (
              <div key={label} className="space-y-3">
                <SectionHeader label={label} count={sectionJobs.length} />
                {sectionJobs.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 pl-1">{emptyText}</p>
                ) : (
                  <JobTable
                    jobs={sectionJobs}
                    showDriver
                    actions={(job) => (
                      <div className="flex items-center gap-2">
                        {['ACCEPTED', 'IN_PROGRESS'].includes(job.status) && (
                          <Button size="sm" variant="outline" onClick={() => completeMutation.mutate(job.id)}>
                            סמן כהושלם
                          </Button>
                        )}
                        {job.escrowStatus && job.escrowStatus !== 'NONE' && (
                          <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => setReceiptJobId(job.id)}>
                            <Receipt className="size-3.5" /> קבלה
                          </Button>
                        )}
                        {['OPEN', 'ACCEPTED', 'IN_PROGRESS'].includes(job.status) && (
                          <span
                            title={canDelete(job) ? undefined : 'לא ניתן למחוק עבודה משובצת ביום העבודה'}
                            className={cn('inline-block', !canDelete(job) && 'cursor-not-allowed')}
                          >
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              disabled={!canDelete(job)}
                              onClick={() => setDeleteTarget(job)}
                            >
                              מחק
                            </Button>
                          </span>
                        )}
                      </div>
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <DialogPortal>
          <DialogOverlay />
          <DialogContent className="max-w-sm">
            <DialogTitle>למחוק את העבודה?</DialogTitle>
            <DialogDescription className="mt-1">
              <span className="font-medium text-foreground">{deleteTarget?.title}</span>
              <br />
              {deleteTarget?.driverId
                ? 'לעבודה זו יש נהג מוקצה — הנהג יקבל התראה על הביטול.'
                : 'העבודה תוסר מרשימת ההצעות לנהגים.'}
            </DialogDescription>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>ביטול</Button>
              <Button
                variant="destructive"
                onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'מוחק…' : 'מחק עבודה'}
              </Button>
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>

      <ReceiptDialog jobId={receiptJobId} onClose={() => setReceiptJobId(null)} />
    </div>
  );
}
