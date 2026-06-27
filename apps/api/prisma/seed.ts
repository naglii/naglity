import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL']! });
const prisma = new PrismaClient({ adapter } as any);

async function upsertUser(data: {
  username: string;
  email?: string;
  password: string;
  role: 'ADMIN' | 'DRIVER' | 'BUSINESS';
}) {
  const existing = await prisma.user.findUnique({ where: { username: data.username } });
  if (existing) {
    console.log(`  ↳ ${data.username} already exists, skipping.`);
    return existing;
  }
  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      username: data.username,
      email: data.email,
      passwordHash,
      role: data.role,
    },
  });
  console.log(`  ✅ Created ${data.role} — username: ${data.username} / password: ${data.password}`);
  return user;
}

async function main() {
  console.log('Seeding users...\n');

  // ── Admin (default) ──────────────────────────────────────────────
  await upsertUser({
    username: 'admin',
    email: 'admin@naglity.com',
    password: 'Admin1234!',
    role: 'ADMIN',
  });

  // ── Islam Essa — Admin ───────────────────────────────────────────
  const islamEssa = await upsertUser({
    username: 'islamessa',
    email: 'islam.essa@naglity.com',
    password: '123456',
    role: 'ADMIN',
  });
  console.log(`     login: islamessa / 123456  (ADMIN)`);

  // ── Islam Majed — Driver ─────────────────────────────────────────
  const islamMajed = await upsertUser({
    username: 'islamajed',
    email: 'islam.majed@naglity.com',
    password: '123456',
    role: 'DRIVER',
  });
  if (islamMajed) {
    const existingDriver = await prisma.driver.findUnique({ where: { userId: islamMajed.id } });
    if (!existingDriver) {
      await prisma.driver.create({
        data: {
          userId: islamMajed.id,
          name: 'Islam Majed',
          phone: '+966500000001',
          vehicleNumber: 'DRV-001',
          vehicleType: 'crane_truck',
        },
      });
    }
    console.log(`     login: islamajed / 123456  (DRIVER)`);
  }

  // ── Kamel Essa — Business ────────────────────────────────────────
  const kamelEssa = await upsertUser({
    username: 'kamelessa',
    email: 'kamel.essa@naglity.com',
    password: '1234567',
    role: 'BUSINESS',
  });
  if (kamelEssa) {
    const existingBusiness = await prisma.business.findUnique({ where: { userId: kamelEssa.id } });
    if (!existingBusiness) {
      await prisma.business.create({
        data: {
          userId: kamelEssa.id,
          name: 'Kamel Essa',
          phone: '+966500000002',
          accountType: 'BUSINESS',
        },
      });
    }
    console.log(`     login: kamelessa / 1234567  (BUSINESS)`);
  }

  console.log('\nDone.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
