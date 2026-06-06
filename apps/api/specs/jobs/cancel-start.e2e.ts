import { INestApplication } from '@nestjs/common';
import { createTestApp } from '../shared/test-app';
import { resetDb } from '../shared/db';
import { makeDriver, login, seedAcceptedJob } from '../shared/factories';
import { PrismaService } from '../../src/prisma/prisma.service';

const DAY = 24 * 60 * 60 * 1000;
// A job scheduled a few days out (so same-day rules don't apply).
const futureDay = () => ({
  scheduledAt: new Date(Date.now() + 3 * DAY),
  estimatedEndAt: new Date(Date.now() + 3 * DAY + 2 * 60 * 60 * 1000),
});

describe('Job cancel & start (e2e)', () => {
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

  // ── Cancel (driver backs out) ──────────────────────────────────────────────

  it('lets the assigned driver cancel a future job: back to OPEN + refund issued', async () => {
    // arrange
    const { job, driverClient } = await seedAcceptedJob(app, prisma, futureDay());

    // act
    const res = await driverClient.post(`/api/jobs/${job.id}/cancel`);

    // assert
    expect(res.status).toBe(201);
    const inDb = await prisma.job.findUnique({ where: { id: job.id } });
    expect(inDb).toMatchObject({ status: 'OPEN', driverId: null });
    const refund = await prisma.payment.findFirst({ where: { jobId: job.id, type: 'REFUND' } });
    expect(refund).toMatchObject({ status: 'SUCCEEDED', amountCents: 100_000 });
  });

  it('forbids cancelling on the scheduled day (400)', async () => {
    // arrange — default seed schedules ~1h from now (today)
    const { job, driverClient } = await seedAcceptedJob(app, prisma);

    // act
    const res = await driverClient.post(`/api/jobs/${job.id}/cancel`);

    // assert
    expect(res.status).toBe(400);
    const inDb = await prisma.job.findUnique({ where: { id: job.id } });
    expect(inDb?.status).toBe('ACCEPTED');
  });

  it("forbids a different driver from cancelling someone else's job (403)", async () => {
    // arrange
    const { job } = await seedAcceptedJob(app, prisma, futureDay());
    const other = await makeDriver(prisma, { payoutsEnabled: true });
    const otherDriver = await login(app, other.username, other.password);

    // act
    const res = await otherDriver.post(`/api/jobs/${job.id}/cancel`);

    // assert
    expect(res.status).toBe(403);
  });

  it('rejects cancelling a job that is no longer ACCEPTED (409)', async () => {
    // arrange — accept (today) then start so it becomes IN_PROGRESS
    const { job, driverClient } = await seedAcceptedJob(app, prisma);
    await driverClient.post(`/api/jobs/${job.id}/start`).expect(201);

    // act
    const res = await driverClient.post(`/api/jobs/${job.id}/cancel`);

    // assert
    expect(res.status).toBe(409);
  });

  // ── Start ──────────────────────────────────────────────────────────────────

  it('lets the assigned driver start an accepted job scheduled today (IN_PROGRESS)', async () => {
    // arrange
    const { job, driverClient } = await seedAcceptedJob(app, prisma);

    // act
    const res = await driverClient.post(`/api/jobs/${job.id}/start`);

    // assert
    expect(res.status).toBe(201);
    const inDb = await prisma.job.findUnique({ where: { id: job.id } });
    expect(inDb?.status).toBe('IN_PROGRESS');
  });

  it('forbids starting a job before its scheduled day (400)', async () => {
    // arrange
    const { job, driverClient } = await seedAcceptedJob(app, prisma, futureDay());

    // act
    const res = await driverClient.post(`/api/jobs/${job.id}/start`);

    // assert
    expect(res.status).toBe(400);
    const inDb = await prisma.job.findUnique({ where: { id: job.id } });
    expect(inDb?.status).toBe('ACCEPTED');
  });

  it('rejects starting a job that is not ACCEPTED (409)', async () => {
    // arrange — start once (IN_PROGRESS) then start again
    const { job, driverClient } = await seedAcceptedJob(app, prisma);
    await driverClient.post(`/api/jobs/${job.id}/start`).expect(201);

    // act
    const res = await driverClient.post(`/api/jobs/${job.id}/start`);

    // assert
    expect(res.status).toBe(409);
  });

  it("forbids a different driver from starting someone else's job (403)", async () => {
    // arrange
    const { job } = await seedAcceptedJob(app, prisma);
    const other = await makeDriver(prisma, { payoutsEnabled: true });
    const otherDriver = await login(app, other.username, other.password);

    // act
    const res = await otherDriver.post(`/api/jobs/${job.id}/start`);

    // assert
    expect(res.status).toBe(403);
  });
});
