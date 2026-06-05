import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './support/test-app';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves the root route under the /api prefix', async () => {
    // arrange
    // (app is already booted)

    // act
    const res = await request(app.getHttpServer()).get('/api');

    // assert
    expect(res.status).toBe(200);
    expect(res.text).toBe('Hello World!');
  });
});
