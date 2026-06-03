'use client';

import { useState } from 'react';
import { format, formatDistanceToNow, differenceInMinutes } from 'date-fns';
import { he } from 'date-fns/locale';
import { CalendarClock, Banknote, ArrowLeft, Timer } from 'lucide-react';
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

export function JobCard({ job, onAccepted }: Props) {
  const [open, setOpen] = useState(false);

  const scheduled = new Date(job.scheduledAt);
  const isNew = differenceInMinutes(new Date(), new Date(job.createdAt)) < 3;
  const bizName = job.business?.name ?? '—';
  const bizInitial = bizName.trim().charAt(0) || '?';

  return (
    <Card className="card-interactive overflow-hidden p-0">
      <CardContent className="p-0">
        {/* ── Header with soft brand wash ── */}
        <div className="relative bg-gradient-to-bl from-brand-soft/70 to-transparent p-4 pb-3">
          {isNew && (
            <span className="absolute end-4 top-4 inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-bold text-success">
              <span className="live-dot size-1.5 rounded-full bg-success" />
              חדש
            </span>
          )}
          <div className="flex items-center gap-3 pe-12">
            <span className="bg-brand-gradient grid size-11 shrink-0 place-items-center rounded-2xl text-base font-bold text-white shadow-sm shadow-brand/30 select-none">
              {bizInitial}
            </span>
            <div className="min-w-0">
              <h3 className="truncate font-bold text-[15px] leading-tight">{job.title}</h3>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {bizName} · {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true, locale: he })}
              </p>
            </div>
          </div>
        </div>

        {/* ── Feature tiles: when + payout ── */}
        <div className="grid grid-cols-2 gap-3 px-4">
          <div className="rounded-xl bg-accent p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <CalendarClock className="size-3.5 text-brand-strong" />
              מועד עבודה
            </div>
            <p className="mt-1.5 text-2xl font-black leading-none tracking-tight">{format(scheduled, 'HH:mm')}</p>
            <p className="mt-1.5 truncate text-xs font-medium text-foreground/80">
              {format(scheduled, 'EEEE, d בMMM', { locale: he })}
            </p>
          </div>

          <div className="rounded-xl bg-success-soft/50 p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-success">
              <Banknote className="size-3.5" />
              תשלום נטו
            </div>
            <p className="mt-1.5 text-2xl font-black leading-none tracking-tight">{formatPrice(job.netPriceCents)}</p>
            <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
              <Timer className="size-3" />
              {formatDuration(job.scheduledAt, job.estimatedEndAt)} משך
            </p>
          </div>
        </div>

        {/* ── Horizontal route ── */}
        <div className="px-4 pt-3">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm font-medium">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-success" />
              <bdi>{job.fromLocation}</bdi>
            </span>
            <ArrowLeft className="size-4 shrink-0 text-muted-foreground/60" />
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-brand-strong" />
              <bdi>{job.toLocation}</bdi>
            </span>
          </div>

          {job.description && (
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{job.description}</p>
          )}
        </div>

        {/* ── Full-width accept ── */}
        <div className="p-4 pt-3.5">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={
              <Button size="lg" className="w-full gap-1.5 font-semibold">
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
                  {format(scheduled, 'dd/MM/yyyy HH:mm')} · {formatPrice(job.netPriceCents)} נטו
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
