import { INestApplication } from '@nestjs/common';
import { createTestApp } from '../shared/test-app';
import { resetDb } from '../shared/db';
import { seedAcceptedJob } from '../shared/factories';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Notifications (e2e)', () => {
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

  it('creates a notification for the business when a driver accepts its job', async () => {
    // arrange
    const { ownerClient } = await seedAcceptedJob(app, prisma);

    // act
    const res = await ownerClient.get('/api/notifications');

    // assert
    expect(res.status).toBe(200);
    expect(res.body.some((n: any) => n.type === 'JOB_ACCEPTED_BY_DRIVER')).toBe(true);
  });

  it('marks all of a user notifications as read', async () => {
    // arrange
    const { ownerClient } = await seedAcceptedJob(app, prisma);

    // act
    const patch = await ownerClient.patch('/api/notifications/read');

    // assert
    expect(patch.status).toBe(200);
    const after = await ownerClient.get('/api/notifications');
    expect(after.body.every((n: any) => n.read === true)).toBe(true);
  });
});
