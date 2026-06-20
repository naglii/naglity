// Mirrors the web JobStatusBadge config (apps/web/components/jobs/JobStatusBadge.tsx).
// Colour language (consistent everywhere):
//   orange = waiting / approved (OPEN, ACCEPTED)
//   blue   = in motion / done-awaiting-payment (IN_PROGRESS, COMPLETED)
//   green  = settled (PAID)
//   red    = removed (DELETED)
import type { JobStatus } from '@/types/api';
import { colors } from './colors';

export const JOB_STATUS_CONFIG: Record<
  JobStatus,
  { label: string; bg: string; fg: string; dot: string; pulse?: boolean }
> = {
  OPEN: { label: 'פתוח', bg: colors.warningSoft, fg: colors.warning, dot: colors.warning },
  ACCEPTED: { label: 'שובץ נהג', bg: colors.warningSoft, fg: colors.warning, dot: colors.warning },
  IN_PROGRESS: { label: 'בביצוע', bg: colors.infoSoft, fg: colors.info, dot: colors.info, pulse: true },
  COMPLETED: { label: 'הושלם', bg: colors.infoSoft, fg: colors.info, dot: colors.info },
  PAID: { label: 'שולם', bg: colors.successSoft, fg: colors.success, dot: colors.success },
  DELETED: { label: 'מחוק', bg: colors.destructiveSoft, fg: colors.destructive, dot: colors.destructive },
};

// Offer status styling mirrors apps/web/app/(dashboard)/driver/offers/page.tsx
export const OFFER_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; fg: string; border: string }
> = {
  PENDING: { label: 'ממתין לתשובה', bg: colors.warningSoft, fg: colors.warning, border: colors.warning },
  ACCEPTED: { label: 'התקבלה', bg: colors.successSoft, fg: colors.success, border: colors.success },
  DECLINED: { label: 'לא נבחרה', bg: colors.muted, fg: colors.mutedForeground, border: colors.border },
  WITHDRAWN: { label: 'בוטלה', bg: colors.muted, fg: colors.mutedForeground, border: colors.border },
};
