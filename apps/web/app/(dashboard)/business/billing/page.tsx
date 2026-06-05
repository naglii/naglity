'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { BillingStatus, BillingTransaction } from '@/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ReceiptDialog } from '@/components/jobs/ReceiptDialog';
import { formatPrice, cn } from '@/lib/utils';
import { CreditCard, ShieldCheck, CheckCircle2, Info, Trash2, ArrowDownLeft, Undo2, Receipt } from 'lucide-react';

export default function BillingPage() {
  const qc = useQueryClient();
  const [receiptJobId, setReceiptJobId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<BillingStatus>({
    queryKey: ['billing-status'],
    queryFn: () => api.get('/billing/status').then((r) => r.data),
  });

  const { data: transactions = [] } = useQuery<BillingTransaction[]>({
    queryKey: ['billing-transactions'],
    queryFn: () => api.get('/billing/transactions').then((r) => r.data),
  });

  const addMethod = useMutation({
    mutationFn: () => api.post('/billing/payment-method').then((r) => r.data),
    onSuccess: () => { toast.success('אמצעי תשלום נוסף'); qc.invalidateQueries({ queryKey: ['billing-status'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'שגיאה'),
  });

  const removeMethod = useMutation({
    mutationFn: () => api.delete('/billing/payment-method').then((r) => r.data),
    onSuccess: () => { toast.success('אמצעי התשלום הוסר'); qc.invalidateQueries({ queryKey: ['billing-status'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'שגיאה'),
  });

  const hasMethod = data?.hasPaymentMethod;
  const isDemo = data?.provider === 'fake';

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <h1 className="text-xl font-bold">תשלומים</h1>
        <p className="text-sm text-muted-foreground">אמצעי התשלום שלך לחיוב עבור עבודות</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : (
        <Card className="p-0">
          <CardContent className="p-6">
            {hasMethod ? (
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <span className="icon-chip size-12 shrink-0 bg-success-soft text-success">
                    <CheckCircle2 className="size-6" />
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold">אמצעי תשלום פעיל {isDemo && <span className="text-xs font-normal text-muted-foreground">(כרטיס דמו)</span>}</p>
                    {data?.cardLast4 && (
                      <p className="mt-1 flex items-center gap-1.5 font-mono text-sm" dir="ltr">
                        <span className="font-sans text-muted-foreground">{data.cardBrand}</span> •••• {data.cardLast4}
                      </p>
                    )}
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      החיוב מתבצע רק כאשר נהג מקבל את העבודה, והכסף מוחזק בנאמנות עד להשלמתה.
                    </p>
                  </div>
                </div>
                {!!data?.heldInEscrowCents && (
                  <div className="flex items-center justify-between rounded-xl bg-info-soft/50 px-4 py-2.5 text-sm">
                    <span className="flex items-center gap-1.5 font-medium text-info"><ShieldCheck className="size-4" /> מוחזק בנאמנות כרגע</span>
                    <span className="font-bold text-info">{formatPrice(data.heldInEscrowCents)}</span>
                  </div>
                )}
                <div className="flex justify-end border-t pt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-destructive hover:text-destructive"
                    disabled={removeMethod.isPending}
                    onClick={() => removeMethod.mutate()}
                  >
                    <Trash2 className="size-3.5" />
                    {removeMethod.isPending ? 'מסיר…' : 'הסר אמצעי תשלום'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <span className="icon-chip size-14 bg-accent text-brand-strong">
                  <CreditCard className="size-7" />
                </span>
                <div>
                  <p className="font-semibold">לא הוגדר אמצעי תשלום</p>
                  <p className="mt-1 text-sm text-muted-foreground">יש להוסיף אמצעי תשלום כדי לפרסם עבודות</p>
                </div>
                <Button size="lg" className="mt-1 gap-1.5 font-semibold" disabled={addMethod.isPending} onClick={() => addMethod.mutate()}>
                  <CreditCard className="size-4" />
                  {addMethod.isPending ? 'מוסיף…' : 'הוסף אמצעי תשלום'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Charges history ── */}
      <Card className="p-0">
        <CardHeader className="px-4 pt-4 pb-0"><CardTitle className="text-sm font-semibold">היסטוריית חיובים</CardTitle></CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">אין חיובים עדיין</p>
          ) : (
            <div className="divide-y">
              {transactions.map((t) => {
                const isRefund = t.type === 'REFUND';
                return (
                  <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                    <span className={cn('icon-chip size-8 shrink-0', isRefund ? 'bg-muted text-muted-foreground' : 'bg-info-soft text-info')}>
                      {isRefund ? <Undo2 className="size-4" /> : <ArrowDownLeft className="size-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {isRefund ? 'החזר' : 'חיוב'} · {t.jobTitle}
                      </p>
                      <p className="text-xs text-muted-foreground">{format(new Date(t.createdAt), 'dd/MM/yyyy HH:mm')}</p>
                    </div>
                    <span className={cn('shrink-0 text-sm font-bold', isRefund ? 'text-muted-foreground' : 'text-foreground')}>
                      {isRefund ? '+' : '−'}{formatPrice(t.amountCents)}
                    </span>
                    <Button variant="ghost" size="icon-sm" title="קבלה" onClick={() => setReceiptJobId(t.jobId)}>
                      <Receipt className="size-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-start gap-2.5 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-strong" />
        <p>
          התשלום מאובטח — פרטי האשראי נשמרים אצל ספק הסליקה ולא במערכת. החיוב מתבצע בקבלת העבודה,
          הכסף מוחזק בנאמנות, 90% מועברים לנהג בסיום העבודה והפלטפורמה גובה 10%.
        </p>
      </div>

      {isDemo && (
        <div className="flex items-start gap-2.5 rounded-xl border border-warning/30 bg-warning-soft/50 p-4 text-sm text-warning">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p>מצב הדגמה — לא מתבצעים חיובים אמיתיים. החיבור לסליקה אמיתית (Stripe) יופעל בהמשך.</p>
        </div>
      )}

      <ReceiptDialog jobId={receiptJobId} onClose={() => setReceiptJobId(null)} />
    </div>
  );
}
