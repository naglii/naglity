'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v3';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { Job } from '@/types/api';
import {
  Dialog, DialogTrigger, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatPrice } from '@/lib/utils';
import { Send, HandCoins } from 'lucide-react';

const schema = z.object({
  amountShekels: z.coerce.number().min(1, 'מינימום ₪1'),
  etaMinutes: z.string().optional(),
  note: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export function SubmitOfferDialog({ job, alreadyOffered }: { job: Job; alreadyOffered?: boolean }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(!!alreadyOffered);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { amountShekels: job.grossPriceCents > 0 ? Math.round(job.grossPriceCents / 100) : undefined, etaMinutes: '', note: '' },
  });
  const amount = Number(watch('amountShekels')) || 0;

  const onSubmit = async (data: FormData) => {
    try {
      await api.post(`/jobs/${job.id}/offers`, {
        amountCents: Math.round(data.amountShekels * 100),
        etaMinutes: data.etaMinutes ? Number(data.etaMinutes) : undefined,
        note: data.note || undefined,
      });
      toast.success('ההצעה נשלחה!');
      setSent(true);
      setOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'שגיאה בשליחת ההצעה');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button size="lg" variant={sent ? 'outline' : 'default'} className="w-full gap-1.5 font-semibold">
          <HandCoins className="size-4" />
          {sent ? 'עדכן הצעה' : 'שלח הצעה'}
        </Button>
      } />
      <DialogPortal>
        <DialogOverlay />
        <DialogContent className="max-w-sm">
          <DialogTitle>שליחת הצעת מחיר</DialogTitle>
          <DialogDescription className="mt-1">{job.title}</DialogDescription>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-3 space-y-3">
            <div>
              <Label className="mb-1.5 block">המחיר שלך (₪)</Label>
              <Input type="number" min="1" step="1" {...register('amountShekels')} />
              {errors.amountShekels && <p className="text-xs text-destructive">{errors.amountShekels.message}</p>}
              <p className="mt-1 text-xs text-muted-foreground">
                אתה תקבל ~{formatPrice(Math.round(amount * 100 * 0.9))} (לאחר עמלה)
              </p>
            </div>
            <div>
              <Label className="mb-1.5 block">
                זמן הגעה משוער (דקות) <span className="font-normal text-muted-foreground">(אופציונלי)</span>
              </Label>
              <Input type="number" min="1" step="5" placeholder="30" {...register('etaMinutes')} />
            </div>
            <div>
              <Label className="mb-1.5 block">
                הערה לעסק <span className="font-normal text-muted-foreground">(אופציונלי)</span>
              </Label>
              <Textarea rows={2} placeholder="זמינות, ניסיון, פרטים נוספים…" {...register('note')} />
            </div>
            <Button type="submit" className="w-full gap-1.5" disabled={isSubmitting}>
              <Send className="size-4" />
              {isSubmitting ? 'שולח…' : 'שלח הצעה'}
            </Button>
          </form>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
