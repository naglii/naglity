import { Injectable, Logger } from '@nestjs/common';
import { FakeLocationProvider } from './provider/fake-location.provider.js';
import type { GeoPoint, LocationProvider, RouteResult } from './provider/location-provider.interface.js';

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);
  private readonly provider: LocationProvider;

  constructor() {
    // Provider chosen by env, mirroring PAYMENTS_PROVIDER. Only "fake" is wired
    // today; a real Google/Mapbox provider slots in behind the same interface.
    const name = process.env['LOCATION_PROVIDER'] ?? 'fake';
    switch (name) {
      // case 'google': this.provider = new GoogleLocationProvider(); break;
      default:
        this.provider = new FakeLocationProvider();
    }
    this.logger.log(`Location provider: ${this.provider.name}`);
  }

  get providerName() {
    return this.provider.name;
  }

  search(query: string) {
    return this.provider.search(query ?? '');
  }

  geocode(label: string) {
    return this.provider.geocode(label ?? '');
  }

  route(from: string, to: string) {
    return this.provider.route(from ?? '', to ?? '');
  }

  /** Interpolate a point along the route's polyline at `progress` (0..1). */
  positionAt(route: RouteResult, progress: number): GeoPoint {
    const pts = route.polyline;
    if (pts.length === 0) return { lat: 0, lng: 0 };
    const p = Math.min(1, Math.max(0, progress));

    // Cumulative segment lengths (planar approx is plenty for a fake).
    const seg: number[] = [0];
    for (let i = 1; i < pts.length; i++) {
      const [la, lo] = pts[i];
      const [pa, po] = pts[i - 1];
      seg.push(seg[i - 1] + Math.hypot(la - pa, lo - po));
    }
    const total = seg[seg.length - 1];
    if (total === 0) return { lat: pts[0][0], lng: pts[0][1] };

    const target = p * total;
    for (let i = 1; i < pts.length; i++) {
      if (seg[i] >= target) {
        const f = (target - seg[i - 1]) / (seg[i] - seg[i - 1] || 1);
        const [la, lo] = pts[i];
        const [pa, po] = pts[i - 1];
        return { lat: pa + (la - pa) * f, lng: po + (lo - po) * f };
      }
    }
    const [lastLat, lastLng] = pts[pts.length - 1];
    return { lat: lastLat, lng: lastLng };
  }
}
