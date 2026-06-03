'use client';

import { useState } from 'react';
import { format, formatDistanceToNow, differenceInMinutes } from 'date-fns';
import { he } from 'date-fns/locale';
import { Clock, CalendarClock, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

/** Vertical from → to route, delivery-app style. */
function Route({ from, to }: { from: string; to: string }) {
  return (
    <div className="relative ps-5">
      {/* connecting line */}
      <span className="absolute start-[5px] top-2 bottom-2 w-px bg-border" />
      <div className="relative space-y-2.5">
        <div className="flex items-center gap-2">
          <span className="absolute -start-5 size-2.5 rounded-full bg-success ring-4 ring-success-soft" />
          <bdi className="text-sm font-medium text-foreground">{from}</bdi>
        </div>
        <div className="flex items-center gap-2">
          <span className="absolute -start-5 size-2.5 rounded-full bg-brand-strong ring-4 ring-brand-soft" />
          <bdi className="text-sm font-medium text-foreground">{to}</bdi>
        </div>
      </div>
    </div>
  );
}

export function JobCard({ job, onAccepted }: Props) {
  const [open, setOpen] = useState(false);

  const isNew = differenceInMinutes(new Date(), new Date(job.createdAt)) < 3;
  const bizName = job.business?.name ?? '—';
  const bizInitial = bizName.trim().charAt(0) || '?';

  return (
    <Card className="card-interactive overflow-hidden p-0">
      <CardContent className="p-0">
        {/* ── Header ── */}
        <div className="flex items-start gap-3 p-4 pb-3">
          <span className="bg-brand-gradient grid size-10 shrink-0 place-items-center rounded-xl text-base font-bold text-white shadow-sm shadow-brand/30 select-none">
            {bizInitial}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-semibold text-[15px] leading-tight">{job.title}</h3>
              {isNew && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-bold text-success">
                  <span className="live-dot size-1.5 rounded-full bg-success" />
                  חדש
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {bizName} · {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true, locale: he })}
            </p>
          </div>

          {/* scheduled time pill */}
          <div className="flex shrink-0 flex-col items-center rounded-xl bg-accent px-3 py-1.5 text-center">
            <CalendarClock className="size-3.5 text-brand-strong" />
            <span className="mt-0.5 text-xs font-semibold leading-none">
              {format(new Date(job.scheduledAt), 'dd/MM')}
            </span>
            <span className="text-[11px] text-muted-foreground leading-none mt-0.5">
              {format(new Date(job.scheduledAt), 'HH:mm')}
            </span>
          </div>
        </div>

        {/* ── Route + meta ── */}
        <div className="space-y-3 px-4">
          <Route from={job.fromLocation} to={job.toLocation} />

          {job.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">{job.description}</p>
          )}

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            משך משוער · {formatDuration(job.scheduledAt, job.estimatedEndAt)}
          </div>
        </div>

        {/* ── Action bar ── */}
        <div className="mt-3 flex items-center justify-between gap-3 border-t bg-muted/40 px-4 py-3">
          <div>
            <p className="text-lg font-bold leading-none text-foreground">{formatPrice(job.netPriceCents)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">תשלום נטו אליך</p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={
              <Button size="lg" className="gap-1.5 px-5 font-semibold">
                קבל עבודה
                <ArrowLeft className="size-4" />
              </Button>
            } />
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
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>ביטול</Button>
                  <Button onClick={() => { setOpen(false); onAccepted(job.id); }}>אישור וקבלה</Button>
                </div>
              </DialogContent>
            </DialogPortal>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
