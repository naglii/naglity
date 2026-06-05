# API E2E tests

These are **end-to-end** tests: they boot the full Nest app and assert real side
effects — HTTP status codes, response bodies, and rows written to a real Postgres.
No unit tests / mocks of the DB. The only thing stubbed is the Socket.IO gateway
(replaced with a no-op), since we assert HTTP + DB, not socket delivery.

## Run locally

You need a throwaway Postgres. The repo ships one via Docker:

```bash
docker compose up -d test-db          # starts Postgres on localhost:5433
pnpm --filter api test:e2e            # applies schema + runs the suite
```

> Note: the test DB is synced via `prisma db push` (matching how this project
> applies schema changes), not `migrate deploy` — the committed migration history
> is stale.

The suite **forces** a safe, local `DATABASE_URL` and refuses to run against a
non-local database (so it can never TRUNCATE your dev/prod data). To point it at a
remote test DB anyway (e.g. a Neon test branch):

```bash
TEST_DATABASE_URL=<url> ALLOW_REMOTE_TEST_DB=1 pnpm --filter api test:e2e
```

## How it fits together

| File | Role |
|---|---|
| `support/test-env.ts` | Forces a safe test `DATABASE_URL` before any app import (setupFiles). |
| `support/global-setup.ts` | Runs `prisma db push` once to sync the test DB to the current schema. |
| `support/test-app.ts` | Boots the app like prod (api prefix, cookies, validation), gateway no-op'd. |
| `support/db.ts` | `resetDb()` — TRUNCATEs all tables between tests for isolation. |
| `support/factories.ts` | `makeBusiness` / `makeDriver` / `makeAdmin` / `makeJob` + cookie-aware `login`. |
| `*.e2e-spec.ts` | The tests. Each `it` follows `// arrange // act // assert`. |

Tests run with `--runInBand` (serial) because they share one database.

## In CI

`.github/workflows/ci.yml` runs this suite against a Postgres **service container**
(`TEST_DATABASE_URL=postgres://…@localhost:5433/...`) — no Docker management needed.
