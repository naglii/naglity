'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import api from '@/lib/api';
import type { Receipt } from '@/types/api';
import { formatPrice } from '@/lib/utils';
import {
  Dialog, DialogPortal, DialogOverlay, DialogContent, DialogTitle,
} from '@/components/ui/dialog';
import { BrandMark } from '@/components/layout/Logo';
import { Skeleton } from '@/components/ui/skeleton';

function StatusLine({ ok, label, date }: { ok: boolean; label: string; date: string | null }) {
  if (!ok) return null;
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{date ? format(new Date(date), 'dd/MM/yyyy HH:mm') : '—'}</span>
    </div>
  );
}

export function ReceiptDialog({ jobId, onClose }: { jobId: string | null; onClose: () => void }) {
  const { data, isLoading } = useQuery<Receipt>({
    queryKey: ['receipt', jobId],
    queryFn: () => api.get(`/jobs/${jobId}/receipt`).then((r) => r.data),
    enabled: !!jobId,
  });

  return (
    <Dialog open={!!jobId} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent className="max-w-md p-0">
          <DialogTitle className="sr-only">קבלה</DialogTitle>

          {isLoading || !data ? (
            <div className="p-6"><Skeleton className="h-72 w-full rounded-lg" /></div>
          ) : (
            <div className="overflow-hidden">
              {/* header — extra top room so the dialog's close X never overlaps */}
              <div className="bg-gradient-to-bl from-brand-soft/70 to-transparent px-5 pb-4 pt-11">
                <div className="flex items-end justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <BrandMark className="size-9" iconClassName="size-5" />
                    <div>
                      <p className="font-black tracking-tight" dir="ltr">Naglity<span className="text-brand-strong">.</span></p>
                      <p className="text-[11px] text-muted-foreground">קבלה / אישור תשלום</p>
                    </div>
                  </div>
                  <div className="text-end">
                    <p className="font-mono text-xs font-semibold" dir="ltr">{data.invoiceNumber}</p>
                    <p className="text-[11px] text-muted-foreground">{format(new Date(data.issuedAt), 'dd/MM/yyyy')}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-5">
                {/* parties + job */}
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">עסק</span><span className="font-medium">{data.businessName ?? '—'}</span></div>
                  {data.driverName && <div className="flex justify-between"><span className="text-muted-foreground">נהג</span><span className="font-medium">{data.driverName}</span></div>}
                  <div className="flex justify-between"><span className="text-muted-foreground">עבודה</span><span className="font-medium">{data.job.title}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-muted-foreground">מסלול</span><span className="truncate font-medium"><bdi>{data.job.fromLocation}</bdi> ← <bdi>{data.job.toLocation}</bdi></span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">מועד</span><span className="font-medium">{format(new Date(data.job.scheduledAt), 'dd/MM/yyyy HH:mm')}</span></div>
                </div>

                {/* amounts */}
                <div className="rounded-xl border divide-y">
                  <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span>מחיר העבודה</span><span className="font-semibold">{formatPrice(data.grossCents)}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5 text-sm text-muted-foreground">
                    <span>עמלת פלטפורמה (10%)</span><span>−{formatPrice(data.platformFeeCents)}</span>
                  </div>
                  <div className="flex items-center justify-between bg-success-soft/40 px-4 py-2.5">
                    <span className="font-semibold">תשלום לנהג (נטו)</span>
                    <span className="text-lg font-black text-success">{formatPrice(data.netCents)}</span>
                  </div>
                </div>

                {/* status timeline */}
                <div className="space-y-1.5 rounded-xl bg-muted/50 p-3">
                  <StatusLine ok={data.charged} label="חויב מהעסק (בנאמנות)" date={data.chargedAt} />
                  <StatusLine ok={data.released} label="שולם לנהג" date={data.releasedAt} />
                  <StatusLine ok={data.refunded} label="הוחזר לעסק" date={data.refundedAt} />
                  {!data.charged && !data.refunded && (
                    <p className="text-xs text-muted-foreground">טרם בוצע חיוב</p>
                  )}
                </div>

                <p className="text-center text-[11px] text-muted-foreground">
                  מסמך הדגמה — אינו מהווה מסמך מס. חשבונית מס תופק עם חיבור הסליקה.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
