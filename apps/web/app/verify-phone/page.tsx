'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';
import { getUser, setAuth } from '@/lib/auth';
import { queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { OtpInput } from '@/components/auth/OtpInput';
import { ShieldCheck, CheckCircle2, Loader2, Pencil } from 'lucide-react';

export default function VerifyPhonePage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [editing, setEditing] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const lastChecked = useRef('');

  const send = async () => {
    setSending(true);
    try {
      await api.post('/auth/phone/send', {});
      setResendIn(30);
      setCode('');
      lastChecked.current = '';
      toast.success('קוד אימות נשלח ב-SMS (לבדיקה: 0000)');
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'שגיאה בשליחת הקוד');
    } finally {
      setSending(false);
    }
  };

  const changePhone = async () => {
    const p = newPhone.trim();
    if (p.length < 5) { toast.error('מספר טלפון לא תקין'); return; }
    setSending(true);
    try {
      const r = await api.post('/auth/phone/change', { phone: p });
      setPhone(r.data?.phone ?? p);
      setEditing(false);
      setVerified(false);
      setCode('');
      lastChecked.current = '';
      setResendIn(30);
      toast.success('קוד אימות נשלח למספר החדש (לבדיקה: 0000)');
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'שגיאה בעדכון המספר');
    } finally {
      setSending(false);
    }
  };

  // Auth guard + load the account phone, then auto-send the first code.
  useEffect(() => {
    if (!getUser()) { router.replace('/login'); return; }
    api.get('/businesses/me/profile')
      .then((r) => {
        if (r.data.phoneVerified) { router.replace('/business/jobs'); return; }
        setPhone(r.data.phone ?? '');
        void send();
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resend cooldown.
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  // Auto-verify each distinct 4-digit code.
  useEffect(() => {
    if (code.length < 4 || lastChecked.current === code) return;
    lastChecked.current = code;
    setVerifying(true);
    setVerified(false);
    api.post('/auth/phone/verify', { code })
      .then((r) => {
        const ok = !!r.data?.verified;
        setVerified(ok);
        if (ok) {
          const u = getUser();
          if (u) setAuth({ ...u, phoneVerified: true });
          queryClient.invalidateQueries({ queryKey: ['business-profile'] });
          toast.success('הטלפון אומת!');
          setTimeout(() => router.replace('/business/jobs'), 700);
        }
      })
      .catch(() => setVerified(false))
      .finally(() => setVerifying(false));
  }, [code, router]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute -top-24 -start-24 -z-10 size-96 rounded-full bg-brand/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -end-24 -z-10 size-96 rounded-full bg-brand-strong/15 blur-3xl" />

      <Card className="w-full max-w-md p-7 text-center shadow-2xl sm:p-9">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand-strong ring-1 ring-brand/15">
          <ShieldCheck className="size-7" />
        </span>
        <h1 className="mt-4 text-2xl font-bold">אימות מספר טלפון</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          שלחנו קוד אימות בן 4 ספרות אל{' '}
          <bdi className="font-semibold text-foreground">{phone || 'הטלפון שלך'}</bdi>
        </p>

        {!editing ? (
          <button
            type="button"
            onClick={() => { setNewPhone(phone); setEditing(true); }}
            className="mt-1.5 inline-flex items-center gap-1 text-xs text-brand-strong hover:underline"
          >
            <Pencil className="size-3" /> שנה מספר טלפון
          </button>
        ) : (
          <div className="mx-auto mt-3 flex max-w-xs items-center gap-2">
            <Input
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              inputMode="tel"
              placeholder="050-0000000"
              className="h-9 text-center"
              dir="ltr"
            />
            <Button size="sm" disabled={sending} onClick={changePhone}>שלח קוד</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>ביטול</Button>
          </div>
        )}

        <div className="mt-6">
          <OtpInput
            value={code}
            onChange={setCode}
            autoFocus
            disabled={verified}
            status={verified ? 'ok' : code.length >= 4 && !verifying ? 'error' : 'idle'}
          />
        </div>

        <div className="mt-3 flex items-center justify-center text-sm">
          {verifying ? (
            <span className="flex items-center gap-1.5 text-muted-foreground"><Loader2 className="size-4 animate-spin" /> מאמת…</span>
          ) : verified ? (
            <span className="flex items-center gap-1.5 font-semibold text-success"><CheckCircle2 className="size-4" /> הטלפון אומת — מעבירים אותך…</span>
          ) : code.length >= 4 ? (
            <span className="font-semibold text-destructive">קוד שגוי — נסה שוב</span>
          ) : (
            <span className="text-muted-foreground">הזן את הקוד מה-SMS</span>
          )}
        </div>

        <div className="mt-5">
          {resendIn > 0 ? (
            <span className="text-xs text-muted-foreground">ניתן לשלוח קוד שוב בעוד {resendIn} שניות</span>
          ) : (
            <Button variant="outline" size="sm" disabled={sending} onClick={send}>
              {sending ? 'שולח…' : 'שלח קוד מחדש'}
            </Button>
          )}
        </div>

        <Link href="/business/jobs" className="mt-5 inline-block text-xs text-muted-foreground hover:text-foreground hover:underline">
          אעשה זאת מאוחר יותר
        </Link>
      </Card>
    </div>
  );
}
