import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import bcrypt from 'bcrypt';
import type { PrismaService } from '../../src/prisma/prisma.service';

export const PASSWORD = 'Test1234!';

let seq = 0;
const uniq = () => `${Date.now().toString(36)}${seq++}`;

/** Create a BUSINESS user (+ profile). `withPaymentMethod` lets it post jobs. */
export async function makeBusiness(prisma: PrismaService, opts: { withPaymentMethod?: boolean } = {}) {
  const username = `biz_${uniq()}`;
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const user = await prisma.user.create({
    data: {
      username,
      email: `${username}@test.com`,
      passwordHash,
      role: 'BUSINESS',
      business: {
        create: {
          name: 'Test Business',
          phone: '0500000000',
          hasPaymentMethod: opts.withPaymentMethod ?? false,
          stripeCustomerId: opts.withPaymentMethod ? `fake_cus_${username}` : null,
          cardBrand: opts.withPaymentMethod ? 'Visa' : null,
          cardLast4: opts.withPaymentMethod ? '4242' : null,
        },
      },
    },
    include: { business: true },
  });
  return { user, business: user.business!, username, password: PASSWORD };
}

/** Create a DRIVER user (+ profile). `payoutsEnabled` lets it accept jobs. */
export async function makeDriver(prisma: PrismaService, opts: { payoutsEnabled?: boolean } = {}) {
  const username = `drv_${uniq()}`;
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const user = await prisma.user.create({
    data: {
      username,
      email: `${username}@test.com`,
      passwordHash,
      role: 'DRIVER',
      driver: {
        create: {
          name: 'Test Driver',
          phone: '0521111111',
          vehicleNumber: '12-345-67',
          payoutsEnabled: opts.payoutsEnabled ?? false,
          stripeAccountId: opts.payoutsEnabled ? `fake_acct_${username}` : null,
          payoutLast4: opts.payoutsEnabled ? '6789' : null,
        },
      },
    },
    include: { driver: true },
  });
  return { user, driver: user.driver!, username, password: PASSWORD };
}

/** Create an ADMIN user. */
export async function makeAdmin(prisma: PrismaService) {
  const username = `adm_${uniq()}`;
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const user = await prisma.user.create({
    data: { username, email: `${username}@test.com`, passwordHash, role: 'ADMIN' },
  });
  return { user, username, password: PASSWORD };
}

/** Insert an OPEN job for a business (defaults: ₪1000 gross, scheduled in ~1h). */
export async function makeJob(prisma: PrismaService, businessId: string, overrides: Record<string, unknown> = {}) {
  const now = Date.now();
  return prisma.job.create({
    data: {
      businessId,
      title: 'Move a crane',
      grossPriceCents: 100_000,
      scheduledAt: new Date(now + 60 * 60 * 1000),
      estimatedEndAt: new Date(now + 3 * 60 * 60 * 1000),
      fromLocation: 'Tel Aviv',
      toLocation: 'Haifa',
      status: 'OPEN',
      ...overrides,
    } as any,
  });
}

/** A request builder pre-loaded with a logged-in user's auth cookie. */
export interface AuthedClient {
  token: string;
  get: (url: string) => request.Test;
  post: (url: string) => request.Test;
  delete: (url: string) => request.Test;
  patch: (url: string) => request.Test;
}

/**
 * Seed a job that a driver has already accepted (so it's ACCEPTED + charged into
 * escrow). Returns the business/driver, the job, and logged-in clients for each.
 * Pass `jobOverrides` (e.g. scheduledAt) to control timing-sensitive rules.
 */
export async function seedAcceptedJob(
  app: INestApplication,
  prisma: PrismaService,
  jobOverrides: Record<string, unknown> = {},
) {
  const biz = await makeBusiness(prisma, { withPaymentMethod: true });
  const drv = await makeDriver(prisma, { payoutsEnabled: true });
  const job = await makeJob(prisma, biz.business.id, jobOverrides);
  const driverClient = await login(app, drv.username, drv.password);
  await driverClient.post(`/api/jobs/${job.id}/accept`).expect(201);
  const ownerClient = await login(app, biz.username, biz.password);
  return { biz, drv, job, ownerClient, driverClient };
}

/** Log in over HTTP and return a client that carries the `access_token` cookie. */
export async function login(app: INestApplication, identifier: string, password: string): Promise<AuthedClient> {
  const server = app.getHttpServer();
  const res = await request(server).post('/api/auth/login').send({ identifier, password }).expect(200);
  const token = res.body.accessToken as string;
  const cookie = `access_token=${token}`;
  return {
    token,
    get: (url) => request(server).get(url).set('Cookie', cookie),
    post: (url) => request(server).post(url).set('Cookie', cookie),
    delete: (url) => request(server).delete(url).set('Cookie', cookie),
    patch: (url) => request(server).patch(url).set('Cookie', cookie),
  };
}
