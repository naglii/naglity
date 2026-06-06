# naglity
Crane trucks app

## Stack

- **API** — NestJS · `apps/api` · runs on `http://localhost:3001`
- **Web** — Next.js · `apps/web` · runs on `http://localhost:3000`

## Running

Install dependencies (once):
```sh
pnpm install
```

Run both services in parallel:
```sh
pnpm dev
```

Or run individually:
```sh
pnpm dev:api   # NestJS only
pnpm dev:web   # Next.js only
```

Build for production:
```sh
pnpm build
```

## Testing

The API has an end-to-end suite ([`apps/api/specs/`](apps/api/specs/)) that runs against a **real
local PostgreSQL** — it creates the tables, runs ~51 tests, and wipes data between each. It only
ever connects to `localhost`, so your dev/prod databases are never touched.

### One-time setup

1. **Install PostgreSQL** (Windows 11):
   ```powershell
   winget install -e --id PostgreSQL.PostgreSQL.17
   ```
   This installs a background service on port **5432**, superuser **`postgres`**, default password
   **`postgres`**.

2. **Create the test database** (PowerShell):
   ```powershell
   $env:PGPASSWORD = "postgres"
   & "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h localhost -c "CREATE DATABASE naglity_test;"
   ```
   (If your version folder isn't `17`, check `C:\Program Files\PostgreSQL` and adjust the path.)

### Run the tests

From the repo root, in PowerShell:
```powershell
$env:TEST_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/naglity_test"
pnpm --filter api test:e2e
```

The suite syncs the schema (`prisma db push`) and runs everything against that database.

> To avoid retyping the URL each session, persist it once (then reopen the terminal):
> ```powershell
> setx TEST_DATABASE_URL "postgresql://postgres:postgres@localhost:5432/naglity_test"
> ```

More detail (structure, helpers, CI): [`apps/api/specs/README.md`](apps/api/specs/README.md).
