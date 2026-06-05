import { INestApplication } from '@nestjs/common';
import { createTestApp } from './support/test-app';
import { resetDb } from './support/db';
import { makeBusiness, makeDriver, makeJob, login } from './support/factories';
import { PrismaService } from '../src/prisma/prisma.service';

/** A valid create-job payload; override any field per test. */
const jobBody = (over: Record<string, unknown> = {}) => ({
  title: 'Move a crane',
  grossPriceCents: 100_000,
  scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  estimatedEndAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
  fromLocation: 'Tel Aviv',
  toLocation: 'Haifa',
  ...over,
});

describe('Job lifecycle (e2e)', () => {
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

  it('lets a business with a payment method post a job (201, OPEN, 90% net)', async () => {
    // arrange
    const biz = await makeBusiness(prisma, { withPaymentMethod: true });
    const owner = await login(app, biz.username, biz.password);

    // act
    const res = await owner.post('/api/jobs').send(jobBody());

    // assert
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ status: 'OPEN', grossPriceCents: 100_000, netPriceCents: 90_000 });
    const inDb = await prisma.job.findUnique({ where: { id: res.body.id } });
    expect(inDb?.status).toBe('OPEN');
  });

  it('rejects posting a job without a payment method (400) and writes no job', async () => {
    // arrange
    const biz = await makeBusiness(prisma, { withPaymentMethod: false });
    const owner = await login(app, biz.username, biz.password);

    // act
    const res = await owner.post('/api/jobs').send(jobBody());

    // assert
    expect(res.status).toBe(400);
    expect(await prisma.job.count()).toBe(0);
  });

  it('moves a job to ACCEPTED and charges the business into escrow when a driver accepts', async () => {
    // arrange
    const biz = await makeBusiness(prisma, { withPaymentMethod: true });
    const drv = await makeDriver(prisma, { payoutsEnabled: true });
    const job = await makeJob(prisma, biz.business.id);
    const driver = await login(app, drv.username, drv.password);

    // act
    const res = await driver.post(`/api/jobs/${job.id}/accept`);

    // assert
    expect(res.status).toBe(201);
    const inDb = await prisma.job.findUnique({ where: { id: job.id } });
    expect(inDb).toMatchObject({ status: 'ACCEPTED', driverId: drv.driver.id });
    const charge = await prisma.payment.findFirst({ where: { jobId: job.id, type: 'CHARGE' } });
    expect(charge).toMatchObject({ status: 'SUCCEEDED', amountCents: 100_000 });
  });

  it('blocks a driver without a payout account from accepting (400) and keeps the job OPEN', async () => {
    // arrange
    const biz = await makeBusiness(prisma, { withPaymentMethod: true });
    const drv = await makeDriver(prisma, { payoutsEnabled: false });
    const job = await makeJob(prisma, biz.business.id);
    const driver = await login(app, drv.username, drv.password);

    // act
    const res = await driver.post(`/api/jobs/${job.id}/accept`);

    // assert
    expect(res.status).toBe(400);
    const inDb = await prisma.job.findUnique({ where: { id: job.id } });
    expect(inDb?.status).toBe('OPEN');
    expect(await prisma.payment.count({ where: { jobId: job.id } })).toBe(0);
  });

  it('rejects accepting a job another driver already took (409)', async () => {
    // arrange
    const biz = await makeBusiness(prisma, { withPaymentMethod: true });
    const first = await makeDriver(prisma, { payoutsEnabled: true });
    const second = await makeDriver(prisma, { payoutsEnabled: true });
    const job = await makeJob(prisma, biz.business.id);
    await (await login(app, first.username, first.password)).post(`/api/jobs/${job.id}/accept`).expect(201);
    const secondDriver = await login(app, second.username, second.password);

    // act
    const res = await secondDriver.post(`/api/jobs/${job.id}/accept`);

    // assert
    expect(res.status).toBe(409);
  });

  it('releases the driver payout and marks the job PAID on completion', async () => {
    // arrange
    const biz = await makeBusiness(prisma, { withPaymentMethod: true });
    const drv = await makeDriver(prisma, { payoutsEnabled: true });
    const job = await makeJob(prisma, biz.business.id);
    await (await login(app, drv.username, drv.password)).post(`/api/jobs/${job.id}/accept`).expect(201);
    const owner = await login(app, biz.username, biz.password);

    // act
    const res = await owner.post(`/api/jobs/${job.id}/complete`);

    // assert
    expect(res.status).toBe(201);
    const inDb = await prisma.job.findUnique({ where: { id: job.id } });
    expect(inDb?.status).toBe('PAID');
    const transfer = await prisma.payment.findFirst({ where: { jobId: job.id, type: 'TRANSFER' } });
    expect(transfer).toMatchObject({ status: 'SUCCEEDED', amountCents: 90_000 });
  });

  it('lets a business delete an OPEN job (200, DELETED)', async () => {
    // arrange
    const biz = await makeBusiness(prisma, { withPaymentMethod: true });
    const job = await makeJob(prisma, biz.business.id);
    const owner = await login(app, biz.username, biz.password);

    // act
    const res = await owner.delete(`/api/jobs/${job.id}`);

    // assert
    expect(res.status).toBe(200);
    const inDb = await prisma.job.findUnique({ where: { id: job.id } });
    expect(inDb?.status).toBe('DELETED');
  });

  it('forbids deleting a booked job on its scheduled day (400) and keeps it ACCEPTED', async () => {
    // arrange — a job scheduled today, already accepted by a driver
    const biz = await makeBusiness(prisma, { withPaymentMethod: true });
    const drv = await makeDriver(prisma, { payoutsEnabled: true });
    const job = await makeJob(prisma, biz.business.id, {
      scheduledAt: new Date(),
      estimatedEndAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    });
    await (await login(app, drv.username, drv.password)).post(`/api/jobs/${job.id}/accept`).expect(201);
    const owner = await login(app, biz.username, biz.password);

    // act
    const res = await owner.delete(`/api/jobs/${job.id}`);

    // assert
    expect(res.status).toBe(400);
    const inDb = await prisma.job.findUnique({ where: { id: job.id } });
    expect(inDb?.status).toBe('ACCEPTED');
  });
});
