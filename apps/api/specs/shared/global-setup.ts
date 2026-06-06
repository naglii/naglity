import { execSync } from 'node:child_process';
import './test-env'; // forces a safe, local DATABASE_URL before we touch the DB

/**
 * Runs once before the whole E2E suite: syncs the test database to the CURRENT
 * schema.prisma. We use `db push` (not `migrate deploy`) because the project
 * evolves its schema with db push — the committed migration history is stale, so
 * `migrate deploy` would build an outdated DB. The test DB is ephemeral, so a
 * full push (accepting data loss) is exactly what we want.
 *
 * Assumes the DB is reachable (docker-compose test-db locally, or a Postgres
 * service container in CI).
 */
export default function globalSetup() {
  execSync('npx prisma db push --accept-data-loss', {
    stdio: 'inherit',
    env: process.env,
    cwd: process.cwd(), // apps/api when run via `pnpm --filter api test:e2e`
  });
}
