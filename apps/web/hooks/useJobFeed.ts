'use client';

import { useState, useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import type { Job } from '@/types/api';

export function useJobFeed(initialJobs: Job[], socketRef: React.RefObject<Socket | null>) {
  const [socketAdded, setSocketAdded] = useState<Job[]>([]);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  const removeJob = (jobId: string) =>
    setRemovedIds((prev) => new Set([...prev, jobId]));

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const onNew = ({ job }: { job: Job }) =>
      setSocketAdded((prev) => [job, ...prev]);
    const onAccepted = ({ jobId }: { jobId: string }) => removeJob(jobId);

    socket.on('job:new', onNew);
    socket.on('job:accepted', onAccepted);

    return () => {
      socket.off('job:new', onNew);
      socket.off('job:accepted', onAccepted);
    };
  }, [socketRef]);

  const socketAddedIds = new Set(socketAdded.map((j) => j.id));
  const jobs = [
    ...socketAdded,
    ...initialJobs.filter((j) => !removedIds.has(j.id) && !socketAddedIds.has(j.id)),
  ].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  return { jobs, removeJob };
}
