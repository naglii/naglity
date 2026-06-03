'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v3';
import { format } from 'date-fns';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { CreateJobDto } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatPrice, netCents, platformCents } from '@/lib/utils';
import { FileText, CalendarClock, Send, type LucideIcon } from 'lucide-react';

const schema = z.object({
  title: z.string().min(1, 'שדה חובה'),
  description: z.string().optional(),
  grossPriceShekels: z.coerce.number().min(1, 'מינימום ₪1'),
  scheduledAt: z.string().min(1, 'שדה חובה'),
  travelTimeHours: z.coerce.number().min(0.5, 'מינימום 30 דקות').max(24, 'מקסימום 24 שעות'),
  fromLocation: z.string().min(1, 'שדה חובה'),
  toLocation: z.string().min(1, 'שדה חובה'),
});
type FormData = z.infer<typeof schema>;

const inputCls = 'h-9';

function GroupTitle({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon className="size-4 text-brand-strong" />
      <h3 className="text-sm font-bold">{children}</h3>
    </div>
  );
}

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="mt-1 text-xs text-destructive">{msg}</p> : null;
}

export function CreateJobForm() {
  const router = useRouter();
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const grossShekels = Number(watch('grossPriceShekels')) || 0;
  const grossC = Math.round(grossShekels * 100);
  const minDateTime = format(new Date(), "yyyy-MM-dd'T'HH:mm");

  const onSubmit = async (data: FormData) => {
    try {
      const scheduledAt = new Date(data.scheduledAt);
      const dto: CreateJobDto = {
        title: data.title,
        description: data.description,
        grossPriceCents: Math.round(data.grossPriceShekels * 100),
        scheduledAt: scheduledAt.toISOString(),
        estimatedEndAt: new Date(scheduledAt.getTime() + data.travelTimeHours * 60 * 60 * 1000).toISOString(),
        fromLocation: data.fromLocation,
        toLocation: data.toLocation,
      };
      await api.post('/jobs', dto);
      toast.success('העבודה פורסמה בהצלחה!');
      router.push('/business/jobs');
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'שגיאה בפרסום העבודה');
    }
  };

  return (
    <Card className="mx-auto w-full max-w-3xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">פרסם עבודה חדשה</CardTitle>
        <CardDescription>מלא את הפרטים — העבודה תופץ לנהגים זמינים בזמן אמת</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
            {/* ── Details + route ── */}
            <div>
              <GroupTitle icon={FileText}>פרטים ומסלול</GroupTitle>
              <div className="space-y-3">
                <div>
                  <Label className="mb-1.5 block">כותרת</Label>
                  <Input className={inputCls} placeholder="לדוגמה: הרמת מנוף – נמל ת״א" {...register('title')} />
                  <Err msg={errors.title?.message} />
                </div>
                <div>
                  <Label className="mb-1.5 block">תיאור (אופציונלי)</Label>
                  <Textarea rows={2} placeholder="ציוד נדרש, הערות גישה…" {...register('description')} />
                </div>
                <div>
                  <Label className="mb-1.5 block">מיקום מוצא</Label>
                  <div className="relative">
                    <span className="absolute top-1/2 size-2 -translate-y-1/2 start-3 rounded-full bg-success" />
                    <Input className={`${inputCls} ps-8`} placeholder="כתובת מוצא" {...register('fromLocation')} />
                  </div>
                  <Err msg={errors.fromLocation?.message} />
                </div>
                <div>
                  <Label className="mb-1.5 block">מיקום יעד</Label>
                  <div className="relative">
                    <span className="absolute top-1/2 size-2 -translate-y-1/2 start-3 rounded-full bg-brand-strong" />
                    <Input className={`${inputCls} ps-8`} placeholder="כתובת יעד" {...register('toLocation')} />
                  </div>
                  <Err msg={errors.toLocation?.message} />
                </div>
              </div>
            </div>

            {/* ── Schedule + pricing ── */}
            <div>
              <GroupTitle icon={CalendarClock}>תזמון ותמחור</GroupTitle>
              <div className="space-y-3">
                <div>
                  <Label className="mb-1.5 block">תאריך ושעת התחלה</Label>
                  <Input className={inputCls} type="datetime-local" min={minDateTime} {...register('scheduledAt')} />
                  <Err msg={errors.scheduledAt?.message} />
                </div>
                <div>
                  <Label className="mb-1.5 block">זמן נסיעה (שעות)</Label>
                  <Input className={inputCls} type="number" min="0.5" max="24" step="0.5" placeholder="לדוגמה: 2.5" {...register('travelTimeHours')} />
                  <Err msg={errors.travelTimeHours?.message} />
                </div>
                <div>
                  <Label className="mb-1.5 block">מחיר (₪)</Label>
                  <Input className={inputCls} type="number" min="1" step="1" placeholder="לדוגמה: 500" {...register('grossPriceShekels')} />
                  <Err msg={errors.grossPriceShekels?.message} />
                </div>

                {/* live payout breakdown */}
                <div className="rounded-xl border bg-muted/50 px-4 py-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-success" />
                      הנהג מקבל
                    </span>
                    <span className="font-bold">{grossC > 0 ? formatPrice(netCents(grossC)) : '—'}</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-brand-strong" />
                      עמלת פלטפורמה (10%)
                    </span>
                    <span className="font-semibold">{grossC > 0 ? formatPrice(platformCents(grossC)) : '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 border-t pt-4">
            <Button type="submit" size="lg" className="flex-1 gap-1.5 font-semibold sm:flex-none" disabled={isSubmitting}>
              <Send className="size-4" />
              {isSubmitting ? 'מפרסם…' : 'פרסם עבודה'}
            </Button>
            <Button type="button" size="lg" variant="outline" onClick={() => router.back()}>ביטול</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
