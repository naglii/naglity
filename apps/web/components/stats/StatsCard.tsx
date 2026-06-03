import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

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
}

export function StatsCard({ title, value, sub, icon: Icon, tone = 'brand' }: Props) {
  return (
    <Card className="p-0">
      <CardContent className="flex items-center gap-4 p-4">
        {Icon && (
          <span className={cn('icon-chip size-11 shrink-0', toneClasses[tone])}>
            <Icon className="size-5" />
          </span>
        )}
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p className="mt-0.5 text-2xl font-bold leading-tight truncate">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
