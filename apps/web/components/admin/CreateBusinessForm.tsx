'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v3';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2 } from 'lucide-react';

const schema = z.object({
  name: z.string().min(1, 'שדה חובה'),
  phone: z.string().min(1, 'שדה חובה'),
  username: z.string().min(3, 'מינימום 3 תווים'),
  password: z.string().min(6, 'מינימום 6 תווים'),
  email: z.string().email('אימייל לא תקין').optional().or(z.literal('')),
});
type FormData = z.infer<typeof schema>;

export interface Prefill { name?: string; phone?: string; email?: string }
interface Props { onSuccess: () => void; prefill?: Prefill }

export function CreateBusinessForm({ onSuccess, prefill }: Props) {
  const [createdUsername, setCreatedUsername] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: prefill?.name ?? '', phone: prefill?.phone ?? '', email: prefill?.email ?? '' },
  });

  // Apply a prefill (from a signup request) that arrives after mount.
  useEffect(() => {
    if (prefill) {
      reset({ name: prefill.name ?? '', phone: prefill.phone ?? '', email: prefill.email ?? '' });
    }
  }, [prefill, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { ...data, email: data.email || undefined };
      await api.post('/admin/businesses', payload);
      setCreatedUsername(data.username);
      reset();
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'שגיאה ביצירת העסק');
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Business info */}
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">פרטי עסק</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>שם העסק</Label>
              <Input placeholder="מנופים בע״מ" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>טלפון</Label>
              <Input placeholder="03-0000000" {...register('phone')} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
          </div>
        </div>

        <Separator />

        {/* Account info */}
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">פרטי חשבון</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>שם משתמש</Label>
              <Input placeholder="craneworks" {...register('username')} />
              {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>סיסמה</Label>
              <Input type="password" placeholder="מינימום 6 תווים" {...register('password')} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="col-span-2 space-y-2">
              <Label>אימייל <span className="text-muted-foreground font-normal">(אופציונלי)</span></Label>
              <Input type="email" placeholder="contact@craneworks.com" {...register('email')} />
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? 'יוצר חשבון…' : 'צור חשבון עסק'}
        </Button>
      </form>

      <Dialog open={!!createdUsername} onOpenChange={() => setCreatedUsername(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-green-600" />
              חשבון העסק נוצר
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">העסק יכול להתחבר עם:</p>
          <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
            <p><span className="text-muted-foreground">שם משתמש: </span><strong>{createdUsername}</strong></p>
          </div>
          <Button className="w-full" onClick={() => setCreatedUsername(null)}>סגור</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
