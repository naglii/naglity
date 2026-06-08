'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { JobOffer } from '@/types/api';
import { initSocket } from '@/hooks/useSocket';
import {
  Dialog, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RatingStars } from '@/components/reviews/RatingStars';
import { formatPrice } from '@/lib/utils';
import { Weight, Clock, Check } from 'lucide-react';

export function OffersDialog({ jobId, onClose }: { jobId: string | null; onClose: () => void }) {
  const qc = useQueryClient();
  const open = !!jobId;

  const { data: offers = [], isLoading } = useQuery<JobOffer[]>({
    queryKey: ['job-offers', jobId],
    queryFn: () => api.get(`/jobs/${jobId}/offers`).then((r) => r.data),
    enabled: open,
  });

  // Live: refresh as new offers arrive while the dialog is open.
  useEffect(() => {
    if (!open) return;
    const socket = initSocket();
    const refresh = () => qc.invalidateQueries({ queryKey: ['job-offers', jobId] });
    socket.on('job:updated', refresh);
    return () => { socket.off('job:updated', refresh); };
  }, [open, jobId, qc]);

  const accept = useMutation({
    mutationFn: (offerId: string) => api.post(`/jobs/${jobId}/offers/${offerId}/accept`),
    onSuccess: () => {
      toast.success('הנהג נבחר — העבודה שובצה');
      qc.invalidateQueries({ queryKey: ['business-jobs'] });
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'שגיאה בבחירת ההצעה'),
  });

  const pending = offers.filter((o) => o.status === 'PENDING');

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent className="max-w-md">
          <DialogTitle>הצעות מנהגים</DialogTitle>
          <DialogDescription className="mt-1">בחר הצעה — הנהג ישובץ והתשלום ייכנס לנאמנות עד סיום העבודה.</DialogDescription>

          <div className="mt-3 max-h-[60vh] space-y-2.5 overflow-auto">
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
            ) : pending.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">עדיין אין הצעות — הן יופיעו כאן בזמן אמת.</p>
            ) : (
              pending.map((o) => (
                <div key={o.id} className="rounded-xl border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{o.driver?.name}</p>
                      {o.driver?.rating && <RatingStars value={o.driver.rating.avg} count={o.driver.rating.count} />}
                    </div>
                    <p className="shrink-0 text-lg font-bold text-brand-strong">{formatPrice(o.amountCents)}</p>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {o.driver?.craneCapacityTons != null && (
                      <span className="inline-flex items-center gap-1"><Weight className="size-3" />{o.driver.craneCapacityTons} טון</span>
                    )}
                    {o.etaMinutes != null && (
                      <span className="inline-flex items-center gap-1"><Clock className="size-3" />הגעה ~{o.etaMinutes} דק׳</span>
                    )}
                  </div>
                  {o.note && <p className="mt-1.5 text-sm text-foreground/90">{o.note}</p>}
                  <Button size="sm" className="mt-2.5 w-full gap-1.5" disabled={accept.isPending} onClick={() => accept.mutate(o.id)}>
                    <Check className="size-3.5" /> בחר נהג זה
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
