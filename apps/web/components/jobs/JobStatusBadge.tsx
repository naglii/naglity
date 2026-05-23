import { Badge } from '@/components/ui/badge';
import type { JobStatus } from '@/types/api';

const config: Record<JobStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  OPEN: { label: 'Open', variant: 'default' },
  ACCEPTED: { label: 'Accepted', variant: 'secondary' },
  IN_PROGRESS: { label: 'In Progress', variant: 'secondary' },
  COMPLETED: { label: 'Completed', variant: 'outline' },
  PAID: { label: 'Paid', variant: 'outline' },
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const { label, variant } = config[status];
  return <Badge variant={variant}>{label}</Badge>;
}
