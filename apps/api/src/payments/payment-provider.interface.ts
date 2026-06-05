// Provider-agnostic payment interface. Swap fake ↔ stripe ↔ local PSP by
// implementing this and selecting it in PaymentsService — the rest of the app
// never talks to a provider directly.

export interface ProviderResult {
  ref: string;
}

export interface ChargeParams {
  amountCents: number;
  jobId: string;
  /** Provider customer id of the business (their saved card lives here). */
  customerRef: string | null;
  /** Prevents a retry from double-charging. */
  idempotencyKey: string;
}

export interface TransferParams {
  amountCents: number;
  jobId: string;
  /** Provider connected-account id of the driver. */
  destinationRef: string | null;
}

export interface RefundParams {
  chargeRef: string;
  amountCents: number;
}

export interface PaymentProvider {
  readonly name: string;

  /** Charge the business off-session (their card was saved earlier). */
  chargeBusiness(params: ChargeParams): Promise<ProviderResult>;

  /** Release funds from the platform balance to the driver. */
  transferToDriver(params: TransferParams): Promise<ProviderResult>;

  /** Refund a previous charge to the business. */
  refund(params: RefundParams): Promise<ProviderResult>;
}
