'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth } from 'date-fns';
import api from '@/lib/api';
import { initSocket } from '@/hooks/useSocket';
import type { AdminTransaction } from '@/types/api';
import { StatsCard } from '@/components/stats/StatsCard';
import { MonthNavigator } from '@/components/stats/MonthNavigator';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice, isInMonth, cn } from '@/lib/utils';
import { ArrowDownLeft, ArrowUpRight, Undo2, AlertTriangle, ArrowLeftRight, Banknote, Landmark, Wallet, Download } from 'lucide-react';

type Filter = 'ALL' | 'CHARGE' | 'TRANSFER' | 'REFUND' | 'FAILED';

const TYPE_META = {
  CHARGE: { label: 'חיוב', icon: ArrowDownLeft, className: 'bg-info-soft text-info' },
  TRANSFER: { label: 'תשלום לנהג', icon: ArrowUpRight, className: 'bg-success-soft text-success' },
  REFUND: { label: 'החזר', icon: Undo2, className: 'bg-muted text-muted-foreground' },
} as const;

const STATUS_META: Record<string, { label: string; className: string }> = {
  SUCCEEDED: { label: 'הצליח', className: 'bg-success-soft text-success' },
  PENDING: { label: 'ממתין', className: 'bg-warning-soft text-warning' },
  FAILED: { label: 'נכשל', className: 'bg-destructive/10 text-destructive' },
};

const sumOk = (txs: AdminTransaction[], type: string) =>
  txs.filter((t) => t.type === type && t.status === 'SUCCEEDED').reduce((s, t) => s + t.amountCents, 0);

export default function AdminTransactionsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>('ALL');
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const { data: allTxs = [], isLoading } = useQuery<AdminTransaction[]>({
    queryKey: ['admin-transactions'],
    queryFn: () => api.get('/admin/transactions').then((r) => r.data),
  });

  const txs = useMemo(() => allTxs.filter((t) => isInMonth(t.createdAt, month)), [allTxs, month]);

  useEffect(() => {
    const socket = initSocket();
    const refresh = () => qc.invalidateQueries({ queryKey: ['admin-transactions'] });
    socket.on('job:accepted', refresh);
    socket.on('job:updated', refresh);
    return () => { socket.off('job:accepted', refresh); socket.off('job:updated', refresh); };
  }, [qc]);

  const totals = useMemo(() => {
    const charged = sumOk(txs, 'CHARGE');
    const paidOut = sumOk(txs, 'TRANSFER');
    const refunded = sumOk(txs, 'REFUND');
    return { charged, paidOut, refunded, platform: charged - paidOut - refunded };
  }, [txs]);

  const failedCount = txs.filter((t) => t.status === 'FAILED').length;

  const filtered = useMemo(() => {
    if (filter === 'ALL') return txs;
    if (filter === 'FAILED') return txs.filter((t) => t.status === 'FAILED');
    return txs.filter((t) => t.type === filter);
  }, [txs, filter]);

  const downloadCsv = () => {
    const header = ['תאריך', 'סוג', 'סטטוס', 'עסק', 'נהג', 'עבודה', 'סכום (₪)', 'אסמכתא'];
    const rows = txs.map((t) => [
      format(new Date(t.createdAt), 'yyyy-MM-dd HH:mm'),
      TYPE_META[t.type]?.label ?? t.type,
      STATUS_META[t.status]?.label ?? t.status,
      t.businessName ?? '',
      t.driverName ?? '',
      t.jobTitle,
      (t.amountCents / 100).toFixed(2),
      t.providerRef ?? '',
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `naglity-transactions-${format(month, 'yyyy-MM')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const chips: { key: Filter; label: string; count: number }[] = [
    { key: 'ALL', label: 'הכל', count: txs.length },
    { key: 'CHARGE', label: 'חיובים', count: txs.filter((t) => t.type === 'CHARGE').length },
    { key: 'TRANSFER', label: 'תשלומים', count: txs.filter((t) => t.type === 'TRANSFER').length },
    { key: 'REFUND', label: 'החזרים', count: txs.filter((t) => t.type === 'REFUND').length },
    { key: 'FAILED', label: 'נכשלו', count: failedCount },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">תנועות כספים</h1>
          <p className="text-sm text-muted-foreground">חיובים, תשלומים לנהגים והחזרים לפי חודש</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" disabled={txs.length === 0} onClick={downloadCsv}>
            <Download className="size-3.5" /> ייצוא CSV
          </Button>
          <MonthNavigator month={month} onChange={setMonth} />
        </div>
      </div>

      {isLoading ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard title="סך חיובים מעסקים" value={formatPrice(totals.charged)} icon={ArrowDownLeft} tone="info" />
            <StatsCard title="שולם לנהגים" value={formatPrice(totals.paidOut)} icon={Landmark} tone="success" />
            <StatsCard title="הוחזר לעסקים" value={formatPrice(totals.refunded)} icon={Undo2} tone="warning" />
            <StatsCard title="נותר בפלטפורמה" value={formatPrice(totals.platform)} icon={Wallet} tone="brand" />
          </div>

          {failedCount > 0 && (
            <div className="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 p-3.5 text-sm text-destructive">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{failedCount} תנועות נכשלו ודורשות טיפול.</span>
            </div>
          )}

          {/* filter chips */}
          <div className="flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <button
                key={c.key}
                onClick={() => setFilter(c.key)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                  filter === c.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent',
                  c.key === 'FAILED' && c.count > 0 && filter !== c.key && 'text-destructive',
                )}
              >
                {c.label}
                <span className={cn('text-[10px]', filter === c.key ? 'text-primary-foreground/80' : 'text-muted-foreground/70')}>{c.count}</span>
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="icon-chip size-14 bg-accent text-brand-strong"><ArrowLeftRight className="size-6" /></span>
              <p className="mt-3 font-semibold">אין תנועות להצגה</p>
            </div>
          ) : (
            <Card className="divide-y p-0">
              {filtered.map((t) => {
                const meta = TYPE_META[t.type];
                const Icon = meta?.icon ?? Banknote;
                const isCredit = t.type === 'TRANSFER' || t.type === 'REFUND';
                return (
                  <div key={t.id} className="flex items-center gap-3 p-3.5">
                    <span className={cn('icon-chip size-9 shrink-0', meta?.className)}>
                      <Icon className="size-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{meta?.label} · {t.jobTitle}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {t.businessName ?? '—'}{t.driverName ? ` ← ${t.driverName}` : ''} · {format(new Date(t.createdAt), 'dd/MM/yy HH:mm')}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className={cn('text-sm font-bold', isCredit ? 'text-muted-foreground' : 'text-foreground')}>
                        {isCredit ? '−' : '+'}{formatPrice(t.amountCents)}
                      </span>
                      <span className={cn('rounded-full px-2 text-[10px] font-semibold', STATUS_META[t.status]?.className)}>
                        {STATUS_META[t.status]?.label ?? t.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
