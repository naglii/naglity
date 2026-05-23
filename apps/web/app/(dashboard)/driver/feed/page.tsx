'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { Job } from '@/types/api';
import { initSocket } from '@/hooks/useSocket';
import { JobCard } from '@/components/jobs/JobCard';
import { Skeleton } from '@/components/ui/skeleton';

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
      toast.success('Job accepted!');
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Could not accept job');
      // Refetch to restore the job if the accept failed
      qc.invalidateQueries({ queryKey: FEED_KEY });
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-52 rounded-xl" />
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-xl font-semibold">No open jobs right now</p>
        <p className="text-muted-foreground text-sm mt-1">New jobs will appear here in real time</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Available Jobs ({jobs.length})</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} onAccepted={handleAccept} />
        ))}
      </div>
    </div>
  );
}
