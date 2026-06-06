import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../shared/test-app';
import { resetDb } from '../shared/db';
import { makeAdmin, makeBusiness, login } from '../shared/factories';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Signup requests (e2e)', () => {
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

  it('lets anyone submit a signup request (201) and stores it unhandled', async () => {
    // arrange
    // (public endpoint, no auth)

    // act
    const res = await request(app.getHttpServer())
      .post('/api/signup-requests')
      .send({ type: 'DRIVER', name: 'Dan Cohen', phone: '0501234567' });

    // assert
    expect(res.status).toBe(201);
    const inDb = await prisma.signupRequest.findFirst({ where: { name: 'Dan Cohen' } });
    expect(inDb).toMatchObject({ type: 'DRIVER', handled: false });
  });

  it('rejects an invalid signup request (400)', async () => {
    // arrange
    // (missing name and phone)

    // act
    const res = await request(app.getHttpServer()).post('/api/signup-requests').send({ type: 'DRIVER' });

    // assert
    expect(res.status).toBe(400);
  });

  it('lets an admin list, mark handled, and delete a request', async () => {
    // arrange
    await request(app.getHttpServer())
      .post('/api/signup-requests')
      .send({ type: 'BUSINESS', name: 'Acme', businessName: 'Acme Ltd', phone: '0509999999' })
      .expect(201);
    const admin = await makeAdmin(prisma);
    const adminClient = await login(app, admin.username, admin.password);

    // act + assert — list
    const list = await adminClient.get('/api/admin/requests');
    expect(list.status).toBe(200);
    expect(list.body.length).toBe(1);
    const id = list.body[0].id;

    // act + assert — mark handled
    const handled = await adminClient.patch(`/api/admin/requests/${id}/handled`).send({ handled: true });
    expect(handled.status).toBe(200);
    expect((await prisma.signupRequest.findUnique({ where: { id } }))?.handled).toBe(true);

    // act + assert — delete
    const del = await adminClient.delete(`/api/admin/requests/${id}`);
    expect(del.status).toBe(200);
    expect(await prisma.signupRequest.count()).toBe(0);
  });

  it('forbids a non-admin from listing signup requests (403)', async () => {
    // arrange
    const biz = await makeBusiness(prisma, { withPaymentMethod: false });
    const owner = await login(app, biz.username, biz.password);

    // act
    const res = await owner.get('/api/admin/requests');

    // assert
    expect(res.status).toBe(403);
  });
});
