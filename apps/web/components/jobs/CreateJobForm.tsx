'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v3';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { CreateJobDto } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const schema = z.object({
  title: z.string().min(1, 'Required'),
  description: z.string().optional(),
  grossPriceShekels: z.coerce.number().min(1, 'Minimum ₪1'),
  scheduledAt: z.string().min(1, 'Required'),
  travelTimeHours: z.coerce.number().min(0.5, 'Minimum 30 minutes').max(24, 'Maximum 24 hours'),
  fromLocation: z.string().min(1, 'Required'),
  toLocation: z.string().min(1, 'Required'),
});
type FormData = z.infer<typeof schema>;

export function CreateJobForm() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const scheduledAt = new Date(data.scheduledAt);
      const dto: CreateJobDto = {
        title: data.title,
        description: data.description,
        grossPriceCents: Math.round(data.grossPriceShekels * 100),
        scheduledAt: scheduledAt.toISOString(),
        estimatedEndAt: new Date(scheduledAt.getTime() + data.travelTimeHours * 60 * 60 * 1000).toISOString(),
        fromLocation: data.fromLocation,
        toLocation: data.toLocation,
      };
      await api.post('/jobs', dto);
      toast.success('Job posted successfully!');
      router.push('/business/jobs');
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to post job');
    }
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Post a New Job</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input placeholder="e.g. Crane lift – Tel Aviv port" {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Description (optional)</Label>
            <Textarea placeholder="Additional details…" rows={3} {...register('description')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>From location</Label>
              <Input placeholder="Origin address" {...register('fromLocation')} />
              {errors.fromLocation && <p className="text-xs text-destructive">{errors.fromLocation.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>To location</Label>
              <Input placeholder="Destination address" {...register('toLocation')} />
              {errors.toLocation && <p className="text-xs text-destructive">{errors.toLocation.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Price (₪)</Label>
            <Input type="number" min="1" step="1" placeholder="e.g. 500" {...register('grossPriceShekels')} />
            {errors.grossPriceShekels && <p className="text-xs text-destructive">{errors.grossPriceShekels.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Start date & time</Label>
              <Input type="datetime-local" {...register('scheduledAt')} />
              {errors.scheduledAt && <p className="text-xs text-destructive">{errors.scheduledAt.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Travel time (hours)</Label>
              <Input type="number" min="0.5" max="24" step="0.5" placeholder="e.g. 2.5" {...register('travelTimeHours')} />
              {errors.travelTimeHours && <p className="text-xs text-destructive">{errors.travelTimeHours.message}</p>}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Posting…' : 'Post Job'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
