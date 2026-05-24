'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v3';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2 } from 'lucide-react';

const VEHICLE_TYPES = [
  { value: 'crane_truck', label: 'משאית מנוף' },
];

const schema = z.object({
  name: z.string().min(1, 'שדה חובה'),
  phone: z.string().min(1, 'שדה חובה'),
  vehicleType: z.string().min(1, 'שדה חובה'),
  vehicleNumber: z.string().min(1, 'שדה חובה'),
  username: z.string().min(3, 'מינימום 3 תווים'),
  password: z.string().min(6, 'מינימום 6 תווים'),
  email: z.string().email('אימייל לא תקין').optional().or(z.literal('')),
});
type FormData = z.infer<typeof schema>;

interface Props { onSuccess: () => void }

export function CreateDriverForm({ onSuccess }: Props) {
  const [createdUsername, setCreatedUsername] = useState<string | null>(null);

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { vehicleType: 'crane_truck' },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { ...data, email: data.email || undefined };
      await api.post('/admin/drivers', payload);
      setCreatedUsername(data.username);
      reset();
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'שגיאה ביצירת הנהג');
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal info */}
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">פרטים אישיים</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>שם מלא</Label>
              <Input placeholder="יוסי כהן" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>טלפון</Label>
              <Input placeholder="050-0000000" {...register('phone')} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
          </div>
        </div>

        <Separator />

        {/* Vehicle info */}
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">פרטי רכב</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>סוג רכב</Label>
              <Controller
                name="vehicleType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="בחר סוג" />
                    </SelectTrigger>
                    <SelectContent>
                      {VEHICLE_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.vehicleType && <p className="text-xs text-destructive">{errors.vehicleType.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>מספר רכב</Label>
              <Input placeholder="12-345-67" {...register('vehicleNumber')} />
              {errors.vehicleNumber && <p className="text-xs text-destructive">{errors.vehicleNumber.message}</p>}
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
              <Input placeholder="yossi_driver" {...register('username')} />
              {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>סיסמה</Label>
              <Input type="password" placeholder="מינימום 6 תווים" {...register('password')} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="col-span-2 space-y-2">
              <Label>אימייל <span className="text-muted-foreground font-normal">(אופציונלי)</span></Label>
              <Input type="email" placeholder="driver@example.com" {...register('email')} />
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? 'יוצר חשבון…' : 'צור חשבון נהג'}
        </Button>
      </form>

      <Dialog open={!!createdUsername} onOpenChange={() => setCreatedUsername(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-green-600" />
              חשבון הנהג נוצר
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">הנהג יכול להתחבר עם:</p>
          <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
            <p><span className="text-muted-foreground">שם משתמש: </span><strong>{createdUsername}</strong></p>
          </div>
          <Button className="w-full" onClick={() => setCreatedUsername(null)}>סגור</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
