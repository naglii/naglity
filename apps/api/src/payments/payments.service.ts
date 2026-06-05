import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { FakePaymentProvider } from './fake.provider.js';
import type { PaymentProvider } from './payment-provider.interface.js';

const PLATFORM_FEE = 0.1; // platform keeps 10%, driver gets 90%
const netCents = (gross: number) => Math.round(gross * (1 - PLATFORM_FEE));

const CARD_BRANDS = ['Visa', 'Mastercard', 'Isracard'];
const rand4 = () => String(Math.floor(1000 + Math.random() * 9000));
const randBrand = () => CARD_BRANDS[Math.floor(Math.random() * CARD_BRANDS.length)];

export type EscrowStatus = 'NONE' | 'IN_ESCROW' | 'RELEASED' | 'REFUNDED';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly provider: PaymentProvider;

  constructor(private prisma: PrismaService) {
    // Select the provider. Only "fake" is wired today; Stripe slots in here
    // behind the same interface once test keys exist.
    const name = process.env['PAYMENTS_PROVIDER'] ?? 'fake';
    switch (name) {
      // case 'stripe': this.provider = new StripePaymentProvider(); break;
      default:
        this.provider = new FakePaymentProvider();
    }
    this.logger.log(`Payments provider: ${this.provider.name}`);
  }

  get providerName() {
    return this.provider.name;
  }

  // ── Billing (business card on file) ────────────────────────────────────────

  /**
   * Put a payment method on file for a business. With the fake provider this
   * just flips the flag; with Stripe this becomes a SetupIntent + Payment
   * Element confirmed client-side.
   */
  async setupBusinessPaymentMethod(businessId: string) {
    const business = await this.prisma.business.update({
      where: { id: businessId },
      data: {
        stripeCustomerId: `fake_cus_${businessId}`,
        hasPaymentMethod: true,
        cardBrand: randBrand(),
        cardLast4: rand4(),
      },
    });
    return {
      hasPaymentMethod: business.hasPaymentMethod,
      provider: this.provider.name,
      cardBrand: business.cardBrand,
      cardLast4: business.cardLast4,
    };
  }

  /** Total currently held in escrow for a business (charged, not yet released). */
  async getBusinessEscrowHeld(businessId: string) {
    const jobs = await this.prisma.job.findMany({
      where: { businessId, status: { in: ['ACCEPTED', 'IN_PROGRESS'] as any } },
      select: { grossPriceCents: true, payments: { select: { type: true, status: true } } },
    });
    let held = 0;
    for (const j of jobs as any[]) {
      if (PaymentsService.escrowStatus(j.payments) === 'IN_ESCROW') held += j.grossPriceCents;
    }
    return held;
  }

  /** Charge/refund history for a business (mirrors the provider's billing). */
  async getBusinessTransactions(businessId: string) {
    const payments = await this.prisma.payment.findMany({
      where: { type: { in: ['CHARGE', 'REFUND'] }, job: { businessId } },
      include: { job: { select: { id: true, title: true, scheduledAt: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return payments.map((p: any) => ({
      id: p.id,
      jobId: p.jobId,
      jobTitle: p.job.title,
      type: p.type,
      amountCents: p.amountCents,
      status: p.status,
      createdAt: p.createdAt,
    }));
  }

  /** Remove the business's payment method (so they must re-add to post jobs). */
  async removeBusinessPaymentMethod(businessId: string) {
    const business = await this.prisma.business.update({
      where: { id: businessId },
      data: { hasPaymentMethod: false, stripeCustomerId: null, cardBrand: null, cardLast4: null },
    });
    return { hasPaymentMethod: business.hasPaymentMethod, provider: this.provider.name };
  }

  // ── Driver payout account ──────────────────────────────────────────────────

  async setupDriverPayoutAccount(driverId: string) {
    const driver = await this.prisma.driver.update({
      where: { id: driverId },
      data: { stripeAccountId: `fake_acct_${driverId}`, payoutsEnabled: true, payoutLast4: rand4() },
    });
    return { payoutsEnabled: driver.payoutsEnabled, provider: this.provider.name, payoutLast4: driver.payoutLast4 };
  }

  async removeDriverPayoutAccount(driverId: string) {
    const driver = await this.prisma.driver.update({
      where: { id: driverId },
      data: { stripeAccountId: null, payoutsEnabled: false, payoutLast4: null },
    });
    return { payoutsEnabled: driver.payoutsEnabled, provider: this.provider.name };
  }

  // ── Admin: full transactions ledger ────────────────────────────────────────

  async getAllTransactions() {
    const payments = await this.prisma.payment.findMany({
      include: {
        job: {
          select: {
            id: true,
            title: true,
            business: { select: { name: true } },
            driver: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });
    return payments.map((p: any) => ({
      id: p.id,
      jobId: p.jobId,
      jobTitle: p.job.title,
      businessName: p.job.business?.name ?? null,
      driverName: p.job.driver?.name ?? null,
      type: p.type,
      amountCents: p.amountCents,
      status: p.status,
      provider: p.provider,
      providerRef: p.providerRef,
      createdAt: p.createdAt,
    }));
  }

  // ── Money movements tied to a job ──────────────────────────────────────────

  /** Charge the business when a driver accepts. Throws if it fails. */
  async chargeForJob(job: { id: string; grossPriceCents: number }, business: { stripeCustomerId: string | null }) {
    const payment = await this.prisma.payment.create({
      data: { jobId: job.id, type: 'CHARGE', amountCents: job.grossPriceCents, status: 'PENDING', provider: this.provider.name },
    });
    try {
      const res = await this.provider.chargeBusiness({
        amountCents: job.grossPriceCents,
        jobId: job.id,
        customerRef: business.stripeCustomerId,
        idempotencyKey: `charge_${job.id}`,
      });
      return this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'SUCCEEDED', providerRef: res.ref },
      });
    } catch (err: any) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', error: String(err?.message ?? err) },
      });
      throw err;
    }
  }

  /** Release the driver's 90% on completion. Idempotent + best-effort (logged, not thrown). */
  async releaseToDriver(job: { id: string; grossPriceCents: number }, driver: { stripeAccountId: string | null }) {
    const already = await this.prisma.payment.findFirst({
      where: { jobId: job.id, type: 'TRANSFER', status: 'SUCCEEDED' },
    });
    if (already) return already; // never transfer twice

    const amount = netCents(job.grossPriceCents);
    const payment = await this.prisma.payment.create({
      data: { jobId: job.id, type: 'TRANSFER', amountCents: amount, status: 'PENDING', provider: this.provider.name },
    });
    try {
      const res = await this.provider.transferToDriver({ amountCents: amount, jobId: job.id, destinationRef: driver.stripeAccountId });
      return this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'SUCCEEDED', providerRef: res.ref } });
    } catch (err: any) {
      await this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED', error: String(err?.message ?? err) } });
      this.logger.error(`Transfer failed for job ${job.id}: ${err?.message ?? err}`);
      return null;
    }
  }

  /** Refund the business if the job was charged. Idempotent + best-effort. */
  async refundForJob(jobId: string) {
    const alreadyRefunded = await this.prisma.payment.findFirst({
      where: { jobId, type: 'REFUND', status: 'SUCCEEDED' },
    });
    if (alreadyRefunded) return alreadyRefunded; // never refund twice

    const charge = await this.prisma.payment.findFirst({
      where: { jobId, type: 'CHARGE', status: 'SUCCEEDED' },
      orderBy: { createdAt: 'desc' },
    });
    if (!charge || !charge.providerRef) return null; // never charged → nothing to refund

    const payment = await this.prisma.payment.create({
      data: { jobId, type: 'REFUND', amountCents: charge.amountCents, status: 'PENDING', provider: this.provider.name },
    });
    try {
      const res = await this.provider.refund({ chargeRef: charge.providerRef, amountCents: charge.amountCents });
      return this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'SUCCEEDED', providerRef: res.ref } });
    } catch (err: any) {
      await this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED', error: String(err?.message ?? err) } });
      this.logger.error(`Refund failed for job ${jobId}: ${err?.message ?? err}`);
      return null;
    }
  }

  /** Derive a simple escrow status from a job's payment rows. */
  static escrowStatus(payments: { type: string; status: string }[]): EscrowStatus {
    const ok = (t: string) => payments.some((p) => p.type === t && p.status === 'SUCCEEDED');
    if (ok('REFUND')) return 'REFUNDED';
    if (ok('TRANSFER')) return 'RELEASED';
    if (ok('CHARGE')) return 'IN_ESCROW';
    return 'NONE';
  }
}
