'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v3';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { CreateJobDto } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatPrice, netCents, platformCents } from '@/lib/utils';

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

export function CreateJobForm() {
  const router = useRouter();
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const grossShekels = Number(watch('grossPriceShekels')) || 0;
  const grossC = Math.round(grossShekels * 100);

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
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>פרסם עבודה חדשה</CardTitle>
        <CardDescription>העבודה תופץ לנהגים זמינים בזמן אמת</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>כותרת</Label>
            <Input placeholder="לדוגמה: הרמת מנוף – נמל תל אביב" {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>תיאור (אופציונלי)</Label>
            <Textarea placeholder="פרטים נוספים…" rows={3} {...register('description')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>מיקום מוצא</Label>
              <Input placeholder="כתובת מוצא" {...register('fromLocation')} />
              {errors.fromLocation && <p className="text-xs text-destructive">{errors.fromLocation.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>מיקום יעד</Label>
              <Input placeholder="כתובת יעד" {...register('toLocation')} />
              {errors.toLocation && <p className="text-xs text-destructive">{errors.toLocation.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>מחיר (₪)</Label>
            <Input type="number" min="1" step="1" placeholder="לדוגמה: 500" {...register('grossPriceShekels')} />
            {errors.grossPriceShekels && <p className="text-xs text-destructive">{errors.grossPriceShekels.message}</p>}
            {grossC > 0 && (
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-muted/60 px-3 py-2 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-success" />
                  הנהג מקבל <span className="font-semibold text-foreground">{formatPrice(netCents(grossC))}</span>
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-brand-strong" />
                  עמלת פלטפורמה (10%) {formatPrice(platformCents(grossC))}
                </span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>תאריך ושעת התחלה</Label>
              <Input type="datetime-local" {...register('scheduledAt')} />
              {errors.scheduledAt && <p className="text-xs text-destructive">{errors.scheduledAt.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>זמן נסיעה (שעות)</Label>
              <Input type="number" min="0.5" max="24" step="0.5" placeholder="לדוגמה: 2.5" {...register('travelTimeHours')} />
              {errors.travelTimeHours && <p className="text-xs text-destructive">{errors.travelTimeHours.message}</p>}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" size="lg" className="font-semibold" disabled={isSubmitting}>
              {isSubmitting ? 'מפרסם…' : 'פרסם עבודה'}
            </Button>
            <Button type="button" size="lg" variant="outline" onClick={() => router.back()}>ביטול</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
