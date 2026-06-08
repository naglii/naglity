'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth } from 'date-fns';
import { he } from 'date-fns/locale';
import api from '@/lib/api';
import type { JobOffer } from '@/types/api';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice, netCents, cn } from '@/lib/utils';
import { HandCoins, MapPin, CalendarClock, Clock } from 'lucide-react';

const STATUS: Record<string, { label: string; chip: string; border: string }> = {
  PENDING: { label: 'ממתין לתשובה', chip: 'bg-warning-soft text-warning', border: 'border-warning' },
  ACCEPTED: { label: 'התקבלה', chip: 'bg-success-soft text-success', border: 'border-success' },
  DECLINED: { label: 'לא נבחרה', chip: 'bg-muted text-muted-foreground', border: 'border-border' },
  WITHDRAWN: { label: 'בוטלה', chip: 'bg-muted text-muted-foreground', border: 'border-border' },
};

const monthKey = (iso: string) => format(startOfMonth(new Date(iso)), 'yyyy-MM');

export default function DriverOffersPage() {
  const [month, setMonth] = useState('all');

  const { data: offers = [], isLoading } = useQuery<JobOffer[]>({
    queryKey: ['my-offers'],
    queryFn: () => api.get('/jobs/my-offers').then((r) => r.data),
  });

  const withDate = useMemo(() => offers.filter((o) => o.job?.scheduledAt), [offers]);

  // Months that actually have offers (chips), oldest → newest.
  const months = useMemo(() => {
    const map = new Map<string, Date>();
    for (const o of withDate) map.set(monthKey(o.job!.scheduledAt), startOfMonth(new Date(o.job!.scheduledAt)));
    return Array.from(map.entries())
      .map(([key, date]) => ({ key, date }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [withDate]);

  // Filter by month, then order by the closest scheduled date first.
  const filtered = useMemo(() => {
    const list = month === 'all' ? withDate : withDate.filter((o) => monthKey(o.job!.scheduledAt) === month);
    return [...list].sort((a, b) => new Date(a.job!.scheduledAt).getTime() - new Date(b.job!.scheduledAt).getTime());
  }, [withDate, month]);

  if (isLoading) {
    return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>;
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">ההצעות שלי</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} הצעות · לפי תאריך העבודה</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-soft px-3 py-1 text-sm font-semibold text-warning">
          {withDate.filter((o) => o.status === 'PENDING').length} ממתינות
        </span>
      </div>

      {/* ── Month filter chips ── */}
      {months.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setMonth('all')}
            className={cn('rounded-full px-3 py-1 text-xs font-semibold transition-colors', month === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent')}
          >
            הכל
          </button>
          {months.map(({ key, date }) => (
            <button
              key={key}
              onClick={() => setMonth(key)}
              className={cn('rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors', month === key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent')}
            >
              {format(date, 'MMMM yyyy', { locale: he })}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">אין הצעות בחודש זה</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => {
            const s = STATUS[o.status] ?? STATUS.PENDING;
            const scheduled = new Date(o.job!.scheduledAt);
            return (
              <Card key={o.id} className={cn('overflow-hidden border-s-4 p-0', s.border)}>
                <CardContent className="flex items-stretch gap-0 p-0">
                  <div className="min-w-0 flex-1 space-y-2 p-4">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-bold">{o.job!.title}</h3>
                      <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold', s.chip)}>{s.label}</span>
                    </div>

                    <p className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                      <MapPin className="size-3.5 shrink-0 text-brand-strong" />
                      <bdi>{o.job!.fromLocation}</bdi>
                      <span className="text-muted-foreground/50">←</span>
                      <bdi>{o.job!.toLocation}</bdi>
                    </p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarClock className="size-3.5 shrink-0" />
                        {format(scheduled, 'EEEE, d בMMM · HH:mm', { locale: he })}
                      </span>
                      {o.etaMinutes != null && (
                        <span className="flex items-center gap-1"><Clock className="size-3.5 shrink-0" />הגעה ~{o.etaMinutes} דק׳</span>
                      )}
                    </div>

                    {o.note && <p className="line-clamp-1 text-xs text-foreground/70">“{o.note}”</p>}
                  </div>

                  {/* price rail */}
                  <div className="flex w-28 shrink-0 flex-col items-center justify-center gap-0.5 border-s bg-accent/40 p-3 text-center">
                    <p className="text-lg font-black leading-none text-brand-strong">{formatPrice(o.amountCents)}</p>
                    <p className="text-[11px] text-muted-foreground">ההצעה שלך</p>
                    <p className="mt-1 text-[11px] font-semibold text-success">תקבל ~{formatPrice(netCents(o.amountCents))}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
