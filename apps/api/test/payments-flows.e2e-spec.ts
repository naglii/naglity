import { INestApplication } from '@nestjs/common';
import { createTestApp } from './support/test-app';
import { resetDb } from './support/db';
import { makeBusiness, makeDriver, makeJob, login, seedAcceptedJob } from './support/factories';
import { PrismaService } from '../src/prisma/prisma.service';

const DAY = 24 * 60 * 60 * 1000;
const futureDay = () => ({
  scheduledAt: new Date(Date.now() + 3 * DAY),
  estimatedEndAt: new Date(Date.now() + 3 * DAY + 2 * 60 * 60 * 1000),
});

describe('Payment flows (e2e)', () => {
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

  it('refunds the business when it deletes a booked (future) job', async () => {
    // arrange
    const { job, ownerClient } = await seedAcceptedJob(app, prisma, futureDay());

    // act
    const res = await ownerClient.delete(`/api/jobs/${job.id}`);

    // assert
    expect(res.status).toBe(200);
    const inDb = await prisma.job.findUnique({ where: { id: job.id } });
    expect(inDb?.status).toBe('DELETED');
    const refund = await prisma.payment.findFirst({ where: { jobId: job.id, type: 'REFUND' } });
    expect(refund).toMatchObject({ status: 'SUCCEEDED', amountCents: 100_000 });
  });

  it('completing an already-paid job is rejected (409) and never pays the driver twice', async () => {
    // arrange
    const { job, ownerClient } = await seedAcceptedJob(app, prisma);
    await ownerClient.post(`/api/jobs/${job.id}/complete`).expect(201);

    // act
    const res = await ownerClient.post(`/api/jobs/${job.id}/complete`);

    // assert
    expect(res.status).toBe(409);
    const transfers = await prisma.payment.count({ where: { jobId: job.id, type: 'TRANSFER', status: 'SUCCEEDED' } });
    expect(transfers).toBe(1);
  });

  it('reverts the job to OPEN and notifies the business when the charge is declined', async () => {
    // arrange — a business whose card "declines" (has the flag but no customer ref)
    const biz = await makeBusiness(prisma, { withPaymentMethod: true });
    await prisma.business.update({ where: { id: biz.business.id }, data: { stripeCustomerId: null } });
    const drv = await makeDriver(prisma, { payoutsEnabled: true });
    const job = await makeJob(prisma, biz.business.id);
    const driver = await login(app, drv.username, drv.password);

    // act
    const res = await driver.post(`/api/jobs/${job.id}/accept`);

    // assert
    expect(res.status).toBe(400);
    const inDb = await prisma.job.findUnique({ where: { id: job.id } });
    expect(inDb).toMatchObject({ status: 'OPEN', driverId: null });
    const failedCharge = await prisma.payment.findFirst({ where: { jobId: job.id, type: 'CHARGE', status: 'FAILED' } });
    expect(failedCharge).not.toBeNull();
    const notif = await prisma.notification.findFirst({ where: { userId: biz.user.id, type: 'PAYMENT_FAILED' } });
    expect(notif).not.toBeNull();
  });
});
