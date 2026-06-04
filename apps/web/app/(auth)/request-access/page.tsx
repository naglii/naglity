'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v3';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { CreateSignupRequestDto } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BrandMark } from '@/components/layout/Logo';
import { CRANE_CAPACITIES } from '@/lib/jobAttributes';
import { Truck, Building2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const schema = z
  .object({
    type: z.enum(['DRIVER', 'BUSINESS']),
    name: z.string().min(2, 'שדה חובה'),
    businessName: z.string().optional(),
    phone: z.string().min(5, 'מספר טלפון לא תקין'),
    email: z.string().email('אימייל לא תקין').optional().or(z.literal('')),
    details: z.string().optional(),
    craneCapacityTons: z.string().optional(),
    liftHeightMeters: z.string().optional(),
  })
  .refine((d) => d.type !== 'BUSINESS' || !!d.businessName?.trim(), {
    message: 'שם העסק נדרש',
    path: ['businessName'],
  });
type FormData = z.infer<typeof schema>;

export default function RequestAccessPage() {
  const [done, setDone] = useState(false);

  const { register, handleSubmit, control, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'DRIVER' },
  });
  const type = watch('type');

  const onSubmit = async (data: FormData) => {
    try {
      const payload: CreateSignupRequestDto = {
        type: data.type,
        name: data.name,
        businessName: data.type === 'BUSINESS' ? data.businessName : undefined,
        phone: data.phone,
        email: data.email || undefined,
        details: data.details || undefined,
        craneCapacityTons: data.type === 'DRIVER' && data.craneCapacityTons ? Number(data.craneCapacityTons) : undefined,
        liftHeightMeters: data.type === 'DRIVER' && data.liftHeightMeters ? Number(data.liftHeightMeters) : undefined,
      };
      await api.post('/signup-requests', payload);
      setDone(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'שליחת הבקשה נכשלה, נסו שוב');
    }
  };

  if (done) {
    return (
      <Card className="w-full max-w-md text-center shadow-xl">
        <CardContent className="flex flex-col items-center gap-3 py-10">
          <span className="icon-chip size-16 bg-success-soft text-success">
            <CheckCircle2 className="size-8" />
          </span>
          <h1 className="text-xl font-bold">הבקשה נשלחה!</h1>
          <p className="max-w-xs text-sm text-muted-foreground">
            תודה על ההתעניינות. צוות נגלי יצור איתך קשר בהקדם לפתיחת החשבון.
          </p>
          <Button className="mt-2" render={<Link href="/login" />} nativeButton={false}>
            חזרה להתחברות
          </Button>
        </CardContent>
      </Card>
    );
  }

  const TypeButton = ({ value, icon: Icon, label }: { value: 'DRIVER' | 'BUSINESS'; icon: typeof Truck; label: string }) => (
    <Controller
      control={control}
      name="type"
      render={({ field }) => (
        <button
          type="button"
          onClick={() => field.onChange(value)}
          className={cn(
            'flex flex-1 flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-colors',
            field.value === value
              ? 'border-primary bg-brand-soft text-brand-strong'
              : 'border-border text-muted-foreground hover:bg-accent',
          )}
        >
          <Icon className="size-5" />
          <span className="text-sm font-semibold">{label}</span>
        </button>
      )}
    />
  );

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="items-center text-center pt-2">
        <BrandMark className="size-12 mb-1" iconClassName="size-6" />
        <CardTitle className="text-xl">בקשת הצטרפות</CardTitle>
        <CardDescription>השאירו פרטים ונחזור אליכם לפתיחת חשבון</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label className="mb-1.5 block">אני מעוניין/ת להצטרף בתור</Label>
            <div className="flex gap-2.5">
              <TypeButton value="DRIVER" icon={Truck} label="נהג מנוף" />
              <TypeButton value="BUSINESS" icon={Building2} label="עסק" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>שם מלא (איש קשר)</Label>
            <Input placeholder="ישראל ישראלי" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          {type === 'BUSINESS' && (
            <div className="space-y-1.5">
              <Label>שם העסק</Label>
              <Input placeholder="שם החברה" {...register('businessName')} />
              {errors.businessName && <p className="text-xs text-destructive">{errors.businessName.message}</p>}
            </div>
          )}

          {type === 'DRIVER' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>קיבולת המנוף (טון) <span className="font-normal text-muted-foreground">(אופציונלי)</span></Label>
                <Controller
                  control={control}
                  name="craneCapacityTons"
                  render={({ field }) => (
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="בחר קיבולת" /></SelectTrigger>
                      <SelectContent>
                        {CRANE_CAPACITIES.map((t) => <SelectItem key={t} value={String(t)}>{t} טון</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>גובה הרמה (מ׳) <span className="font-normal text-muted-foreground">(אופציונלי)</span></Label>
                <Input type="number" min="1" step="1" inputMode="numeric" placeholder="לדוגמה: 25" {...register('liftHeightMeters')} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>טלפון</Label>
              <Input type="tel" inputMode="tel" placeholder="050-0000000" {...register('phone')} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>אימייל <span className="font-normal text-muted-foreground">(אופציונלי)</span></Label>
              <Input type="email" placeholder="you@example.com" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>פרטים נוספים <span className="font-normal text-muted-foreground">(אופציונלי)</span></Label>
            <Textarea
              rows={3}
              placeholder={type === 'DRIVER' ? 'סוג המנוף, אזור פעילות, ניסיון…' : 'תחום העסק, סוג העבודות הנדרשות…'}
              {...register('details')}
            />
          </div>

          <Button type="submit" size="lg" className="w-full font-semibold" disabled={isSubmitting}>
            {isSubmitting ? 'שולח…' : 'שליחת בקשה'}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          כבר יש לך חשבון?{' '}
          <Link href="/login" className="inline-flex items-center gap-1 font-semibold text-brand-strong hover:underline">
            להתחברות <ArrowRight className="size-3.5" />
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
