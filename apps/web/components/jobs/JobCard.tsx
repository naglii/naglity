'use client';

import { format, formatDistanceToNow } from 'date-fns';
import { MapPin, Clock, Banknote, Truck } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{job.title}</CardTitle>
          <Badge variant="secondary" className="shrink-0">
            <Truck className="size-3 mr-1" />
            {job.business?.name ?? '—'}
          </Badge>
        </div>
        {job.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
        )}
        <p className="text-xs text-muted-foreground/70">
          {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
        </p>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">{job.fromLocation} → {job.toLocation}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="size-3.5 shrink-0" />
          <span>
            {format(new Date(job.scheduledAt), 'dd/MM HH:mm')} · {formatDuration(job.scheduledAt, job.estimatedEndAt)}
          </span>
        </div>
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <Banknote className="size-3.5 shrink-0" />
          <span>{formatPrice(job.netPriceCents)}</span>
          <span className="text-xs text-muted-foreground font-normal">net payout</span>
        </div>
      </CardContent>
      <CardFooter className="mt-auto pt-0">
        <Button className="w-full" onClick={() => onAccepted(job.id)}>Accept Job</Button>
      </CardFooter>
    </Card>
  );
}
