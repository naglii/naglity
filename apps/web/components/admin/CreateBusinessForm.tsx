'use client';

import { useState } from 'react';
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
  name: z.string().min(1, 'Required'),
  phone: z.string().min(1, 'Required'),
  username: z.string().min(3, 'Min 3 characters'),
  password: z.string().min(6, 'Min 6 characters'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
});
type FormData = z.infer<typeof schema>;

interface Props { onSuccess: () => void }

export function CreateBusinessForm({ onSuccess }: Props) {
  const [createdUsername, setCreatedUsername] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { ...data, email: data.email || undefined };
      await api.post('/admin/businesses', payload);
      setCreatedUsername(data.username);
      reset();
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to create business');
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Business info */}
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Business Details</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Business Name</Label>
              <Input placeholder="Crane Works Ltd." {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input placeholder="03-0000000" {...register('phone')} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
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
              <Input placeholder="craneworks" {...register('username')} />
              {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" placeholder="Min 6 characters" {...register('password')} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Email <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input type="email" placeholder="contact@craneworks.com" {...register('email')} />
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create Business Account'}
        </Button>
      </form>

      <Dialog open={!!createdUsername} onOpenChange={() => setCreatedUsername(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-green-600" />
              Business account created
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">The business can now log in with:</p>
          <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm">
            <p><span className="text-muted-foreground">Username: </span><strong>{createdUsername}</strong></p>
          </div>
          <Button className="w-full" onClick={() => setCreatedUsername(null)}>Done</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
