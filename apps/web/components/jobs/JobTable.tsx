'use client';

import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { JobStatusBadge } from './JobStatusBadge';
import { formatPrice } from '@/lib/utils';
import type { Job } from '@/types/api';

interface Props {
  jobs: Job[];
  showBusiness?: boolean;
  showDriver?: boolean;
  actions?: (job: Job) => React.ReactNode;
}

export function JobTable({ jobs, showBusiness, showDriver, actions }: Props) {
  if (jobs.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No jobs found.</p>;
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            {showBusiness && <TableHead>Business</TableHead>}
            {showDriver && <TableHead>Driver</TableHead>}
            <TableHead>From → To</TableHead>
            <TableHead>Scheduled</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Price</TableHead>
            {actions && <TableHead />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell className="font-medium">{job.title}</TableCell>
              {showBusiness && <TableCell>{job.business?.name ?? '—'}</TableCell>}
              {showDriver && (
                <TableCell>
                  {job.driver ? (
                    <div>
                      <p>{job.driver.name}</p>
                      {job.driver.phone && (
                        <p className="text-xs text-muted-foreground">{job.driver.phone}</p>
                      )}
                    </div>
                  ) : '—'}
                </TableCell>
              )}
              <TableCell className="text-sm text-muted-foreground">
                {job.fromLocation} → {job.toLocation}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {format(new Date(job.scheduledAt), 'dd/MM/yy HH:mm')}
              </TableCell>
              <TableCell><JobStatusBadge status={job.status} /></TableCell>
              <TableCell className="text-right font-medium">
                {formatPrice(job.grossPriceCents)}
              </TableCell>
              {actions && <TableCell className="text-right">{actions(job)}</TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
