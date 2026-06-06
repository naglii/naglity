import { INestApplication } from '@nestjs/common';
import { createTestApp } from '../shared/test-app';
import { resetDb } from '../shared/db';
import { makeAdmin, makeBusiness, login } from '../shared/factories';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Admin (e2e)', () => {
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

  it('lets an admin create a driver (201) and persists the user + driver profile', async () => {
    // arrange
    const admin = await makeAdmin(prisma);
    const client = await login(app, admin.username, admin.password);

    // act
    const res = await client.post('/api/admin/drivers').send({
      username: 'new_driver',
      password: 'secret123',
      name: 'Dan',
      phone: '0501234567',
      vehicleNumber: '11-222-33',
    });

    // assert
    expect(res.status).toBe(201);
    const created = await prisma.user.findUnique({ where: { username: 'new_driver' }, include: { driver: true } });
    expect(created?.role).toBe('DRIVER');
    expect(created?.driver?.name).toBe('Dan');
  });

  it('forbids a non-admin (business) from creating a driver (403) and writes nothing', async () => {
    // arrange
    const biz = await makeBusiness(prisma, { withPaymentMethod: true });
    const client = await login(app, biz.username, biz.password);

    // act
    const res = await client.post('/api/admin/drivers').send({
      username: 'blocked_driver',
      password: 'secret123',
      name: 'Nope',
      phone: '0500000000',
      vehicleNumber: '00-000-00',
    });

    // assert
    expect(res.status).toBe(403);
    expect(await prisma.user.findUnique({ where: { username: 'blocked_driver' } })).toBeNull();
  });
});
