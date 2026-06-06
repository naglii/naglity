'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { RouteResult } from '@/types/api';
import { MapView } from './MapView';
import { Skeleton } from '@/components/ui/skeleton';
import { Navigation, Clock, Map as MapIcon } from 'lucide-react';

interface RoutePreviewProps {
  from?: string;
  to?: string;
  height?: number;
  onRoute?: (route: RouteResult) => void;
  className?: string;
}

export function formatDuration(min: number): string {
  if (min < 60) return `${min} דק׳`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} שע׳ ${m} דק׳` : `${h} שע׳`;
}

export function RoutePreview({ from, to, height = 280, onRoute, className }: RoutePreviewProps) {
  const enabled = !!from?.trim() && !!to?.trim();

  const { data: route, isFetching } = useQuery<RouteResult>({
    queryKey: ['route', from, to],
    queryFn: () => api.get('/location/route', { params: { from, to } }).then((r) => r.data),
    enabled,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (route) onRoute?.(route);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route]);

  if (!enabled) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/40 text-center ${className ?? ''}`}
        style={{ height }}
      >
        <span className="icon-chip size-11 bg-accent text-brand-strong"><MapIcon className="size-5" /></span>
        <p className="mt-2 text-sm font-medium text-muted-foreground">בחר מוצא ויעד כדי לראות את המסלול</p>
      </div>
    );
  }

  if (isFetching && !route) {
    return <Skeleton className="rounded-xl" style={{ height }} />;
  }

  return (
    <div className={`overflow-hidden rounded-xl border ${className ?? ''}`}>
      <MapView
        height={height}
        interactive
        route={route?.polyline}
        markers={
          route
            ? [
                { lat: route.from.lat, lng: route.from.lng, kind: 'start' },
                { lat: route.to.lat, lng: route.to.lng, kind: 'end' },
              ]
            : []
        }
      />
      {route && (
        <div className="flex items-center justify-around gap-2 border-t bg-card px-3 py-2.5 text-sm">
          <span className="flex items-center gap-1.5 font-semibold">
            <Navigation className="size-4 text-brand-strong" />
            {route.distanceKm} ק״מ
          </span>
          <span className="h-5 w-px bg-border" />
          <span className="flex items-center gap-1.5 font-semibold">
            <Clock className="size-4 text-brand-strong" />
            {formatDuration(route.durationMin)}
          </span>
        </div>
      )}
    </div>
  );
}
