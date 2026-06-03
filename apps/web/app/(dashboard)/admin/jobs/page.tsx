'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { Job, JobStatus } from '@/types/api';
import { JobTable } from '@/components/jobs/JobTable';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const SECTIONS: { label: string; statuses: JobStatus[]; emptyText: string }[] = [
  {
    label: 'פתוח',
    statuses: ['OPEN'],
    emptyText: 'אין עבודות פתוחות.',
  },
  {
    label: 'פעיל',
    statuses: ['ACCEPTED', 'IN_PROGRESS'],
    emptyText: 'אין עבודות בביצוע.',
  },
  {
    label: 'ממתין לתשלום',
    statuses: ['COMPLETED'],
    emptyText: 'אין עבודות הממתינות לתשלום.',
  },
  {
    label: 'שולם',
    statuses: ['PAID'],
    emptyText: 'אין עבודות ששולמו עדיין.',
  },
  {
    label: 'מחוק',
    statuses: ['DELETED'],
    emptyText: 'אין עבודות שנמחקו.',
  },
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

export default function AdminJobsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<Job[]>({
    queryKey: ['admin-jobs'],
    queryFn: () => api.get('/admin/jobs').then((r) => r.data),
  });

  const paidMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/jobs/${id}/paid`),
    onSuccess: () => {
      toast.success('העבודה סומנה כשולמה');
      qc.invalidateQueries({ queryKey: ['admin-jobs'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'שגיאה'),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold">כל העבודות</h1>
        <p className="text-sm text-muted-foreground">סקירת כל העבודות בפלטפורמה לפי שלב</p>
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
            const sectionJobs = (data ?? []).filter((j) => statuses.includes(j.status));
            return (
              <div key={label} className="space-y-3">
                <SectionHeader label={label} count={sectionJobs.length} />
                {sectionJobs.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 pl-1">{emptyText}</p>
                ) : (
                  <JobTable
                    jobs={sectionJobs}
                    showBusiness
                    showDriver
                    actions={(job) =>
                      job.status === 'COMPLETED' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => paidMutation.mutate(job.id)}
                        >
                          סמן כשולם
                        </Button>
                      ) : null
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
