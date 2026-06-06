'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { JobTracking } from '@/types/api';
import { MapView, type MapMarker } from './MapView';
import { formatDuration } from './RoutePreview';
import { Skeleton } from '@/components/ui/skeleton';
import { Truck, MapPin, Flag } from 'lucide-react';

/** Interpolate a point along the polyline at t (0..1) by cumulative length. */
function pointAt(poly: [number, number][], t: number): { lat: number; lng: number } {
  if (!poly.length) return { lat: 0, lng: 0 };
  const p = Math.min(1, Math.max(0, t));
  const seg = [0];
  for (let i = 1; i < poly.length; i++) {
    seg.push(seg[i - 1] + Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]));
  }
  const total = seg[seg.length - 1];
  if (!total) return { lat: poly[0][0], lng: poly[0][1] };
  const target = p * total;
  for (let i = 1; i < poly.length; i++) {
    if (seg[i] >= target) {
      const f = (target - seg[i - 1]) / (seg[i] - seg[i - 1] || 1);
      return { lat: poly[i - 1][0] + (poly[i][0] - poly[i - 1][0]) * f, lng: poly[i - 1][1] + (poly[i][1] - poly[i - 1][1]) * f };
    }
  }
  return { lat: poly[poly.length - 1][0], lng: poly[poly.length - 1][1] };
}

const SIM_MS = 26000; // how long the simulated drive takes to reach the destination

export function JobTrackingMap({ jobId, height = 440 }: { jobId: string; height?: number }) {
  const { data, isLoading } = useQuery<JobTracking>({
    queryKey: ['tracking', jobId],
    queryFn: () => api.get(`/location/tracking/${jobId}`).then((r) => r.data),
  });

  const [t, setT] = useState(0);
  const startRef = useRef<number | null>(null);

  // Animate the driver from the server's current progress to the destination.
  useEffect(() => {
    if (!data) return;
    const base = data.progress ?? 0;
    setT(base);
    startRef.current = null;
    let raf = 0;
    const tick = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const next = Math.min(1, base + (ts - startRef.current) / SIM_MS);
      setT(next);
      if (next < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [data]);

  if (isLoading || !data) {
    return <Skeleton className="rounded-2xl" style={{ height: height + 120 }} />;
  }

  const pos = pointAt(data.route.polyline, t);
  const etaMin = Math.max(0, Math.ceil(data.route.durationMin * (1 - t)));
  const arrived = t >= 1;
  const markers: MapMarker[] = [
    { lat: data.route.from.lat, lng: data.route.from.lng, kind: 'start' },
    { lat: data.route.to.lat, lng: data.route.to.lng, kind: 'end' },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border shadow-sm">
      <MapView height={height} route={data.route.polyline} markers={markers} live={pos} fit />
      <div className="space-y-3 border-t bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="icon-chip size-10 bg-accent text-brand-strong">
              <Truck className="size-5" />
            </span>
            <div>
              <p className="font-bold">{arrived ? 'הנהג הגיע ליעד 🎉' : 'הנהג בדרך'}</p>
              <p className="text-xs text-muted-foreground">
                {data.driverName ?? 'נהג'}
                {data.vehicleNumber ? ` · ${data.vehicleNumber}` : ''}
              </p>
            </div>
          </div>
          <div className="text-end">
            <p className="text-xs text-muted-foreground">{arrived ? 'סטטוס' : 'הגעה משוערת'}</p>
            <p className="text-lg font-bold text-brand-strong">{arrived ? 'הגיע' : formatDuration(etaMin)}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-brand-strong transition-[width] duration-300" style={{ width: `${Math.round(t * 100)}%` }} />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="size-3 text-success" /> {data.route.from.label}</span>
            <span className="flex items-center gap-1">{data.route.to.label} <Flag className="size-3 text-brand-strong" /></span>
          </div>
        </div>
      </div>
    </div>
  );
}
