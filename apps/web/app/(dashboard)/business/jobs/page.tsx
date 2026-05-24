'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isSameDay } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';
import api from '@/lib/api';
import type { Job, JobStatus } from '@/types/api';
import { JobTable } from '@/components/jobs/JobTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle } from 'lucide-react';
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
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{label}</h2>
      <Badge variant="secondary" className="rounded-full px-2 py-0 text-xs">{count}</Badge>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

export default function BusinessJobsPage() {
  const qc = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null);

  const { data: jobs, isLoading } = useQuery<Job[]>({
    queryKey: ['business-jobs'],
    queryFn: () => api.get('/businesses/me/jobs').then((r) => r.data),
  });

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

  const canDelete = (job: Job) =>
    ['OPEN', 'ACCEPTED', 'IN_PROGRESS'].includes(job.status) &&
    !isSameDay(new Date(job.scheduledAt), new Date());

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">העבודות שלי</h1>
        <Button size="sm" nativeButton={false} render={<Link href="/business/jobs/new" />}>
          <PlusCircle className="size-4 ml-2" />פרסם עבודה
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
                        {canDelete(job) && (
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(job)}>
                            מחק
                          </Button>
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
    </div>
  );
}
