'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { Job } from '@/types/api';
import { initSocket } from '@/hooks/useSocket';
import { JobCard } from '@/components/jobs/JobCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Truck, Radio } from 'lucide-react';

const FEED_KEY = ['driver-feed'];

const bySchedule = (a: Job, b: Job) =>
  new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();

export default function DriverFeedPage() {
  const qc = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: FEED_KEY,
    queryFn: () => api.get('/drivers/me/feed').then((r) => r.data),
  });

  useEffect(() => {
    const socket = initSocket();

    const onNew = ({ job }: { job: Job }) =>
      qc.setQueryData<Job[]>(FEED_KEY, (old = []) =>
        [...old, job].sort(bySchedule),
      );

    const onAccepted = ({ jobId }: { jobId: string }) =>
      qc.setQueryData<Job[]>(FEED_KEY, (old = []) =>
        old.filter((j) => j.id !== jobId),
      );

    socket.on('job:new', onNew);
    socket.on('job:accepted', onAccepted);

    return () => {
      socket.off('job:new', onNew);
      socket.off('job:accepted', onAccepted);
    };
  }, [qc]);

  const handleAccept = async (jobId: string) => {
    // Remove immediately — don't wait for the network round-trip
    qc.setQueryData<Job[]>(FEED_KEY, (old = []) => old.filter((j) => j.id !== jobId));
    try {
      await api.post(`/jobs/${jobId}/accept`);
      toast.success('העבודה התקבלה!');
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'לא ניתן לקבל את העבודה');
      // Refetch to restore the job if the accept failed
      qc.invalidateQueries({ queryKey: FEED_KEY });
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-52 rounded-xl" />
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <span className="icon-chip size-16 bg-accent text-brand-strong">
          <Truck className="size-7" />
        </span>
        <p className="mt-4 text-xl font-semibold">אין עבודות פתוחות כרגע</p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Radio className="size-3.5 live-dot" />
          עבודות חדשות יופיעו כאן בזמן אמת
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">עבודות זמינות</h1>
          <p className="text-sm text-muted-foreground">בחר עבודה וקבל אותה בלחיצה אחת</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-sm font-semibold text-success">
          <span className="live-dot size-2 rounded-full bg-success" />
          {jobs.length} פתוחות
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} onAccepted={handleAccept} />
        ))}
      </div>
    </div>
  );
}
