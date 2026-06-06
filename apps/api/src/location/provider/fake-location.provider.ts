import type { GeoPoint, LocationProvider, Place, RouteResult } from './location-provider.interface.js';

/** Israel bounding box — used to place unknown labels deterministically. */
const BBOX = { minLat: 29.5, maxLat: 33.3, minLng: 34.27, maxLng: 35.9 };

interface KnownPlace {
  label: string; // canonical Hebrew label
  lat: number;
  lng: number;
  aliases: string[]; // extra strings (English, short forms) that should match
}

// A spread of real Israeli cities so the map looks plausible. English aliases let
// existing jobs (e.g. "Tel Aviv", "Haifa") geocode to the right spot too.
const PLACES: KnownPlace[] = [
  { label: 'תל אביב-יפו', lat: 32.0853, lng: 34.7818, aliases: ['tel aviv', 'tlv', 'תל אביב', 'יפו'] },
  { label: 'ירושלים', lat: 31.7683, lng: 35.2137, aliases: ['jerusalem'] },
  { label: 'חיפה', lat: 32.794, lng: 34.9896, aliases: ['haifa'] },
  { label: 'באר שבע', lat: 31.2518, lng: 34.7913, aliases: ['beer sheva', 'beersheba'] },
  { label: 'אילת', lat: 29.5577, lng: 34.9519, aliases: ['eilat'] },
  { label: 'נתניה', lat: 32.3215, lng: 34.8532, aliases: ['netanya'] },
  { label: 'אשדוד', lat: 31.8044, lng: 34.6553, aliases: ['ashdod'] },
  { label: 'ראשון לציון', lat: 31.973, lng: 34.7925, aliases: ['rishon', 'rishon lezion'] },
  { label: 'פתח תקווה', lat: 32.084, lng: 34.8878, aliases: ['petah tikva', 'petach tikva'] },
  { label: 'חולון', lat: 32.0167, lng: 34.7792, aliases: ['holon'] },
  { label: 'רמת גן', lat: 32.07, lng: 34.8245, aliases: ['ramat gan'] },
  { label: 'הרצליה', lat: 32.1624, lng: 34.8443, aliases: ['herzliya'] },
  { label: 'כפר סבא', lat: 32.1858, lng: 34.9077, aliases: ['kfar saba'] },
  { label: 'רעננה', lat: 32.1848, lng: 34.8713, aliases: ['raanana'] },
  { label: 'מודיעין', lat: 31.8983, lng: 35.0104, aliases: ['modiin', "modi'in"] },
  { label: 'אשקלון', lat: 31.6688, lng: 34.5715, aliases: ['ashkelon'] },
  { label: 'נצרת', lat: 32.7021, lng: 35.2978, aliases: ['nazareth'] },
  { label: 'טבריה', lat: 32.7959, lng: 35.53, aliases: ['tiberias'] },
  { label: 'עכו', lat: 32.9281, lng: 35.082, aliases: ['akko', 'acre'] },
  { label: 'בת ים', lat: 32.0231, lng: 34.7503, aliases: ['bat yam'] },
  { label: 'רחובות', lat: 31.8948, lng: 34.8093, aliases: ['rehovot'] },
  { label: 'כרמיאל', lat: 32.9157, lng: 35.2953, aliases: ['karmiel'] },
  { label: 'צפת', lat: 32.965, lng: 35.4951, aliases: ['safed', 'tzfat'] },
  { label: 'דימונה', lat: 31.0686, lng: 35.0331, aliases: ['dimona'] },
  { label: 'אריאל', lat: 32.1058, lng: 35.1872, aliases: ['ariel'] },
  { label: 'נהריה', lat: 33.0085, lng: 35.0944, aliases: ['nahariya'] },
];

const norm = (s: string) => (s ?? '').trim().toLowerCase();

/** Stable 0..1 hash of a string (FNV-1a-ish) for deterministic fallbacks. */
function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
}

export class FakeLocationProvider implements LocationProvider {
  readonly name = 'fake';

  search(query: string): Place[] {
    const q = norm(query);
    if (!q) {
      // Empty query → a few popular cities so the dropdown is never blank.
      return PLACES.slice(0, 6).map(({ label, lat, lng }) => ({ label, lat, lng }));
    }
    const scored = PLACES.map((p) => {
      const hay = [p.label, ...p.aliases].map(norm);
      const starts = hay.some((h) => h.startsWith(q));
      const includes = hay.some((h) => h.includes(q));
      return { p, score: starts ? 2 : includes ? 1 : 0 };
    }).filter((s) => s.score > 0);
    scored.sort((a, b) => b.score - a.score || a.p.label.localeCompare(b.p.label));
    return scored.slice(0, 6).map(({ p }) => ({ label: p.label, lat: p.lat, lng: p.lng }));
  }

  geocode(label: string): Place {
    const q = norm(label);
    const match = PLACES.find((p) => [p.label, ...p.aliases].map(norm).some((h) => h && (q.includes(h) || h.includes(q))));
    if (match) return { label, lat: match.lat, lng: match.lng };
    // Unknown label → deterministic point inside Israel so it still maps.
    const a = hash01(q);
    const b = hash01(q + '#');
    return {
      label,
      lat: BBOX.minLat + a * (BBOX.maxLat - BBOX.minLat),
      lng: BBOX.minLng + b * (BBOX.maxLng - BBOX.minLng),
    };
  }

  route(fromLabel: string, toLabel: string): RouteResult {
    const from = this.geocode(fromLabel);
    const to = this.geocode(toLabel);

    // Build a gently-curved polyline so it reads like a road, not a straight line.
    const steps = 28;
    const curve = (hash01(fromLabel + '→' + toLabel) - 0.5) * 0.25; // deterministic bend
    const dLat = to.lat - from.lat;
    const dLng = to.lng - from.lng;
    const polyline: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const bend = Math.sin(t * Math.PI) * curve;
      // offset perpendicular to the straight line
      polyline.push([from.lat + dLat * t - dLng * bend, from.lng + dLng * t + dLat * bend]);
    }

    const straight = haversineKm(from, to);
    const distanceKm = Math.round(straight * 1.3 * 10) / 10; // road factor
    const durationMin = Math.max(5, Math.round((distanceKm / 65) * 60) + 6); // ~65km/h + buffer

    return { from, to, distanceKm, durationMin, polyline };
  }
}
