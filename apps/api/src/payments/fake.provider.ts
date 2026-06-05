import { randomUUID } from 'crypto';
import type {
  PaymentProvider, ChargeParams, TransferParams, RefundParams, ProviderResult,
} from './payment-provider.interface.js';

/**
 * In-memory fake provider — simulates the full money flow instantly with no
 * external account, so the marketplace logic can be built and demoed before
 * wiring real Stripe. Always succeeds (unless there's no customer on file).
 */
export class FakePaymentProvider implements PaymentProvider {
  readonly name = 'fake';

  async chargeBusiness(params: ChargeParams): Promise<ProviderResult> {
    if (!params.customerRef) {
      throw new Error('No payment method on file for this business');
    }
    return { ref: `fake_ch_${randomUUID()}` };
  }

  async transferToDriver(_params: TransferParams): Promise<ProviderResult> {
    return { ref: `fake_tr_${randomUUID()}` };
  }

  async refund(_params: RefundParams): Promise<ProviderResult> {
    return { ref: `fake_re_${randomUUID()}` };
  }
}
