'use client';

import { useState } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const schema = z.object({
  identifier: z.string().min(1, 'שדה חובה'),
  password: z.string().min(1, 'שדה חובה'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await api.post<LoginResponse>('/auth/login', data);
      setAuth(res.data.user);
      setToken(res.data.accessToken);
      switch (res.data.user.role) {
        case 'DRIVER': router.push('/driver/feed'); break;
        case 'BUSINESS': router.push('/business/jobs'); break;
        case 'ADMIN': router.push('/admin/drivers'); break;
      }
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
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-black tracking-tight flex items-baseline justify-center gap-0.5" dir="ltr">
            <span className="italic text-primary">N</span>aglity
            <span className="text-primary text-sm font-semibold not-italic ml-0.5 leading-none">●</span>
          </CardTitle>
        <CardDescription>לוגיסטיקת מנופים</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="identifier">שם משתמש או אימייל</Label>
            <Input id="identifier" placeholder="שם משתמש או אימייל" {...register('identifier')} />
            {errors.identifier && <p className="text-xs text-destructive">{errors.identifier.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">סיסמה</Label>
            <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'מתחבר…' : 'כניסה'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
