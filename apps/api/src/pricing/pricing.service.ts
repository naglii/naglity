import { Injectable, Logger } from '@nestjs/common';
import { FakeLocationPricingProvider } from './provider/fake-location-pricing.provider.js';
import type { LocationPricingProvider, PriceEstimate } from './provider/pricing-provider.interface.js';

@Injectable()
export class PricingService {
  private readonly provider: LocationPricingProvider;

  constructor() {
    const name = process.env['PRICING_PROVIDER'] ?? 'fake';
    switch (name) {
      // case 'maps': this.provider = new MapsLocationPricingProvider(); break;
      default:
        this.provider = new FakeLocationPricingProvider();
    }
    new Logger(PricingService.name).log(`Pricing provider: ${this.provider.name}`);
  }

  /** Estimate a job's price from its route. */
  estimate(fromLocation: string, toLocation: string, craneCapacityTons?: number): Promise<PriceEstimate> {
    return this.provider.estimate(fromLocation, toLocation, craneCapacityTons);
  }
}
