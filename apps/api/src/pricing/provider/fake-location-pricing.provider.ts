import { Logger } from '@nestjs/common';
import type { LocationPricingProvider, PriceEstimate } from './pricing-provider.interface.js';

// Rate card (agorot). Tweak freely — these are the stub's pricing knobs.
export const BASE_FARE_CENTS = 25_000;      // ₪250 callout
export const PER_KM_CENTS = 1_500;          // ₪15 / km
export const PER_TON_CENTS = 2_000;         // ₪20 / ton of crane capacity
const MIN_KM = 5;
const MAX_KM = 60;

/** Stable digits/letters-insensitive key so the same address pair always prices the same. */
const normalize = (s: string) => (s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

/** Deterministic 32-bit hash (FNV-1a) — used to derive a stable pseudo-distance. */
function hash(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Offline pricing: there is no maps/distance integration yet, so this derives a
 * STABLE pseudo-distance from the address pair and prices base + per-km + per-ton.
 * Same inputs always yield the same price. Swap in a real maps-backed provider
 * (geocode + routing) behind LocationPricingProvider when ready — set PRICING_PROVIDER.
 */
export class FakeLocationPricingProvider implements LocationPricingProvider {
  readonly name = 'fake';
  private readonly logger = new Logger('FakePricing');

  async estimate(fromLocation: string, toLocation: string, craneCapacityTons = 0): Promise<PriceEstimate> {
    const key = `${normalize(fromLocation)}->${normalize(toLocation)}`;
    // Map the hash into [MIN_KM, MAX_KM], rounded to whole km.
    const distanceKm = MIN_KM + (hash(key) % ((MAX_KM - MIN_KM + 1)));
    const grossPriceCents =
      BASE_FARE_CENTS + distanceKm * PER_KM_CENTS + Math.max(0, craneCapacityTons) * PER_TON_CENTS;

    this.logger.debug(`Estimate ${key} | ${craneCapacityTons}t -> ${distanceKm}km = ${grossPriceCents}₪¢`);
    return { grossPriceCents, distanceKm };
  }
}
