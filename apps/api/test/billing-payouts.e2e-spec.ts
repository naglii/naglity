import { INestApplication } from '@nestjs/common';
import { createTestApp } from './support/test-app';
import { resetDb } from './support/db';
import { makeBusiness, makeDriver, login, seedAcceptedJob } from './support/factories';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Billing & payouts (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(async () => {
    await resetDb(prisma);
  });

  // ── Business billing ───────────────────────────────────────────────────────

  it('lets a business add a payment method (201) and reflects it in status', async () => {
    // arrange
    const biz = await makeBusiness(prisma, { withPaymentMethod: false });
    const owner = await login(app, biz.username, biz.password);

    // act
    const res = await owner.post('/api/billing/payment-method');

    // assert
    expect(res.status).toBe(201);
    expect(res.body.hasPaymentMethod).toBe(true);
    const inDb = await prisma.business.findUnique({ where: { id: biz.business.id } });
    expect(inDb?.hasPaymentMethod).toBe(true);
  });

  it('lets a business remove its payment method (200)', async () => {
    // arrange
    const biz = await makeBusiness(prisma, { withPaymentMethod: true });
    const owner = await login(app, biz.username, biz.password);

    // act
    const res = await owner.delete('/api/billing/payment-method');

    // assert
    expect(res.status).toBe(200);
    expect(res.body.hasPaymentMethod).toBe(false);
    const inDb = await prisma.business.findUnique({ where: { id: biz.business.id } });
    expect(inDb?.hasPaymentMethod).toBe(false);
  });

  it('reports the amount held in escrow and a charge transaction after a job is accepted', async () => {
    // arrange
    const { ownerClient } = await seedAcceptedJob(app, prisma);

    // act
    const status = await ownerClient.get('/api/billing/status');
    const txs = await ownerClient.get('/api/billing/transactions');

    // assert
    expect(status.status).toBe(200);
    expect(status.body.heldInEscrowCents).toBe(100_000);
    expect(txs.body.some((t: any) => t.type === 'CHARGE' && t.status === 'SUCCEEDED')).toBe(true);
  });

  it('forbids a driver from reaching business billing (403)', async () => {
    // arrange
    const drv = await makeDriver(prisma, { payoutsEnabled: true });
    const driver = await login(app, drv.username, drv.password);

    // act
    const res = await driver.get('/api/billing/status');

    // assert
    expect(res.status).toBe(403);
  });

  // ── Driver payout account ──────────────────────────────────────────────────

  it('lets a driver enable a payout account (201) and reflects it in status', async () => {
    // arrange
    const drv = await makeDriver(prisma, { payoutsEnabled: false });
    const driver = await login(app, drv.username, drv.password);

    // act
    const res = await driver.post('/api/drivers/me/payout-account');

    // assert
    expect(res.status).toBe(201);
    expect(res.body.payoutsEnabled).toBe(true);
    const inDb = await prisma.driver.findUnique({ where: { id: drv.driver.id } });
    expect(inDb?.payoutsEnabled).toBe(true);
  });

  it('lets a driver remove its payout account (200)', async () => {
    // arrange
    const drv = await makeDriver(prisma, { payoutsEnabled: true });
    const driver = await login(app, drv.username, drv.password);

    // act
    const res = await driver.delete('/api/drivers/me/payout-account');

    // assert
    expect(res.status).toBe(200);
    expect(res.body.payoutsEnabled).toBe(false);
    const inDb = await prisma.driver.findUnique({ where: { id: drv.driver.id } });
    expect(inDb?.payoutsEnabled).toBe(false);
  });

  it('forbids a business from reaching driver payouts (403)', async () => {
    // arrange
    const biz = await makeBusiness(prisma, { withPaymentMethod: true });
    const owner = await login(app, biz.username, biz.password);

    // act
    const res = await owner.get('/api/drivers/me/payout-account');

    // assert
    expect(res.status).toBe(403);
  });
});
