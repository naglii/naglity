'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import type { BillingStatus } from '@/types/api';
import { CreateJobForm } from '@/components/jobs/CreateJobForm';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard } from 'lucide-react';

export default function NewJobPage() {
  const { data, isLoading } = useQuery<BillingStatus>({
    queryKey: ['billing-status'],
    queryFn: () => api.get('/billing/status').then((r) => r.data),
  });

  if (isLoading) return <Skeleton className="mx-auto h-64 max-w-3xl rounded-xl" />;

  if (!data?.hasPaymentMethod) {
    return (
      <Card className="mx-auto max-w-xl p-0">
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="icon-chip size-14 bg-accent text-brand-strong">
            <CreditCard className="size-7" />
          </span>
          <p className="text-lg font-semibold">צריך אמצעי תשלום לפני פרסום עבודה</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            החיוב מתבצע רק כשנהג מקבל את העבודה, והכסף מוחזק בנאמנות עד להשלמה. הוסף אמצעי תשלום כדי להתחיל.
          </p>
          <Button className="mt-1 gap-1.5 font-semibold" render={<Link href="/business/billing" />} nativeButton={false}>
            <CreditCard className="size-4" />
            הוסף אמצעי תשלום
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <CreateJobForm />;
}
