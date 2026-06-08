'use client';

import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { JobStatusBadge } from './JobStatusBadge';
import { EscrowBadge } from './EscrowBadge';
import { formatPrice } from '@/lib/utils';
import { MapPin } from 'lucide-react';
import type { Job } from '@/types/api';

interface Props {
  jobs: Job[];
  showBusiness?: boolean;
  showDriver?: boolean;
  actions?: (job: Job) => React.ReactNode;
}

function Avatar({ name }: { name: string }) {
  return (
    <span className="bg-brand-gradient grid size-7 shrink-0 place-items-center rounded-lg text-[11px] font-bold text-white select-none">
      {name.trim().charAt(0) || '?'}
    </span>
  );
}

export function JobTable({ jobs, showBusiness, showDriver, actions }: Props) {
  if (jobs.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">לא נמצאו עבודות.</p>;
  }

  return (
    <div className="rounded-xl border bg-card overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="font-semibold">כותרת</TableHead>
            {showBusiness && <TableHead className="font-semibold">עסק</TableHead>}
            {showDriver && <TableHead className="font-semibold">נהג</TableHead>}
            <TableHead className="font-semibold">מוצא ← יעד</TableHead>
            <TableHead className="font-semibold">מתוכנן</TableHead>
            <TableHead className="font-semibold">סטטוס</TableHead>
            <TableHead className="text-left font-semibold">מחיר</TableHead>
            {actions && <TableHead />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id} className="transition-colors hover:bg-accent/40">
              <TableCell className="font-medium">{job.title}</TableCell>
              {showBusiness && (
                <TableCell>
                  {job.business ? (
                    <span className="flex items-center gap-2">
                      <Avatar name={job.business.name} />
                      {job.business.name}
                    </span>
                  ) : '—'}
                </TableCell>
              )}
              {showDriver && (
                <TableCell>
                  {job.driver ? (
                    <span className="flex items-center gap-2">
                      <Avatar name={job.driver.name} />
                      <span>
                        <span className="block leading-tight">{job.driver.name}</span>
                        {job.driver.phone && (
                          <span className="block text-xs text-muted-foreground leading-tight">{job.driver.phone}</span>
                        )}
                      </span>
                    </span>
                  ) : <span className="text-muted-foreground">—</span>}
                </TableCell>
              )}
              <TableCell className="text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 shrink-0 text-brand-strong" />
                  <bdi>{job.fromLocation}</bdi>
                  <span className="text-muted-foreground/50">←</span>
                  <bdi>{job.toLocation}</bdi>
                </span>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {format(new Date(job.scheduledAt), 'dd/MM/yy HH:mm')}
              </TableCell>
              <TableCell>
                <div className="flex flex-col items-start gap-1">
                  <JobStatusBadge status={job.status} />
                  <EscrowBadge status={job.escrowStatus} />
                </div>
              </TableCell>
              <TableCell className="text-left font-semibold whitespace-nowrap">
                {job.pricingMode === 'OFFERS' && job.grossPriceCents === 0
                  ? <span className="font-normal text-muted-foreground">לפי הצעה</span>
                  : formatPrice(job.grossPriceCents)}
              </TableCell>
              {actions && <TableCell className="text-left">{actions(job)}</TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
