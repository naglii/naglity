import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL']! });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const existing = await prisma.user.findUnique({ where: { username: 'admin' } });
  if (existing) {
    console.log('Admin already exists, skipping seed.');
    return;
  }

  const passwordHash = await bcrypt.hash('Admin1234!', 10);
  await prisma.user.create({
    data: { username: 'admin', email: 'admin@naglity.com', passwordHash, role: 'ADMIN' },
  });
  console.log('✅ Admin user created — username: admin / password: Admin1234!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
