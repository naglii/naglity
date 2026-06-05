import { execSync } from 'node:child_process';
import './test-env'; // forces a safe, local DATABASE_URL before we touch the DB

/**
 * Runs once before the whole E2E suite: applies the Prisma schema to the test
 * database so the tables exist. Assumes the DB is reachable (docker-compose
 * test-db locally, or a Postgres service container in CI).
 */
export default function globalSetup() {
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: process.env,
    cwd: process.cwd(), // apps/api when run via `pnpm --filter api test:e2e`
  });
}
