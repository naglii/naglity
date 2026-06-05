import { cn } from '@/lib/utils';
import { ShieldCheck, BadgeCheck, Undo2 } from 'lucide-react';
import type { EscrowStatus } from '@/types/api';

const config: Record<Exclude<EscrowStatus, 'NONE'>, { label: string; className: string; icon: typeof ShieldCheck }> = {
  IN_ESCROW: { label: 'בנאמנות', className: 'bg-info-soft text-info', icon: ShieldCheck },
  RELEASED: { label: 'שולם לנהג', className: 'bg-success-soft text-success', icon: BadgeCheck },
  REFUNDED: { label: 'הוחזר', className: 'bg-muted text-muted-foreground', icon: Undo2 },
};

export function EscrowBadge({ status, className }: { status?: EscrowStatus; className?: string }) {
  if (!status || status === 'NONE') return null;
  const { label, className: tone, icon: Icon } = config[status];
  return (
    <span className={cn('inline-flex h-5 w-fit items-center gap-1 rounded-full px-2 text-[11px] font-semibold', tone, className)}>
      <Icon className="size-3" />
      {label}
    </span>
  );
}
