'use client';

import { useParams, useRouter } from 'next/navigation';
import { JobTrackingMap } from '@/components/maps/JobTrackingMap';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function TrackPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => router.back()}>
          <ArrowRight className="size-4" />
          חזרה
        </Button>
        <div>
          <h1 className="text-xl font-bold">מעקב חי</h1>
          <p className="text-sm text-muted-foreground">מיקום הנהג בזמן אמת לאורך המסלול</p>
        </div>
      </div>

      <JobTrackingMap jobId={params.id} />
    </div>
  );
}
