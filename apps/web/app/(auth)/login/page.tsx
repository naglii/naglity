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
import type { AuthUser } from '@/lib/auth';
import { queryClient } from '@/lib/queryClient';
import type { LoginResponse } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { OtpInput } from '@/components/auth/OtpInput';
import { BrandMark, CraneGlyph } from '@/components/layout/Logo';
import { Zap, ShieldCheck, CalendarClock, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';

const schema = z.object({
  identifier: z.string().min(1, 'שדה חובה'),
  password: z.string().min(1, 'שדה חובה'),
});
type FormData = z.infer<typeof schema>;

const features = [
  { icon: Zap, title: 'עבודות בזמן אמת', desc: 'התראות מיידיות על עבודות חדשות' },
  { icon: CalendarClock, title: 'לוח זמנים מסודר', desc: 'כל העבודות שלך לפי יום ושעה' },
  { icon: ShieldCheck, title: 'תשלום שקוף ובטוח', desc: 'יודעים בדיוק כמה מרוויחים' },
];

export default function LoginPage() {
  const router = useRouter();
  const [method, setMethod] = useState<'phone' | 'id'>('phone');

  // Wipe cached data from a previous session, then route by role.
  const completeLogin = (res: LoginResponse) => {
    queryClient.clear();
    setAuth(res.user as AuthUser);
    setToken(res.accessToken);
    switch (res.user.role) {
      case 'DRIVER': router.push('/driver/feed'); break;
      case 'BUSINESS': router.push('/business/jobs'); break;
      case 'ADMIN': router.push('/admin/drivers'); break;
    }
  };

  return (
    <Card className="w-full max-w-4xl overflow-hidden p-0 shadow-2xl">
      <div className="grid md:grid-cols-2">
        {/* ── Brand panel (desktop) — light brand wash ── */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-bl from-brand-soft via-card to-card p-8 md:flex md:border-e">
          {/* soft glow */}
          <div className="pointer-events-none absolute -top-20 -end-12 size-56 rounded-full bg-brand/15 blur-3xl" />

          <div className="relative flex items-center gap-2.5" dir="ltr">
            <span className="grid size-9 place-items-center rounded-xl bg-brand-soft ring-1 ring-brand/15">
              <CraneGlyph className="size-5 text-brand-strong" />
            </span>
            <span className="text-lg font-black tracking-tight text-foreground">Naglity.</span>
          </div>

          <div className="relative space-y-1.5">
            <h2 className="text-2xl font-bold leading-snug text-foreground">
              הזירה החכמה<br />ללוגיסטיקת מנופים
            </h2>
            <p className="text-sm text-muted-foreground">מחברים בין עסקים לנהגי מנופים — מהר, פשוט ובשקיפות מלאה.</p>
          </div>

          <ul className="relative space-y-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-strong ring-1 ring-brand/10">
                  <Icon className="size-4.5" />
                </span>
                <div>
                  <p className="text-sm font-semibold leading-tight text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground leading-tight">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Form panel ── */}
        <div className="flex flex-col justify-center p-8 sm:p-10">
          {/* mobile logo */}
          <div className="mb-6 flex flex-col items-center text-center md:hidden">
            <BrandMark className="size-12 mb-2" iconClassName="size-6" />
            <span className="text-xl font-black tracking-tight" dir="ltr">Naglity.</span>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold">ברוך הבא 👋</h1>
            <p className="mt-1 text-sm text-muted-foreground">התחבר לחשבון שלך כדי להמשיך</p>
          </div>

          <div className="mb-4 inline-flex w-full rounded-lg border bg-card p-0.5">
            {([['phone', 'כניסה עם טלפון'], ['id', 'סיסמה']] as const).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setMethod(val)}
                className={`flex-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${method === val ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {method === 'phone'
            ? <PhoneLogin onSuccess={completeLogin} />
            : <PasswordLogin onSuccess={completeLogin} />}

          <div className="mt-6 space-y-1.5 text-center text-sm text-muted-foreground">
            <p>
              צריך מנוף?{' '}
              <Link href="/register" className="font-semibold text-brand-strong hover:underline">
                פתח חשבון לקוח
              </Link>
            </p>
            <p>
              נהג מנוף או עסק?{' '}
              <Link href="/request-access" className="font-semibold text-brand-strong hover:underline">
                בקשת הצטרפות
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ── Passwordless phone login: phone → SMS code → session ── */
function PhoneLogin({ onSuccess }: { onSuccess: (r: LoginResponse) => void }) {
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const lastChecked = useRef('');

  const send = async () => {
    const p = phone.trim();
    if (p.length < 5) { toast.error('מספר טלפון לא תקין'); return; }
    setSending(true);
    try {
      await api.post('/auth/login/phone/send', { phone: p });
      setStep('code');
      setCode('');
      lastChecked.current = '';
      setResendIn(30);
      toast.success('קוד אימות נשלח ב-SMS (לבדיקה: 0000)');
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'שגיאה בשליחת הקוד');
    } finally {
      setSending(false);
    }
  };

  // Resend cooldown.
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  // Auto-verify each distinct 4-digit code.
  useEffect(() => {
    if (step !== 'code' || code.length < 4 || lastChecked.current === code) return;
    lastChecked.current = code;
    setVerifying(true);
    setVerified(false);
    api.post<LoginResponse>('/auth/login/phone/verify', { phone: phone.trim(), code })
      .then((r) => {
        setVerified(true);
        toast.success('מתחברים…');
        setTimeout(() => onSuccess(r.data), 500);
      })
      .catch(() => setVerified(false))
      .finally(() => setVerifying(false));
  }, [code, step, phone, onSuccess]);

  if (step === 'phone') {
    return (
      <form onSubmit={(e) => { e.preventDefault(); void send(); }} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="phone">מספר טלפון</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="050-0000000"
            inputMode="tel"
            autoComplete="tel"
            dir="ltr"
            className="text-center"
          />
          <p className="text-xs text-muted-foreground">נשלח קוד אימות חד-פעמי ב-SMS. אפשרי רק למספר מאומת.</p>
        </div>
        <Button type="submit" size="lg" className="w-full font-semibold" disabled={sending}>
          {sending ? 'שולח קוד…' : 'שלח קוד אימות'}
        </Button>
      </form>
    );
  }

  return (
    <div className="space-y-4 text-center">
      <p className="text-sm text-muted-foreground">
        שלחנו קוד בן 4 ספרות אל{' '}
        <bdi className="font-semibold text-foreground">{phone}</bdi>
        <button
          type="button"
          onClick={() => { setStep('phone'); setCode(''); setVerified(false); lastChecked.current = ''; }}
          className="ms-2 inline-flex items-center gap-1 text-xs text-brand-strong hover:underline"
        >
          <ArrowRight className="size-3" /> שנה מספר
        </button>
      </p>

      <OtpInput
        value={code}
        onChange={setCode}
        autoFocus
        disabled={verified}
        status={verified ? 'ok' : code.length >= 4 && !verifying ? 'error' : 'idle'}
      />

      <div className="flex items-center justify-center text-sm">
        {verifying ? (
          <span className="flex items-center gap-1.5 text-muted-foreground"><Loader2 className="size-4 animate-spin" /> מאמת…</span>
        ) : verified ? (
          <span className="flex items-center gap-1.5 font-semibold text-success"><CheckCircle2 className="size-4" /> מתחברים…</span>
        ) : code.length >= 4 ? (
          <span className="font-semibold text-destructive">קוד שגוי — נסה שוב</span>
        ) : (
          <span className="text-muted-foreground">הזן את הקוד מה-SMS</span>
        )}
      </div>

      <div>
        {resendIn > 0 ? (
          <span className="text-xs text-muted-foreground">ניתן לשלוח קוד שוב בעוד {resendIn} שניות</span>
        ) : (
          <Button variant="outline" size="sm" disabled={sending} onClick={send}>
            {sending ? 'שולח…' : 'שלח קוד מחדש'}
          </Button>
        )}
      </div>
    </div>
  );
}

/* ── Classic username/email + password ── */
function PasswordLogin({ onSuccess }: { onSuccess: (r: LoginResponse) => void }) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await api.post<LoginResponse>('/auth/login', data);
      onSuccess(res.data);
    } catch (err: any) {
      const status = err.response?.status;
      toast.error(
        status === 401
          ? 'שם משתמש או סיסמה שגויים'
          : (err.response?.data?.message ?? 'משהו השתבש, נסה שנית'),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="identifier">שם משתמש או אימייל</Label>
        <Input id="identifier" placeholder="שם משתמש או אימייל" autoComplete="username" {...register('identifier')} />
        {errors.identifier && <p className="text-xs text-destructive">{errors.identifier.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">סיסמה</Label>
        <Input id="password" type="password" placeholder="••••••••" autoComplete="current-password" {...register('password')} />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>
      <Button type="submit" size="lg" className="w-full font-semibold" disabled={loading}>
        {loading ? 'מתחבר…' : 'כניסה'}
      </Button>
    </form>
  );
}
