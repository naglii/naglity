'use client';

import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatPrice, netCents, platformCents, cn } from '@/lib/utils';
import { CRANE_CAPACITIES, LOAD_TYPES } from '@/lib/jobAttributes';
import { useState } from 'react';
import { FileText, CalendarClock, Send, Construction, ArrowLeft, ArrowRight, Check, type LucideIcon } from 'lucide-react';

// Half-hour increments from 0.5 up to 12 hours.
const TRAVEL_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hours = (i + 1) * 0.5;
  return { value: String(hours), label: String(hours) };
});

// Half-hour time slots 05:00 → 23:30.
const TIME_OPTIONS = Array.from({ length: 38 }, (_, i) => {
  const half = i + 10; // 10 half-hours = 05:00
  const v = `${String(Math.floor(half / 2)).padStart(2, '0')}:${half % 2 === 0 ? '00' : '30'}`;
  return { value: v, label: v };
});

const schema = z.object({
  title: z.string().min(1, 'שדה חובה'),
  description: z.string().optional(),
  grossPriceShekels: z.coerce.number().optional(),
  pricingMode: z.enum(['FIXED', 'OFFERS']),
  scheduledDate: z.string().min(1, 'שדה חובה'),
  scheduledTime: z.string().min(1, 'שדה חובה'),
  travelTimeHours: z.coerce.number().min(0.5, 'מינימום 30 דקות').max(12, 'מקסימום 12 שעות'),
  fromLocation: z.string().min(1, 'שדה חובה'),
  toLocation: z.string().min(1, 'שדה חובה'),
  craneCapacityTons: z.string().min(1, 'בחר קיבולת מנוף'),
  liftHeightMeters: z.string().optional(),
  loadType: z.string().optional(),
  accessNotes: z.string().optional(),
}).superRefine((data, ctx) => {
  // A fixed-price job must have a price; an open-to-offers job has none yet.
  if (data.pricingMode === 'FIXED' && (data.grossPriceShekels == null || data.grossPriceShekels < 1)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['grossPriceShekels'], message: 'יש להזין מחיר (מינימום ₪1)' });
  }
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

const STEPS = [
  { n: 1, label: 'פרטי העבודה', icon: FileText },
  { n: 2, label: 'מסלול, תזמון ותמחור', icon: CalendarClock },
] as const;

// Fields that must be valid before advancing past step 1.
const STEP1_FIELDS = ['title', 'craneCapacityTons'] as const;

