import { INestApplication } from '@nestjs/common';
import { createTestApp } from '../shared/test-app';
import { resetDb } from '../shared/db';
import { makeBusiness, makeDriver, makeAdmin, makeJob, login, seedAcceptedJob } from '../shared/factories';
import { PrismaService } from '../../src/prisma/prisma.service';

const jobBody = (over: Record<string, unknown> = {}) => ({
  title: 'Move a crane',
  grossPriceCents: 100_000,
  scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  estimatedEndAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
  fromLocation: 'Tel Aviv',
  toLocation: 'Haifa',
  ...over,
});

describe('Jobs authorization & validation (e2e)', () => {
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

  // ── Role boundaries ────────────────────────────────────────────────────────

  it('forbids a BUSINESS from accepting a job (403)', async () => {
    // arrange
    const biz = await makeBusiness(prisma, { withPaymentMethod: true });
    const job = await makeJob(prisma, biz.business.id);
    const owner = await login(app, biz.username, biz.password);

    // act
    const res = await owner.post(`/api/jobs/${job.id}/accept`);

    // assert
    expect(res.status).toBe(403);
  });

  it('forbids a DRIVER from posting a job (403)', async () => {
    // arrange
    const drv = await makeDriver(prisma, { payoutsEnabled: true });
    const driver = await login(app, drv.username, drv.password);

    // act
    const res = await driver.post('/api/jobs').send(jobBody());

    // assert
    expect(res.status).toBe(403);
  });

  it('forbids a DRIVER from completing a job (403)', async () => {
    // arrange
    const { driverClient, job } = await seedAcceptedJob(app, prisma);

    // act
    const res = await driverClient.post(`/api/jobs/${job.id}/complete`);

    // assert
    expect(res.status).toBe(403);
  });

  // ── Cross-tenant ("not your job") ──────────────────────────────────────────

  it("forbids a business from completing another business's job (403)", async () => {
    // arrange
    const { job } = await seedAcceptedJob(app, prisma);
    const other = await makeBusiness(prisma, { withPaymentMethod: true });
    const intruder = await login(app, other.username, other.password);

    // act
    const res = await intruder.post(`/api/jobs/${job.id}/complete`);

    // assert
    expect(res.status).toBe(403);
    const inDb = await prisma.job.findUnique({ where: { id: job.id } });
    expect(inDb?.status).toBe('ACCEPTED');
  });

  it("forbids a business from deleting another business's job (403)", async () => {
    // arrange
    const owner = await makeBusiness(prisma, { withPaymentMethod: true });
    const job = await makeJob(prisma, owner.business.id);
    const other = await makeBusiness(prisma, { withPaymentMethod: true });
    const intruder = await login(app, other.username, other.password);

    // act
    const res = await intruder.delete(`/api/jobs/${job.id}`);

    // assert
    expect(res.status).toBe(403);
    const inDb = await prisma.job.findUnique({ where: { id: job.id } });
    expect(inDb?.status).toBe('OPEN');
  });

  // ── Receipt authorization ──────────────────────────────────────────────────

  it('lets the owner, the assigned driver and an admin read the receipt (200)', async () => {
    // arrange
    const { job, ownerClient, drv } = await seedAcceptedJob(app, prisma);
    const driverClient = await login(app, drv.username, drv.password);
    const admin = await makeAdmin(prisma);
    const adminClient = await login(app, admin.username, admin.password);

    // act
    const asOwner = await ownerClient.get(`/api/jobs/${job.id}/receipt`);
    const asDriver = await driverClient.get(`/api/jobs/${job.id}/receipt`);
    const asAdmin = await adminClient.get(`/api/jobs/${job.id}/receipt`);

    // assert
    expect(asOwner.status).toBe(200);
    expect(asOwner.body.invoiceNumber).toMatch(/^NG-/);
    expect(asDriver.status).toBe(200);
    expect(asAdmin.status).toBe(200);
  });

  it('forbids an unrelated business from reading the receipt (403)', async () => {
    // arrange
    const { job } = await seedAcceptedJob(app, prisma);
    const other = await makeBusiness(prisma, { withPaymentMethod: true });
    const intruder = await login(app, other.username, other.password);

    // act
    const res = await intruder.get(`/api/jobs/${job.id}/receipt`);

    // assert
    expect(res.status).toBe(403);
  });

  // ── Input validation & missing resources ───────────────────────────────────

  it('rejects creating a job with a missing required field (400)', async () => {
    // arrange
    const biz = await makeBusiness(prisma, { withPaymentMethod: true });
    const owner = await login(app, biz.username, biz.password);
    const { title, ...noTitle } = jobBody();

    // act
    const res = await owner.post('/api/jobs').send(noTitle);

    // assert
    expect(res.status).toBe(400);
    expect(await prisma.job.count()).toBe(0);
  });

  it('rejects creating a job with a non-positive price (400)', async () => {
    // arrange
    const biz = await makeBusiness(prisma, { withPaymentMethod: true });
    const owner = await login(app, biz.username, biz.password);

    // act
    const res = await owner.post('/api/jobs').send(jobBody({ grossPriceCents: -5 }));

    // assert
    expect(res.status).toBe(400);
  });

  it('returns 404 when a driver accepts a non-existent job', async () => {
    // arrange
    const drv = await makeDriver(prisma, { payoutsEnabled: true });
    const driver = await login(app, drv.username, drv.password);

    // act
    const res = await driver.post('/api/jobs/clnonexistentid000000000/accept');

    // assert
    expect(res.status).toBe(404);
  });
});
