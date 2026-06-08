'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v3';
import { toast } from 'sonner';
import api from '@/lib/api';
import { setAuth, setToken } from '@/lib/auth';
import type { LoginResponse } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { BrandMark, CraneGlyph } from '@/components/layout/Logo';
import { Search, BadgePercent, ShieldCheck, MessageSquare, CheckCircle2, Loader2, Pencil } from 'lucide-react';
import { OtpInput } from '@/components/auth/OtpInput';

const schema = z.object({
  name: z.string().min(2, 'נא להזין שם מלא'),
  phone: z.string().min(5, 'מספר טלפון לא תקין'),
  email: z.string().email('אימייל לא תקין').optional().or(z.literal('')),
  username: z.string().min(3, 'מינימום 3 תווים'),
  password: z.string().min(6, 'מינימום 6 תווים'),
});
type FormData = z.infer<typeof schema>;

const perks = [
  { icon: Search, title: 'מצא נהג מנוף בקלות', desc: 'פרסם עבודה וקבל נהגים זמינים מיד' },
  { icon: BadgePercent, title: 'מחיר קבוע או הצעות', desc: 'קבע מחיר — או תן לנהגים להציע' },
  { icon: ShieldCheck, title: 'תשלום מאובטח', desc: 'הכסף משוחרר רק עם סיום העבודה' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [sentPhone, setSentPhone] = useState('');
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const lastChecked = useRef('');

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // Resend cooldown ticker.
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  // Changing the phone after sending invalidates the verification.
  const phoneVal = watch('phone');
  useEffect(() => {
    if (codeSent && (phoneVal || '').trim() !== sentPhone) {
      setCodeSent(false);
      setVerified(false);
      setCode('');
      lastChecked.current = '';
    }
  }, [phoneVal, codeSent, sentPhone]);

  const sendCode = async () => {
    const phone = (watch('phone') || '').trim();
    if (phone.length < 5) { toast.error('נא להזין מספר טלפון תקין'); return; }
    setSending(true);
    try {
      await api.post('/auth/phone/send', { phone });
      setSentPhone(phone);
      setCodeSent(true);
      setVerified(false);
      setCode('');
      lastChecked.current = '';
      setResendIn(30);
      toast.success('קוד אימות נשלח ב-SMS (לבדיקה: 0000)');
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'שגיאה בשליחת הקוד');
    } finally {
      setSending(false);
    }
  };

  // Auto-verify each distinct 4-digit code as it's entered (instant feedback).
  useEffect(() => {
    if (!codeSent || code.length < 4 || lastChecked.current === code) return;
    lastChecked.current = code;
    setVerifying(true);
    setVerified(false);
    api.post('/auth/phone/verify', { phone: sentPhone, code })
      .then((r) => setVerified(!!r.data?.verified))
      .catch(() => setVerified(false))
      .finally(() => setVerifying(false));
  }, [code, codeSent, sentPhone]);

  const onSubmit = async (data: FormData) => {
    if (!verified) { toast.error('יש לאמת את מספר הטלפון'); return; }
    setLoading(true);
    try {
      const res = await api.post<LoginResponse>('/auth/register', {
        ...data,
        phone: sentPhone,
        code,
        email: data.email || undefined,
      });
      setAuth(res.data.user);
      setToken(res.data.accessToken);
      toast.success('החשבון נוצר — ברוך הבא!');
      router.push('/business/jobs');
    } catch (err: any) {
      toast.error(
        err.response?.status === 409
          ? 'שם המשתמש או האימייל כבר בשימוש'
          : (err.response?.data?.message ?? 'משהו השתבש, נסה שנית'),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl overflow-hidden p-0 shadow-2xl">
      <div className="grid md:grid-cols-2">
        {/* ── Brand panel ── */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-bl from-brand-soft via-card to-card p-8 md:flex md:border-e">
          <div className="pointer-events-none absolute -top-20 -end-12 size-56 rounded-full bg-brand/15 blur-3xl" />

          <div className="relative flex items-center gap-2.5" dir="ltr">
            <span className="grid size-9 place-items-center rounded-xl bg-brand-soft ring-1 ring-brand/15">
              <CraneGlyph className="size-5 text-brand-strong" />
            </span>
            <span className="text-lg font-black tracking-tight text-foreground">Naglity.</span>
          </div>

          <div className="relative space-y-1.5">
            <h2 className="text-2xl font-bold leading-snug text-foreground">
              צריך מנוף?<br />קבל נהג תוך דקות
            </h2>
            <p className="text-sm text-muted-foreground">פתח חשבון חינם, פרסם את העבודה — והנהגים יגיעו אליך.</p>
          </div>

          <ul className="relative space-y-3">
            {perks.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-strong ring-1 ring-brand/10">
                  <Icon className="size-4.5" />
                </span>
                <div>
                  <p className="text-sm font-semibold leading-tight text-foreground">{title}</p>
                  <p className="text-xs leading-tight text-muted-foreground">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Form panel ── */}
        <div className="flex flex-col justify-center p-8 sm:p-10">
          <div className="mb-6 flex flex-col items-center text-center md:hidden">
            <BrandMark className="mb-2 size-12" iconClassName="size-6" />
            <span className="text-xl font-black tracking-tight" dir="ltr">Naglity.</span>
          </div>

          <div className="mb-5">
            <h1 className="text-2xl font-bold">פתיחת חשבון לקוח</h1>
            <p className="mt-1 text-sm text-muted-foreground">הרשמה מהירה — מתחילים לפרסם עבודות בחינם</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="name">שם מלא</Label>
                <Input id="name" placeholder="ישראל ישראלי" {...register('name')} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">טלפון</Label>
                <Input id="phone" placeholder="050-0000000" inputMode="tel" {...register('phone')} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>
            </div>

            {/* phone verification (fake SMS — code 0000) */}
            <div className="rounded-xl border bg-muted/30 p-3">
              {!codeSent ? (
                <Button type="button" variant="outline" size="lg" className="w-full gap-1.5" disabled={sending} onClick={sendCode}>
                  {sending ? <Loader2 className="size-4 animate-spin" /> : <MessageSquare className="size-4" />}
                  {sending ? 'שולח…' : 'שלח קוד אימות ב-SMS'}
                </Button>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      קוד נשלח אל <bdi className="font-semibold text-foreground">{sentPhone}</bdi>
                    </p>
                    <button
                      type="button"
                      onClick={() => { setCodeSent(false); setVerified(false); setCode(''); lastChecked.current = ''; }}
                      className="inline-flex items-center gap-1 text-xs text-brand-strong hover:underline"
                    >
                      <Pencil className="size-3" /> שנה מספר
                    </button>
                  </div>

                  <OtpInput
                    value={code}
                    onChange={setCode}
                    autoFocus
                    disabled={verified}
                    status={verified ? 'ok' : code.length >= 4 && !verifying ? 'error' : 'idle'}
                  />

                  <div className="flex items-center justify-center text-xs">
                    {verifying ? (
                      <span className="flex items-center gap-1 text-muted-foreground"><Loader2 className="size-3 animate-spin" /> מאמת…</span>
                    ) : verified ? (
                      <span className="flex items-center gap-1 font-semibold text-success"><CheckCircle2 className="size-3.5" /> הטלפון אומת</span>
                    ) : code.length >= 4 ? (
                      <span className="font-semibold text-destructive">קוד שגוי — נסה שוב</span>
                    ) : (
                      <span className="text-muted-foreground">הזן את הקוד מה-SMS</span>
                    )}
                  </div>

                  <div className="text-center">
                    {resendIn > 0 ? (
                      <span className="text-xs text-muted-foreground">ניתן לשלוח קוד שוב בעוד {resendIn} שניות</span>
                    ) : (
                      <button type="button" onClick={sendCode} disabled={sending} className="text-xs text-brand-strong hover:underline">
                        שלח קוד מחדש
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">אימייל <span className="font-normal text-muted-foreground">(אופציונלי)</span></Label>
              <Input id="email" type="email" placeholder="you@email.com" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="username">שם משתמש</Label>
                <Input id="username" autoComplete="username" placeholder="israel" {...register('username')} />
                {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">סיסמה</Label>
                <Input id="password" type="password" autoComplete="new-password" placeholder="••••••••" {...register('password')} />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full font-semibold" disabled={loading || !verified}>
              {loading ? 'יוצר חשבון…' : 'צור חשבון והתחל'}
            </Button>
            {!verified && (
              <p className="text-center text-xs text-muted-foreground">אמת את מספר הטלפון כדי להמשיך</p>
            )}
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            כבר יש לך חשבון?{' '}
            <Link href="/login" className="font-semibold text-brand-strong hover:underline">
              התחברות
            </Link>
          </p>
        </div>
      </div>
    </Card>
  );
}
