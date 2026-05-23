'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import api from '@/lib/api';
import type { Job } from '@/types/api';
import { JobStatusBadge } from '@/components/jobs/JobStatusBadge';
import { formatPrice, formatDuration } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Clock } from 'lucide-react';

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{label}</h2>
      <Badge variant="secondary" className="rounded-full px-2 py-0 text-xs">{count}</Badge>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

function JobItem({ job }: { job: Job }) {
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-start justify-between">
        <CardTitle className="text-base">{job.title}</CardTitle>
        <JobStatusBadge status={job.status} />
      </CardHeader>
      <CardContent className="space-y-1.5 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          {job.fromLocation} → {job.toLocation}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="size-3.5 shrink-0" />
          {format(new Date(job.scheduledAt), 'dd/MM/yy HH:mm')} · {formatDuration(job.scheduledAt, job.estimatedEndAt)}
        </div>
        <p className="font-semibold">
          {formatPrice(job.netPriceCents)}{' '}
          <span className="text-xs font-normal text-muted-foreground">net</span>
        </p>
      </CardContent>
    </Card>
  );
}

export default function DriverHistoryPage() {
  const { data: jobs, isLoading } = useQuery<Job[]>({
    queryKey: ['driver-jobs'],
    queryFn: () => api.get('/drivers/me/jobs').then((r) => r.data),
  });

  if (isLoading) {
    return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>;
  }

  const completed = (jobs ?? []).filter((j) => j.status === 'COMPLETED');
  const paid = (jobs ?? []).filter((j) => j.status === 'PAID');

  if (completed.length === 0 && paid.length === 0) {
    return <p className="text-muted-foreground py-16 text-center">No completed jobs yet.</p>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">History</h1>

      {completed.length > 0 && (
        <div className="space-y-3">
          <SectionHeader label="Completed" count={completed.length} />
          {completed.map((j) => <JobItem key={j.id} job={j} />)}
        </div>
      )}

      {paid.length > 0 && (
        <div className="space-y-3">
          <SectionHeader label="Paid" count={paid.length} />
          {paid.map((j) => <JobItem key={j.id} job={j} />)}
        </div>
      )}
    </div>
  );
}
