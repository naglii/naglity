'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { DriverPayout, PayoutAccountStatus, Job } from '@/types/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ReceiptDialog } from '@/components/jobs/ReceiptDialog';
import { formatPrice, cn } from '@/lib/utils';
import { Wallet, MapPin, Receipt, Clock, CheckCircle2, Landmark, Trash2 } from 'lucide-react';

export default function DriverPayoutsPage() {
  const qc = useQueryClient();
  const [receiptJobId, setReceiptJobId] = useState<string | null>(null);

  const { data: account } = useQuery<PayoutAccountStatus>({
    queryKey: ['payout-account'],
    queryFn: () => api.get('/drivers/me/payout-account').then((r) => r.data),
  });

  const setupAccount = useMutation({
    mutationFn: () => api.post('/drivers/me/payout-account').then((r) => r.data),
    onSuccess: () => { toast.success('אמצעי קבלת תשלום הוגדר'); qc.invalidateQueries({ queryKey: ['payout-account'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'שגיאה'),
  });
  const removeAccount = useMutation({
    mutationFn: () => api.delete('/drivers/me/payout-account').then((r) => r.data),
    onSuccess: () => { toast.success('אמצעי קבלת התשלום הוסר'); qc.invalidateQueries({ queryKey: ['payout-account'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'שגיאה'),
  });

  const { data: payouts = [] } = useQuery<DriverPayout[]>({
    queryKey: ['driver-payouts'],
    queryFn: () => api.get('/drivers/me/payouts').then((r) => r.data),
  });

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ['driver-jobs'],
    queryFn: () => api.get('/drivers/me/jobs').then((r) => r.data),
  });

  const totalPaid = useMemo(
    () => payouts.filter((p) => p.status === 'SUCCEEDED').reduce((s, p) => s + p.amountCents, 0),
    [payouts],
  );

  // Money charged & held for jobs you've taken but not completed yet.
  const onTheWay = useMemo(
    () => jobs.filter((j) => j.status === 'ACCEPTED' || j.status === 'IN_PROGRESS').reduce((s, j) => s + j.netPriceCents, 0),
    [jobs],
  );

  const accountActive = account?.payoutsEnabled;
  const isDemo = account?.provider === 'fake';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">תשלומים</h1>
        <p className="text-sm text-muted-foreground">אמצעי קבלת תשלום והתשלומים שקיבלת</p>
      </div>

      {/* payout account */}
      <Card className="p-0">
        <CardContent className="p-5">
          {accountActive ? (
            <div className="flex items-center gap-4">
              <span className="icon-chip size-11 shrink-0 bg-success-soft text-success"><Landmark className="size-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">אמצעי קבלת תשלום פעיל {isDemo && <span className="text-xs font-normal text-muted-foreground">(חשבון דמו)</span>}</p>
                {account?.payoutLast4 && (
                  <p className="mt-1 text-sm">
                    <span className="text-muted-foreground">חשבון</span>{' '}
                    <span className="font-mono" dir="ltr">•••• {account.payoutLast4}</span>
                  </p>
                )}
                <p className="mt-0.5 text-sm text-muted-foreground">התשלומים יועברו לחשבונך עם השלמת עבודות.</p>
              </div>
              <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive" disabled={removeAccount.isPending} onClick={() => removeAccount.mutate()}>
                <Trash2 className="size-3.5" /> הסר
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-1 text-center">
              <span className="icon-chip size-14 bg-accent text-brand-strong"><Landmark className="size-7" /></span>
              <div>
                <p className="font-semibold">הגדר אמצעי לקבלת תשלום</p>
                <p className="mt-1 text-sm text-muted-foreground">חובה להגדיר חשבון לקבלת כספים כדי שתוכל לקבל עבודות</p>
              </div>
              <Button size="lg" className="mt-1 gap-1.5 font-semibold" disabled={setupAccount.isPending} onClick={() => setupAccount.mutate()}>
                <Landmark className="size-4" /> {setupAccount.isPending ? 'מגדיר…' : 'הגדר אמצעי קבלת תשלום'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* total */}
      <Card className="relative overflow-hidden p-0">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-bl from-success-soft/70 to-transparent" />
        <CardContent className="relative p-6">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <span className="icon-chip size-7 bg-success-soft text-success"><Wallet className="size-4" /></span>
            סך הכל שולם לך
          </div>
          <p className="mt-2 text-4xl font-black tracking-tight text-success">{formatPrice(totalPaid)}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success">
              <CheckCircle2 className="size-3.5" /> {payouts.filter((p) => p.status === 'SUCCEEDED').length} תשלומים
            </span>
            {onTheWay > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-info-soft px-3 py-1 text-xs font-semibold text-info">
                <Clock className="size-3.5" /> בדרך אליך · {formatPrice(onTheWay)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {payouts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="icon-chip size-14 bg-accent text-brand-strong"><Wallet className="size-6" /></span>
          <p className="mt-3 font-semibold">אין תשלומים עדיין</p>
          <p className="mt-1 text-sm text-muted-foreground">תשלומים יופיעו כאן לאחר שעבודות יושלמו וישולמו</p>
        </div>
      ) : (
        <Card className="divide-y p-0">
          {payouts.map((p) => (
            <div key={p.id} className="flex items-center gap-4 p-4">
              <span className={cn(
                'icon-chip size-9 shrink-0',
                p.status === 'SUCCEEDED' ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning',
              )}>
                {p.status === 'SUCCEEDED' ? <CheckCircle2 className="size-4.5" /> : <Clock className="size-4.5" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{p.jobTitle}</p>
                <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                  <MapPin className="size-3 shrink-0 text-brand-strong" />
                  <bdi>{p.fromLocation}</bdi><span className="text-muted-foreground/50">←</span><bdi>{p.toLocation}</bdi>
                  <span>· {format(new Date(p.scheduledAt), 'dd/MM/yy')}</span>
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <p className="text-sm font-bold text-success">{formatPrice(p.amountCents)}</p>
                <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setReceiptJobId(p.jobId)}>
                  <Receipt className="size-3.5" /> קבלה
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}

      <ReceiptDialog jobId={receiptJobId} onClose={() => setReceiptJobId(null)} />
    </div>
  );
}
