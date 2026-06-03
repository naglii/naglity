import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ChevronLeft, type LucideIcon } from 'lucide-react';

type Tone = 'brand' | 'success' | 'info' | 'warning';

const toneClasses: Record<Tone, string> = {
  brand: 'bg-brand-soft text-brand-strong',
  success: 'bg-success-soft text-success',
  info: 'bg-info-soft text-info',
  warning: 'bg-warning-soft text-warning',
};

interface Props {
  title: string;
  value: string | number;
  sub?: string;
  icon?: LucideIcon;
  tone?: Tone;
  /** When set, the card becomes a clickable link with a hover lift + arrow. */
  href?: string;
}

export function StatsCard({ title, value, sub, icon: Icon, tone = 'brand', href }: Props) {
  const inner = (
    <CardContent className="flex items-center gap-4 p-4">
      {Icon && (
        <span className={cn('icon-chip size-11 shrink-0', toneClasses[tone])}>
          <Icon className="size-5" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <p className="mt-0.5 text-2xl font-bold leading-tight truncate">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </div>
      {href && (
        <ChevronLeft className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-1" />
      )}
    </CardContent>
  );

  if (href) {
    return (
      <Card className="card-interactive group p-0">
        <Link href={href} className="block">{inner}</Link>
      </Card>
    );
  }

  return <Card className="p-0">{inner}</Card>;
}
