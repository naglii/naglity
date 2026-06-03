import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

type Tone = 'brand' | 'success' | 'warning' | 'info' | 'muted';

const pillTone: Record<Tone, string> = {
  brand: 'bg-brand-soft text-brand-strong',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  info: 'bg-info-soft text-info',
  muted: 'bg-muted text-muted-foreground',
};

export function HeroPill({
  icon: Icon,
  tone = 'muted',
  children,
}: {
  icon?: LucideIcon;
  tone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold', pillTone[tone])}>
      {Icon && <Icon className="size-3.5" />}
      {children}
    </span>
  );
}

interface Props {
  icon: LucideIcon;
  label: React.ReactNode;
  amount: string;
  children?: React.ReactNode;
}

/** Light "statement" hero — white card with a soft brand wash and a brand-toned figure. */
export function StatHero({ icon: Icon, label, amount, children }: Props) {
  return (
    <Card className="relative overflow-hidden p-0">
      {/* soft brand wash + glow, kept subtle */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-bl from-brand-soft/70 via-transparent to-transparent" />
      <div className="pointer-events-none absolute -top-20 -end-12 size-48 rounded-full bg-brand/10 blur-3xl" />
      <CardContent className="relative p-6">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <span className="icon-chip size-7 bg-brand-soft text-brand-strong">
            <Icon className="size-4" />
          </span>
          {label}
        </div>
        <p className="mt-2 text-4xl font-black tracking-tight text-brand-strong">{amount}</p>
        {children && <div className="mt-4 flex flex-wrap gap-2">{children}</div>}
      </CardContent>
    </Card>
  );
}
