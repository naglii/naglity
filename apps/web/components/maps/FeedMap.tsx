'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Job, GeoPlace } from '@/types/api';
import { MapView, type MapMarker } from './MapView';
import { JobCard } from '@/components/jobs/JobCard';
import { MapPin } from 'lucide-react';

interface FeedMapProps {
  jobs: Job[];
  onAccept: (id: string) => void;
}

/** Driver feed as a map: each open job is a pin at its pickup; tap to see the card. */
export function FeedMap({ jobs, onAccept }: FeedMapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const labels = useMemo(() => jobs.map((j) => j.fromLocation), [jobs]);

  const { data: places = [] } = useQuery<GeoPlace[]>({
    queryKey: ['geocode-feed', labels],
    queryFn: () => api.post('/location/geocode', { labels }).then((r) => r.data),
    enabled: labels.length > 0,
    staleTime: 60_000,
  });

  const markers: MapMarker[] = jobs
    .map((j, i): MapMarker | null => {
      const p = places[i];
      if (!p) return null;
      return { lat: p.lat, lng: p.lng, kind: 'job', onClick: () => setSelectedId(j.id) };
    })
    .filter((m): m is MapMarker => m !== null);

  const selected = jobs.find((j) => j.id === selectedId) ?? null;

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border shadow-sm">
        <MapView height={440} markers={markers} />
      </div>
      {selected ? (
        <JobCard job={selected} onAccepted={onAccept} />
      ) : (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/40 py-6 text-sm text-muted-foreground">
          <MapPin className="size-4" />
          בחר עבודה על המפה כדי לראות פרטים ולקבל אותה
        </div>
      )}
    </div>
  );
}
