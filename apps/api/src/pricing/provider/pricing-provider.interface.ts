/** Route-based price estimate. */
export interface PriceEstimate {
  /** Total gross price the poster pays, in agorot (₪ * 100). */
  grossPriceCents: number;
  /** Estimated route distance in km (informational). */
  distanceKm: number;
}

/** Computes a job's price from its pickup/dropoff locations. Fake today; a real
 *  maps/distance-backed provider slots in behind this interface later (selected
 *  by PRICING_PROVIDER). */
export interface LocationPricingProvider {
  readonly name: string;
  estimate(fromLocation: string, toLocation: string, craneCapacityTons?: number): Promise<PriceEstimate>;
}
