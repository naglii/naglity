import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './support/test-app';
import { resetDb } from './support/db';
import { makeBusiness, PASSWORD } from './support/factories';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth (e2e)', () => {
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

  it('logs in with valid credentials and returns a token, user and cookie', async () => {
    // arrange
    const { username } = await makeBusiness(prisma);

    // act
    const res = await request(app.getHttpServer()).post('/api/auth/login').send({ identifier: username, password: PASSWORD });

    // assert
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.user).toMatchObject({ username, role: 'BUSINESS' });
    expect(String(res.headers['set-cookie'])).toContain('access_token=');
  });

  it('rejects a wrong password with 401', async () => {
    // arrange
    const { username } = await makeBusiness(prisma);

    // act
    const res = await request(app.getHttpServer()).post('/api/auth/login').send({ identifier: username, password: 'wrong-password' });

    // assert
    expect(res.status).toBe(401);
  });

  it('rejects an unknown identifier with 401', async () => {
    // arrange
    // (no user exists)

    // act
    const res = await request(app.getHttpServer()).post('/api/auth/login').send({ identifier: 'ghost', password: PASSWORD });

    // assert
    expect(res.status).toBe(401);
  });

  it('blocks a protected route when no session cookie is sent (401)', async () => {
    // arrange
    // (not logged in)

    // act
    const res = await request(app.getHttpServer()).get('/api/businesses/me/profile');

    // assert
    expect(res.status).toBe(401);
  });
});
