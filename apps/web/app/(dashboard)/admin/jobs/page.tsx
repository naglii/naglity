'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { Job, JobStatus } from '@/types/api';
import { JobTable } from '@/components/jobs/JobTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const SECTIONS: { label: string; statuses: JobStatus[]; emptyText: string }[] = [
  {
    label: 'Open',
    statuses: ['OPEN'],
    emptyText: 'No open jobs.',
  },
  {
    label: 'Active',
    statuses: ['ACCEPTED', 'IN_PROGRESS'],
    emptyText: 'No jobs in progress.',
  },
  {
    label: 'Awaiting Payment',
    statuses: ['COMPLETED'],
    emptyText: 'No jobs awaiting payment.',
  },
  {
    label: 'Paid',
    statuses: ['PAID'],
    emptyText: 'No paid jobs yet.',
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

export default function AdminJobsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<Job[]>({
    queryKey: ['admin-jobs'],
    queryFn: () => api.get('/admin/jobs').then((r) => r.data),
  });

  const paidMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/jobs/${id}/paid`),
    onSuccess: () => {
      toast.success('Job marked as paid');
      qc.invalidateQueries({ queryKey: ['admin-jobs'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Error'),
  });

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">All Jobs</h1>

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
                          Mark Paid
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
