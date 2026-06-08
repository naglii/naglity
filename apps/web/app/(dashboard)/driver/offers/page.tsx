'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import api from '@/lib/api';
import type { JobOffer } from '@/types/api';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/utils';
import { HandCoins, MapPin } from 'lucide-react';

const STATUS_META: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'ממתין', cls: 'bg-warning-soft text-warning' },
  ACCEPTED: { label: 'התקבל', cls: 'bg-success-soft text-success' },
  DECLINED: { label: 'לא נבחר', cls: 'bg-muted text-muted-foreground' },
  WITHDRAWN: { label: 'בוטל', cls: 'bg-muted text-muted-foreground' },
};

export default function DriverOffersPage() {
  const { data: offers = [], isLoading } = useQuery<JobOffer[]>({
    queryKey: ['my-offers'],
    queryFn: () => api.get('/jobs/my-offers').then((r) => r.data),
  });

  if (isLoading) {
    return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>;
  }

  if (offers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <span className="icon-chip size-16 bg-accent text-brand-strong"><HandCoins className="size-7" /></span>
        <p className="mt-4 text-xl font-semibold">לא שלחת הצעות עדיין</p>
        <p className="mt-1 text-sm text-muted-foreground">הצעות שתגיש על עבודות "פתוחות להצעות" יופיעו כאן</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">ההצעות שלי</h1>
        <p className="text-sm text-muted-foreground">{offers.length} הצעות</p>
      </div>
      <div className="space-y-3">
        {offers.map((o) => {
          const m = STATUS_META[o.status] ?? STATUS_META.PENDING;
          return (
            <Card key={o.id} className="p-0">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold">{o.job?.title}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${m.cls}`}>{m.label}</span>
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                    <MapPin className="size-3.5 text-brand-strong" />
                    <bdi>{o.job?.fromLocation}</bdi><span className="text-muted-foreground/50">←</span><bdi>{o.job?.toLocation}</bdi>
                  </p>
                  {o.job?.scheduledAt && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{format(new Date(o.job.scheduledAt), 'EEEE, d בMMM HH:mm', { locale: he })}</p>
                  )}
                </div>
                <div className="text-end">
                  <p className="text-lg font-bold text-brand-strong">{formatPrice(o.amountCents)}</p>
                  {o.etaMinutes != null && <p className="text-xs text-muted-foreground">הגעה ~{o.etaMinutes} דק׳</p>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
