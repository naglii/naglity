import { INestApplication } from '@nestjs/common';
import { createTestApp } from '../shared/test-app';
import { resetDb } from '../shared/db';
import { makeBusiness, makeDriver, makeAdmin, makeJob, login, seedAcceptedJob } from '../shared/factories';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Stats & feed (e2e)', () => {
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

  it('serves admin stats to an admin (200) but not to others (403)', async () => {
    // arrange
    const admin = await makeAdmin(prisma);
    const adminClient = await login(app, admin.username, admin.password);
    const biz = await makeBusiness(prisma, { withPaymentMethod: false });
    const owner = await login(app, biz.username, biz.password);

    // act
    const asAdmin = await adminClient.get('/api/stats/admin');
    const asBusiness = await owner.get('/api/stats/admin');

    // assert
    expect(asAdmin.status).toBe(200);
    expect(asBusiness.status).toBe(403);
  });

  it('shows OPEN jobs in the driver feed', async () => {
    // arrange
    const biz = await makeBusiness(prisma, { withPaymentMethod: true });
    const job = await makeJob(prisma, biz.business.id);
    const drv = await makeDriver(prisma, { payoutsEnabled: false });
    const driver = await login(app, drv.username, drv.password);

    // act
    const res = await driver.get('/api/drivers/me/feed');

    // assert
    expect(res.status).toBe(200);
    expect(res.body.some((j: any) => j.id === job.id)).toBe(true);
  });

  it('reflects a completed job in driver and business stats', async () => {
    // arrange — run a job all the way to PAID
    const { job, ownerClient, drv } = await seedAcceptedJob(app, prisma);
    await ownerClient.post(`/api/jobs/${job.id}/complete`).expect(201);
    const driver = await login(app, drv.username, drv.password);

    // act
    const driverStats = await driver.get('/api/drivers/me/stats');
    const businessStats = await ownerClient.get('/api/businesses/me/stats');

    // assert
    expect(driverStats.body.jobsByStatus.PAID).toBe(1);
    expect(driverStats.body.totalNetEarningsCents).toBe(90_000);
    expect(businessStats.body.jobsByStatus.PAID).toBe(1);
    expect(businessStats.body.totalGrossSpendCents).toBe(100_000);
  });
});
