'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Link from 'next/link';
import api from '@/lib/api';
import type { Job, JobStatus } from '@/types/api';
import { JobTable } from '@/components/jobs/JobTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle } from 'lucide-react';

const SECTIONS: { label: string; statuses: JobStatus[]; emptyText: string }[] = [
  {
    label: 'פתוח',
    statuses: ['OPEN'],
    emptyText: 'אין עבודות פתוחות — פרסם עבודה כדי להתחיל.',
  },
  {
    label: 'פעיל',
    statuses: ['ACCEPTED', 'IN_PROGRESS'],
    emptyText: 'אין עבודות בביצוע כרגע.',
  },
  {
    label: 'הושלם',
    statuses: ['COMPLETED'],
    emptyText: 'אין עבודות שהושלמו עדיין.',
  },
  {
    label: 'שולם',
    statuses: ['PAID'],
    emptyText: 'אין עבודות ששולמו עדיין.',
  },
];

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </h2>
      <Badge variant="secondary" className="rounded-full px-2 py-0 text-xs">
        {count}
      </Badge>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

export default function BusinessJobsPage() {
  const qc = useQueryClient();

  const { data: jobs, isLoading } = useQuery<Job[]>({
    queryKey: ['business-jobs'],
    queryFn: () => api.get('/businesses/me/jobs').then((r) => r.data),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => api.post(`/jobs/${id}/complete`),
    onSuccess: () => {
      toast.success('העבודה סומנה כהושלמה');
      qc.invalidateQueries({ queryKey: ['business-jobs'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'שגיאה'),
  });

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
                    actions={(job) =>
                      ['ACCEPTED', 'IN_PROGRESS'].includes(job.status) ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => completeMutation.mutate(job.id)}
                        >
                          סמן כהושלם
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
