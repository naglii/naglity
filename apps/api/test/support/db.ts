import type { PrismaService } from '../../src/prisma/prisma.service';

// Every table, child-first isn't needed thanks to CASCADE. Keep in sync with the schema.
const TABLES = ['Payment', 'JobEvent', 'Notification', 'Job', 'SignupRequest', 'Driver', 'Business', 'User'];

/** Wipe all rows so each test starts from a clean, deterministic database. */
export async function resetDb(prisma: PrismaService): Promise<void> {
  const list = TABLES.map((t) => `"${t}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE;`);
}
