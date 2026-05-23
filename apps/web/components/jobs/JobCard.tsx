'use client';

import { format, formatDistanceToNow } from 'date-fns';
import { MapPin, Clock, Banknote, Truck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice, formatDuration } from '@/lib/utils';
import type { Job } from '@/types/api';

interface Props {
  job: Job;
  onAccepted: (jobId: string) => void;
}

export function JobCard({ job, onAccepted }: Props) {
  return (
    <Card>
      <CardContent className="flex items-center gap-6 py-4">
        {/* Main info */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-base">{job.title}</span>
            <Badge variant="secondary" className="text-xs">
              <Truck className="size-3 mr-1" />{job.business?.name ?? '—'}
            </Badge>
            <span className="text-xs text-muted-foreground/70">
              {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
            </span>
          </div>

          {job.description && (
            <p className="text-sm text-muted-foreground truncate">{job.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0" />
              {job.fromLocation} → {job.toLocation}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5 shrink-0" />
              {format(new Date(job.scheduledAt), 'dd/MM HH:mm')} · {formatDuration(job.scheduledAt, job.estimatedEndAt)}
            </span>
          </div>
        </div>

        {/* Price + action */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="text-right">
            <p className="font-bold text-lg leading-none">{formatPrice(job.netPriceCents)}</p>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 justify-end">
              <Banknote className="size-3" />net payout
            </p>
          </div>
          <Button size="sm" onClick={() => onAccepted(job.id)}>Accept</Button>
        </div>
      </CardContent>
    </Card>
  );
}
