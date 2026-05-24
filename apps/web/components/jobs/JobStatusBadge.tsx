import { Badge } from '@/components/ui/badge';
import type { JobStatus } from '@/types/api';

const config: Record<JobStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  OPEN: { label: 'פתוח', variant: 'default' },
  ACCEPTED: { label: 'מאושר', variant: 'secondary' },
  IN_PROGRESS: { label: 'בביצוע', variant: 'secondary' },
  COMPLETED: { label: 'הושלם', variant: 'outline' },
  PAID: { label: 'שולם', variant: 'outline' },
  DELETED: { label: 'מחוק', variant: 'destructive' },
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const { label, variant } = config[status];
  return <Badge variant={variant}>{label}</Badge>;
}
