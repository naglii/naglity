/**
 * Resolves the E2E database connection and forces safe test env BEFORE any app
 * module is imported (PrismaService reads DATABASE_URL at module load).
 *
 * Precedence: TEST_DATABASE_URL → local docker default (see docker-compose.yml).
 * We FORCE-set DATABASE_URL (not `??=`) so an inherited dev/prod URL in the shell
 * can never be used — and refuse to run against a non-local DB unless explicitly
 * allowed, so tests can never TRUNCATE a real database.
 */
const DEFAULT_TEST_DB = 'postgresql://naglity:naglity@localhost:5433/naglity_test';

const url = process.env.TEST_DATABASE_URL ?? DEFAULT_TEST_DB;
const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(url);

if (!isLocal && process.env.ALLOW_REMOTE_TEST_DB !== '1') {
  throw new Error(
    `Refusing to run E2E tests against a non-local database:\n  ${url}\n` +
      `Set ALLOW_REMOTE_TEST_DB=1 to override (E2E TRUNCATEs all tables between tests).`,
  );
}

process.env.DATABASE_URL = url;
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'e2e-test-secret-e2e-test-secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '24h';
process.env.PAYMENTS_PROVIDER = 'fake';
process.env.NODE_ENV = 'test';

export const TEST_DATABASE_URL = url;
