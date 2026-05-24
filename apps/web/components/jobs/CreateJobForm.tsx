'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v3';
import { toast } from 'sonner';
import { SearchBox } from '@mapbox/search-js-react';
import api from '@/lib/api';
import type { CreateJobDto } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

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

interface Coords { lat: number | null; lng: number | null; }

function extractLocation(res: any): { address: string } & Coords {
  const feature = res?.features?.[0];
  if (!feature) return { address: '', lat: null, lng: null };
  const address =
    feature.properties?.full_address ??
    feature.properties?.place_formatted ??
    feature.properties?.name ??
    '';
  const coords = feature.geometry?.coordinates;
  return { address, lat: coords?.[1] ?? null, lng: coords?.[0] ?? null };
}

const searchBoxTheme = {
  variables: {
    fontFamily: 'inherit',
    colorPrimary: '#18181b',
    borderRadius: '0.375rem',
    border: '1px solid hsl(var(--border))',
  },
};

const searchBoxOptions = { language: 'he', country: 'IL' };

export function CreateJobForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { fromLocation: '', toLocation: '' },
  });

  const [fromCoords, setFromCoords] = useState<Coords>({ lat: null, lng: null });
  const [toCoords, setToCoords] = useState<Coords>({ lat: null, lng: null });

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
        fromLat: fromCoords.lat,
        fromLng: fromCoords.lng,
        toLocation: data.toLocation,
        toLat: toCoords.lat,
        toLng: toCoords.lng,
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
              <Controller
                control={control}
                name="fromLocation"
                render={({ field }) => (
                  <SearchBox
                    accessToken={MAPBOX_TOKEN}
                    value={field.value}
                    onChange={(val) => {
                      field.onChange(val);
                      setFromCoords({ lat: null, lng: null });
                    }}
                    onRetrieve={(res) => {
                      const { address, lat, lng } = extractLocation(res);
                      field.onChange(address);
                      setFromCoords({ lat, lng });
                    }}
                    onClear={() => {
                      field.onChange('');
                      setFromCoords({ lat: null, lng: null });
                    }}
                    options={searchBoxOptions}
                    placeholder="Origin address"
                    theme={searchBoxTheme}
                  />
                )}
              />
              {errors.fromLocation && (
                <p className="text-xs text-destructive">{errors.fromLocation.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>To location</Label>
              <Controller
                control={control}
                name="toLocation"
                render={({ field }) => (
                  <SearchBox
                    accessToken={MAPBOX_TOKEN}
                    value={field.value}
                    onChange={(val) => {
                      field.onChange(val);
                      setToCoords({ lat: null, lng: null });
                    }}
                    onRetrieve={(res) => {
                      const { address, lat, lng } = extractLocation(res);
                      field.onChange(address);
                      setToCoords({ lat, lng });
                    }}
                    onClear={() => {
                      field.onChange('');
                      setToCoords({ lat: null, lng: null });
                    }}
                    options={searchBoxOptions}
                    placeholder="Destination address"
                    theme={searchBoxTheme}
                  />
                )}
              />
              {errors.toLocation && (
                <p className="text-xs text-destructive">{errors.toLocation.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Price (₪)</Label>
            <Input type="number" min="1" step="1" placeholder="e.g. 500" {...register('grossPriceShekels')} />
            {errors.grossPriceShekels && (
              <p className="text-xs text-destructive">{errors.grossPriceShekels.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Start date & time</Label>
              <Input type="datetime-local" {...register('scheduledAt')} />
              {errors.scheduledAt && (
                <p className="text-xs text-destructive">{errors.scheduledAt.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Travel time (hours)</Label>
              <Input
                type="number"
                min="0.5"
                max="24"
                step="0.5"
                placeholder="e.g. 2.5"
                {...register('travelTimeHours')}
              />
              {errors.travelTimeHours && (
                <p className="text-xs text-destructive">{errors.travelTimeHours.message}</p>
              )}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Posting…' : 'Post Job'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
