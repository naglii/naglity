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
    return <p className="text-sm text-muted-foreground py-8 text-center">לא נמצאו עבודות.</p>;
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>כותרת</TableHead>
            {showBusiness && <TableHead>עסק</TableHead>}
            {showDriver && <TableHead>נהג</TableHead>}
            <TableHead>מוצא ← יעד</TableHead>
            <TableHead>מתוכנן</TableHead>
            <TableHead>סטטוס</TableHead>
            <TableHead className="text-left">מחיר</TableHead>
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
                <bdi>{job.fromLocation}</bdi> ← <bdi>{job.toLocation}</bdi>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {format(new Date(job.scheduledAt), 'dd/MM/yy HH:mm')}
              </TableCell>
              <TableCell><JobStatusBadge status={job.status} /></TableCell>
              <TableCell className="text-left font-medium">
                {formatPrice(job.grossPriceCents)}
              </TableCell>
              {actions && <TableCell className="text-left">{actions(job)}</TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
