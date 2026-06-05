# Environments (dev vs prod)

Goal: keep **dev** (local + a staging deploy) on the **current** database, and give
**production** a fully separate stack. It's not just two databases — these all differ
per environment:

| Concern | Dev | Prod | Notes |
|---|---|---|---|
| **Database** (`DATABASE_URL`) | current Neon DB | **new** Neon DB | prod starts empty |
| **`JWT_SECRET`** | dev secret | **new** secret | security — dev tokens must not work in prod |
| **API instance** | dev API (local + staging) | **separate** prod API process | each with its own env vars |
| **`FRONTEND_URL`** (API CORS/socket) | `http://localhost:3000` / staging URL | prod web domain | |
| **`NEXT_PUBLIC_API_URL`** (web) | dev API URL | prod API URL | web proxies `/api/*` here |
| **`NEXT_PUBLIC_SOCKET_URL`** (web) | dev API URL | prod API URL | Socket.IO |
| **`NODE_ENV`** | `development` | `production` | enables secure cookies |
| **`PAYMENTS_PROVIDER`** | `fake` | `fake` now → `stripe` later | test vs live keys when real |
| **Admin user** | dev seed | **own** strong admin | seed prod separately |

## One-time setup for production

### 1. Create the prod database
- In Neon, create a **brand-new project** named e.g. `naglity-prod` (separate from the
  current one, which stays as dev). Copy its pooled connection string → prod `DATABASE_URL`.
- Keep the **current** Neon project as the **dev** DB (it already has your data).

### 2. Generate prod secrets
```bash
openssl rand -base64 48   # → prod JWT_SECRET (do NOT reuse the dev one)
```

### 3. Apply the schema + seed admin to the prod DB
From `apps/api`, pointing at the **prod** DB just for these commands:
```bash
# PowerShell
$env:DATABASE_URL="<PROD_DATABASE_URL>"; npx prisma db push
$env:DATABASE_URL="<PROD_DATABASE_URL>"; npx prisma db seed   # creates the admin
```
Then change the prod admin password from the default.
> Note: this project uses `prisma db push` (no migration history). Before real users,
> consider switching to `prisma migrate` so schema changes are versioned across envs.

### 4. Deploy the prod API on Render (a SECOND web service)
You'll run **two** Render web services from this repo:

- **Existing service → make it DEV/staging.** Render dashboard → the service →
  Settings → Branch = `dev`; keep its env vars on the **current (dev) DB** + dev `JWT_SECRET`;
  set `FRONTEND_URL` to your dev/staging web URL.
- **New service → PROD.** "New +" → Web Service → same repo, Branch = `main`. Build/start
  commands stay the same. Add env vars from `apps/api/.env.example` with **prod** values:
  `DATABASE_URL`=prod DB, `JWT_SECRET`=new prod secret, `FRONTEND_URL`=prod web domain,
  `NODE_ENV=production`, `PAYMENTS_PROVIDER=fake`. Copy its public URL → **prod API URL**.

### 5. Configure the web on Vercel (one project, two scopes)
Project → Settings → Environment Variables, set per scope:
- **Production** → `NEXT_PUBLIC_API_URL` + `NEXT_PUBLIC_SOCKET_URL` = **prod** Render API URL.
- **Preview** → the **dev** Render API URL.

Optional: assign a branch domain (e.g. `dev.yourdomain.com` → the `dev` branch) so you
always have a stable deployed dev site, alongside the production domain on `main`.

### 6. Branch → environment mapping
- `main` → **Production** (Vercel Production + prod Render service + prod Neon project).
- `dev` → **Preview/staging** (Vercel Preview + dev Render service + current Neon DB).
- Local → `apps/api/.env` + `apps/web/.env.local` pointing at the **dev** DB/API.

Create the `dev` branch once: `git checkout -b dev && git push -u origin dev`.

## Local dev
```bash
cp apps/api/.env.example  apps/api/.env       # fill DATABASE_URL (dev), JWT_SECRET
cp apps/web/.env.example  apps/web/.env.local # already points at localhost:3001
pnpm --filter api dev
pnpm --filter web dev
```
