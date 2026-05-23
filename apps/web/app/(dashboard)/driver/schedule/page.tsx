'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { Job } from '@/types/api';
import { JobStatusBadge } from '@/components/jobs/JobStatusBadge';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Clock } from 'lucide-react';

export default function DriverSchedulePage() {
  const qc = useQueryClient();

  const { data: jobs, isLoading } = useQuery<Job[]>({
    queryKey: ['driver-jobs'],
    queryFn: () => api.get('/drivers/me/jobs').then((r) => r.data),
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => api.post(`/jobs/${id}/start`),
    onSuccess: () => { toast.success('Job started'); qc.invalidateQueries({ queryKey: ['driver-jobs'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Error'),
  });

  if (isLoading) {
    return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>;
  }

  if (!jobs?.length) {
    return <p className="text-muted-foreground py-16 text-center">No jobs in your schedule yet.</p>;
  }

  const active = jobs.filter((j) => ['ACCEPTED', 'IN_PROGRESS'].includes(j.status));
  const past = jobs.filter((j) => ['COMPLETED', 'PAID'].includes(j.status));

  const JobItem = ({ job }: { job: Job }) => (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-start justify-between">
        <CardTitle className="text-base">{job.title}</CardTitle>
        <JobStatusBadge status={job.status} />
      </CardHeader>
      <CardContent className="space-y-1.5 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="size-3.5" /> {job.fromLocation} → {job.toLocation}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="size-3.5" />
          {format(new Date(job.scheduledAt), 'dd/MM/yy HH:mm')} – {format(new Date(job.estimatedEndAt), 'HH:mm')}
        </div>
        <p className="font-semibold">{formatPrice(job.netPriceCents)} net</p>
        {job.status === 'ACCEPTED' && (
          <Button size="sm" className="mt-1" onClick={() => startMutation.mutate(job.id)}>
            Start Job
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {active.length > 0 && (
        <section>
          <h2 className="font-semibold mb-3">Active ({active.length})</h2>
          <div className="space-y-3">{active.map((j) => <JobItem key={j.id} job={j} />)}</div>
        </section>
      )}
      {past.length > 0 && (
        <section>
          <h2 className="font-semibold mb-3 text-muted-foreground">Completed / Paid ({past.length})</h2>
          <div className="space-y-3">{past.map((j) => <JobItem key={j.id} job={j} />)}</div>
        </section>
      )}
    </div>
  );
}
