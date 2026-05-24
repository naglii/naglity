'use client';

import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { MapPin, Clock, Banknote, Truck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogTrigger, DialogPortal, DialogOverlay,
  DialogContent, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { formatPrice, formatDuration } from '@/lib/utils';
import type { Job } from '@/types/api';

interface Props {
  job: Job;
  onAccepted: (jobId: string) => void;
}

export function JobCard({ job, onAccepted }: Props) {
  const [open, setOpen] = useState(false);

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
              {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true, locale: he })}
            </span>
          </div>

          {job.description && (
            <p className="text-sm text-muted-foreground truncate">{job.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0" />
              <bdi>{job.fromLocation}</bdi> ← <bdi>{job.toLocation}</bdi>
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
              <Banknote className="size-3" />תשלום נטו
            </p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button size="sm">קבל עבודה</Button>} />
            <DialogPortal>
              <DialogOverlay />
              <DialogContent className="max-w-sm">
                <DialogTitle>לקבל את העבודה?</DialogTitle>
                <DialogDescription className="mt-1">
                  <span className="font-medium text-foreground">{job.title}</span>
                  <br />
                  <bdi>{job.fromLocation}</bdi> ← <bdi>{job.toLocation}</bdi>
                  <br />
                  {format(new Date(job.scheduledAt), 'dd/MM/yyyy HH:mm')} · {formatPrice(job.netPriceCents)} נטו
                </DialogDescription>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setOpen(false)}>ביטול</Button>
                  <Button onClick={() => { setOpen(false); onAccepted(job.id); }}>אישור</Button>
                </div>
              </DialogContent>
            </DialogPortal>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
