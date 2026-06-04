import { cn } from '@/lib/utils';
import type { JobStatus } from '@/types/api';

// Colour language (consistent everywhere):
//   orange = waiting / approved (OPEN, ACCEPTED)
//   blue   = in motion / done-awaiting-payment (IN_PROGRESS, COMPLETED)
//   green  = settled (PAID)
//   red    = removed (DELETED)
const config: Record<JobStatus, { label: string; className: string; dot: string; pulse?: boolean }> = {
  OPEN:        { label: 'פתוח',  className: 'bg-warning-soft text-warning',         dot: 'bg-warning' },
  ACCEPTED:    { label: 'שובץ נהג', className: 'bg-warning-soft text-warning',       dot: 'bg-warning' },
  IN_PROGRESS: { label: 'בביצוע', className: 'bg-info-soft text-info',              dot: 'bg-info', pulse: true },
  COMPLETED:   { label: 'הושלם', className: 'bg-info-soft text-info',               dot: 'bg-info' },
  PAID:        { label: 'שולם',  className: 'bg-success-soft text-success',         dot: 'bg-success' },
  DELETED:     { label: 'מחוק',  className: 'bg-destructive/10 text-destructive',   dot: 'bg-destructive' },
};

export function JobStatusBadge({ status, className }: { status: JobStatus; className?: string }) {
  const { label, className: tone, dot, pulse } = config[status];
  return (
    <span
      className={cn(
        'inline-flex h-6 w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold',
        tone,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', dot, pulse && 'live-dot')} />
      {label}
    </span>
  );
}