export function CreateJobForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const { register, handleSubmit, watch, control, setValue, trigger, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { pricingMode: 'FIXED' },
  });

  const pricingMode = watch('pricingMode') ?? 'FIXED';
  const grossShekels = Number(watch('grossPriceShekels')) || 0;
  const grossC = Math.round(grossShekels * 100);
  const minDate = format(new Date(), 'yyyy-MM-dd');

  // Validate step-1 fields, then reveal step 2 on the same screen.
  const goNext = async () => {
    if (await trigger(STEP1_FIELDS)) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Enter advances on step 1 (but not from a textarea, where it adds a newline).
  const onFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && step === 1 && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
      e.preventDefault();
      void goNext();
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      const scheduledAt = new Date(`${data.scheduledDate}T${data.scheduledTime}`);
      if (Number.isNaN(scheduledAt.getTime())) {
        toast.error('תאריך או שעה לא תקינים');
        return;
      }
      const dto: CreateJobDto = {
        title: data.title,
        description: data.description,
        grossPriceCents: data.pricingMode === 'OFFERS' ? 0 : Math.round((data.grossPriceShekels ?? 0) * 100),
        pricingMode: data.pricingMode,
        scheduledAt: scheduledAt.toISOString(),
        estimatedEndAt: new Date(scheduledAt.getTime() + data.travelTimeHours * 60 * 60 * 1000).toISOString(),
        fromLocation: data.fromLocation,
        toLocation: data.toLocation,
        craneCapacityTons: Number(data.craneCapacityTons),
        liftHeightMeters: data.liftHeightMeters ? Number(data.liftHeightMeters) : undefined,
        loadType: data.loadType || undefined,
        accessNotes: data.accessNotes || undefined,
      };
      await api.post('/jobs', dto);
      toast.success('העבודה פורסמה בהצלחה!');
      router.push('/business/jobs');
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'שגיאה בפרסום העבודה');
    }
  };

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">פרסם עבודה חדשה</CardTitle>
        <CardDescription>
          {step === 1 ? 'נתחיל בפרטי העבודה והמנוף הנדרש' : 'מתי, איפה, וכמה — וסיימנו'}
        </CardDescription>

        {/* ── Step indicator ── */}
        <div className="mt-4 flex items-center gap-2">
          {STEPS.map((s, i) => {
            const done = step > s.n;
            const active = step === s.n;
            return (
              <div key={s.n} className="flex flex-1 items-center gap-2">
                <button
                  type="button"
                  // Allow stepping back, never skip ahead past validation.
                  onClick={() => s.n < step && setStep(s.n as 1 | 2)}
                  disabled={s.n > step}
                  className={cn(
                    'flex min-w-0 flex-1 items-center gap-2 rounded-lg border px-3 py-2 text-start transition-colors',
                    active && 'border-brand bg-brand-soft',
                    done && 'border-success/40 bg-success/5 hover:bg-success/10',
                    !active && !done && 'opacity-60',
                  )}
                >
                  <span
                    className={cn(
                      'grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold',
                      active && 'bg-brand text-white',
                      done && 'bg-success text-white',
                      !active && !done && 'bg-muted text-muted-foreground',
                    )}
                  >
                    {done ? <Check className="size-4" /> : s.n}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[10px] leading-none text-muted-foreground">שלב {s.n}</span>
                    <span className="block truncate text-xs font-semibold leading-tight">{s.label}</span>
                  </span>
                </button>
                {i === 0 && <span className="hidden h-px w-4 shrink-0 bg-border sm:block" />}
              </div>
            );
          })}
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} onKeyDown={onFormKeyDown} className="space-y-5">
          {/* ══ Step 1 · Job + crane details ══ */}
          <div className={cn('space-y-5', step !== 1 && 'hidden')}>
            <div>
              <GroupTitle icon={FileText}>פרטי העבודה</GroupTitle>
              <div className="space-y-3">
                <div>
                  <Label className="mb-1.5 block">כותרת</Label>
                  <Input className={inputCls} placeholder="לדוגמה: הרמת מנוף – נמל ת״א" {...register('title')} />
                  <Err msg={errors.title?.message} />
                </div>
                <div>
                  <Label className="mb-1.5 block">תיאור <span className="font-normal text-muted-foreground">(אופציונלי)</span></Label>
                  <Textarea rows={2} placeholder="פרטים נוספים על העבודה…" {...register('description')} />
                </div>
              </div>
            </div>

            <div>
              <GroupTitle icon={Construction}>פרטי המנוף</GroupTitle>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5 block">קיבולת מנוף נדרשת (טון)</Label>
                  <Controller
                    control={control}
                    name="craneCapacityTons"
                    render={({ field }) => (
                      <Select value={field.value || undefined} onValueChange={field.onChange}>
                        <SelectTrigger className={`${inputCls} w-full`}>
                          <SelectValue placeholder="בחר קיבולת" />
                        </SelectTrigger>
                        <SelectContent>
                          {CRANE_CAPACITIES.map((t) => (
                            <SelectItem key={t} value={String(t)}>{t} טון</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <Err msg={errors.craneCapacityTons?.message} />
                </div>
                <div>
                  <Label className="mb-1.5 block">גובה הרמה (מ׳) <span className="font-normal text-muted-foreground">(אופציונלי)</span></Label>
                  <Input className={inputCls} type="number" min="1" step="1" placeholder="לדוגמה: 12" {...register('liftHeightMeters')} />
                </div>
                <div>
                  <Label className="mb-1.5 block">סוג מטען <span className="font-normal text-muted-foreground">(אופציונלי)</span></Label>
                  <Controller
                    control={control}
                    name="loadType"
                    render={({ field }) => (
                      <Select value={field.value || undefined} onValueChange={field.onChange} items={LOAD_TYPES}>
                        <SelectTrigger className={`${inputCls} w-full`}>
                          <SelectValue placeholder="בחר סוג" />
                        </SelectTrigger>
                        <SelectContent>
                          {LOAD_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block">הערות גישה לאתר <span className="font-normal text-muted-foreground">(אופציונלי)</span></Label>
                  <Input className={inputCls} placeholder="חנייה, מכשולים, חוטי חשמל…" {...register('accessNotes')} />
                </div>
              </div>
            </div>
          </div>

          {/* ══ Step 2 · Route, schedule & pricing ══ */}
          <div className={cn('space-y-5', step !== 2 && 'hidden')}>
            <div>
              <GroupTitle icon={FileText}>מסלול</GroupTitle>
              <div className="grid gap-3 sm:grid-cols-2">
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

            <div>
              <GroupTitle icon={CalendarClock}>תזמון</GroupTitle>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label className="mb-1.5 block">תאריך התחלה</Label>
                  <Input className={inputCls} type="date" min={minDate} {...register('scheduledDate')} />
                  <Err msg={errors.scheduledDate?.message} />
                </div>
                <div>
                  <Label className="mb-1.5 block">שעת התחלה</Label>
                  <Controller
                    control={control}
                    name="scheduledTime"
                    render={({ field }) => (
                      <Select value={field.value || undefined} onValueChange={field.onChange}>
                        <SelectTrigger className={`${inputCls} w-full`}>
                          <SelectValue placeholder="בחר שעה" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <Err msg={errors.scheduledTime?.message} />
                </div>
                <div>
                  <Label className="mb-1.5 block">זמן נסיעה (שעות)</Label>
                  <Controller
                    control={control}
                    name="travelTimeHours"
                    render={({ field }) => (
                      <Select
                        value={field.value != null ? String(field.value) : undefined}
                        onValueChange={(v) => field.onChange(Number(v))}
                      >
                        <SelectTrigger className={`${inputCls} w-full`}>
                          <SelectValue placeholder="בחר משך" />
                        </SelectTrigger>
                        <SelectContent>
                          {TRAVEL_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <Err msg={errors.travelTimeHours?.message} />
                </div>
              </div>
            </div>

            <div>
              <GroupTitle icon={Send}>תמחור</GroupTitle>
              <div className="space-y-3">
                <div className="inline-flex w-full rounded-lg border bg-card p-0.5">
                  {([['FIXED', 'מחיר קבוע'], ['OFFERS', 'פתוח להצעות']] as const).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setValue('pricingMode', val)}
                      className={`flex-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${pricingMode === val ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {pricingMode === 'FIXED'
                    ? 'הנהג הראשון שמתאים מקבל את העבודה במחיר שתקבע.'
                    : 'נהגים יגישו הצעות מחיר — ותבחר את המתאים לך.'}
                </p>
                {pricingMode === 'FIXED' ? (
                  <>
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
                  </>
                ) : (
                  <div className="rounded-xl border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                    אין צורך להזין מחיר — נהגים יגישו הצעות מחיר, ותבחר את ההצעה המתאימה לך.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Wizard navigation ── */}
          <div className="flex gap-3 border-t pt-4">
            {step === 1 ? (
              <>
                <Button type="button" size="lg" className="flex-1 gap-1.5 font-semibold" onClick={goNext}>
                  המשך
                  <ArrowLeft className="size-4" />
                </Button>
                <Button type="button" size="lg" variant="outline" onClick={() => router.back()}>ביטול</Button>
              </>
            ) : (
              <>
                <Button type="button" size="lg" variant="outline" className="gap-1.5" onClick={() => setStep(1)}>
                  <ArrowRight className="size-4" />
                  חזרה
                </Button>
                <Button type="submit" size="lg" className="flex-1 gap-1.5 font-semibold" disabled={isSubmitting}>
                  <Send className="size-4" />
                  {isSubmitting ? 'מפרסם…' : 'פרסם עבודה'}
                </Button>
              </>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
