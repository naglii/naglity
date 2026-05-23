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
  { value: 'crane_truck', label: 'Crane Truck' },
];

const schema = z.object({
  name: z.string().min(1, 'Required'),
  phone: z.string().min(1, 'Required'),
  vehicleType: z.string().min(1, 'Required'),
  vehicleNumber: z.string().min(1, 'Required'),
  username: z.string().min(3, 'Min 3 characters'),
  password: z.string().min(6, 'Min 6 characters'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
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
      toast.error(err.response?.data?.message ?? 'Failed to create driver');
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal info */}
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Personal Details</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input placeholder="Yossi Cohen" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input placeholder="050-0000000" {...register('phone')} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
          </div>
        </div>

        <Separator />

        {/* Vehicle info */}
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vehicle Details</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Vehicle Type</Label>
              <Controller
                name="vehicleType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
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
              <Label>Vehicle Number</Label>
              <Input placeholder="12-345-67" {...register('vehicleNumber')} />
              {errors.vehicleNumber && <p className="text-xs text-destructive">{errors.vehicleNumber.message}</p>}
            </div>
          </div>
        </div>

        <Separator />

        {/* Account info */}
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account Credentials</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Username</Label>
              <Input placeholder="yossi_driver" {...register('username')} />
              {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" placeholder="Min 6 characters" {...register('password')} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Email <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input type="email" placeholder="driver@example.com" {...register('email')} />
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create Driver Account'}
        </Button>
      </form>

      <Dialog open={!!createdUsername} onOpenChange={() => setCreatedUsername(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-green-600" />
              Driver account created
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">The driver can now log in with:</p>
          <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
            <p><span className="text-muted-foreground">Username: </span><strong>{createdUsername}</strong></p>
          </div>
          <Button className="w-full" onClick={() => setCreatedUsername(null)}>Done</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
