# Naglity — Project Overview

## What is Naglity?

A **crane truck marketplace** — businesses post crane jobs, drivers (crane operators) bid on or accept them, and admins manage everything. It handles the full flow: job posting → offers → acceptance → payment escrow → completion → driver payout.

---

## Project Layout (Monorepo)

```
naglity/
├── apps/api/     ← NestJS backend (REST API + WebSocket)
└── apps/web/     ← Next.js frontend (all 3 platforms in one app)
```

One frontend app serves all three roles. The route a user sees depends on their **role** (ADMIN / BUSINESS / DRIVER).

---

## The Three Platforms (Frontend)

All under `apps/web/app/(dashboard)/`:

### 1. Driver Platform — `/driver/*`
For crane operators who take on jobs.
- `/driver/feed` — Browse open jobs posted by businesses
- `/driver/offers` — Quotes the driver has submitted
- `/driver/history` — Past completed jobs
- `/driver/schedule` — Calendar view of upcoming jobs
- `/driver/payouts` — Payout transactions (earnings)
- `/driver/stats` — Earnings analytics

### 2. Business Platform — `/business/*`
For companies that need crane work done.
- `/business/jobs` — Their job listings
- `/business/jobs/new` — Post a new job (2-step wizard)
- `/business/drivers` — Directory of available drivers with ratings
- `/business/billing` — Payment methods & billing history
- `/business/stats` — Spending analytics

### 3. Admin Platform — `/admin/*`
For platform operators managing everything.
- `/admin/businesses` — Manage all business accounts
- `/admin/drivers` — Manage all driver accounts
- `/admin/jobs` — View all jobs across the platform
- `/admin/requests` — Approve/handle driver & business signup requests
- `/admin/revenue` — Platform revenue analytics
- `/admin/transactions` — Full payment ledger

---

## Backend (`apps/api/`)

Built with **NestJS + PostgreSQL + Prisma**. Runs on port **3001**.

| Module | What it does |
|---|---|
| `auth/` | Login, register, JWT tokens, role guards |
| `jobs/` | Job lifecycle: create → accept → start → complete → pay |
| `drivers/` | Driver profiles, directory |
| `businesses/` | Business profiles |
| `payments/` | Escrow charges (business), payouts (driver) |
| `pricing/` | Calculate price by route/location |
| `notifications/` | In-app notifications stored in DB |
| `gateway/` | WebSocket (Socket.IO) — real-time job & notification events |
| `stats/` | Analytics for all 3 roles |
| `admin/` | Admin-only: create/manage driver & business accounts |
| `signup-requests/` | Intake form for new driver/business onboarding |
| `sms/` | SMS alerts (fake in dev, Twilio-ready) |

---

## How the Job Flow Works

```
Business posts job
    ↓
Drivers see it in real-time (WebSocket)
    ↓
Driver accepts (fixed price) OR submits an offer (offers mode)
    ↓
Payment escrowed from business card
    ↓
Driver starts job → completes job
    ↓
Escrowed funds released to driver
    ↓
Both sides can leave a review
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TailwindCSS, Shadcn UI |
| Data fetching | TanStack React Query + Axios |
| Real-time | Socket.IO (client + server) |
| Backend | NestJS 11, TypeScript |
| Database | PostgreSQL (Neon) via Prisma ORM |
| Auth | JWT + bcrypt, role-based guards |
| Payments | Stripe (fake provider in dev) |
| Hosting | Vercel (web), Render (API), Neon (DB) |
| Package manager | pnpm (monorepo via `pnpm-workspace.yaml`) |

---

## Key Files to Know

| File | Purpose |
|---|---|
| `apps/api/prisma/schema.prisma` | Full data model (User, Job, Driver, Business, Payment…) |
| `apps/api/src/jobs/jobs.service.ts` | Core job lifecycle logic |
| `apps/api/src/payments/payments.service.ts` | Escrow + payout logic |
| `apps/web/app/(dashboard)/driver/` | All driver screens |
| `apps/web/app/(dashboard)/business/` | All business screens |
| `apps/web/app/(dashboard)/admin/` | All admin screens |
| `apps/web/hooks/useAuth.ts` | Auth context (login/logout/current user) |
| `apps/web/lib/api.ts` | Axios instance — all API calls go through here |

---

## Full Directory Map

### Frontend (`apps/web/`)

```
apps/web/
├── app/
│   ├── (auth)/                  # Public routes (no sidebar)
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── request-access/page.tsx
│   ├── (dashboard)/             # Protected routes (with sidebar)
│   │   ├── admin/               # Admin platform
│   │   ├── business/            # Business platform
│   │   ├── driver/              # Driver platform
│   │   └── notifications/
│   ├── verify-phone/page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── admin/
│   ├── auth/
│   ├── jobs/
│   ├── layout/
│   ├── reviews/
│   ├── stats/
│   └── ui/                      # Shadcn base components
├── hooks/
│   ├── useAuth.ts
│   ├── useJobFeed.ts
│   └── useSocket.ts
├── lib/
│   ├── api.ts                   # Axios instance
│   ├── auth.ts                  # Token/user storage
│   └── queryClient.ts
├── types/
│   └── api.ts                   # All API response types
└── next.config.ts               # API rewrite: /api/* → backend
```

### Backend (`apps/api/`)

```
apps/api/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── auth/
│   ├── admin/
│   ├── drivers/
│   ├── businesses/
│   ├── jobs/
│   ├── payments/
│   ├── pricing/
│   ├── sms/
│   ├── notifications/
│   ├── stats/
│   ├── signup-requests/
│   ├── gateway/                 # WebSocket (Socket.IO)
│   └── prisma/                  # Prisma service
├── prisma/
│   ├── schema.prisma            # Data model
│   ├── seed.ts                  # Seed admin user
│   └── migrations/
└── specs/                       # E2E test suite
    ├── auth/
    ├── admin/
    ├── jobs/
    ├── payments/
    ├── notifications/
    └── stats/
```

---

## Database Models (Prisma)

| Model | Key Fields |
|---|---|
| `User` | id, username, email, passwordHash, role (ADMIN/DRIVER/BUSINESS) |
| `Driver` | userId, name, phone, craneCapacityTons, liftHeightMeters, stripeAccountId |
| `Business` | userId, name, phone, location, accountType, stripeCustomerId |
| `Job` | businessId, driverId, status, title, fromLocation, toLocation, grossPriceCents, pricingMode |
| `JobOffer` | jobId, driverId, amountCents, etaMinutes, status (PENDING/ACCEPTED/DECLINED) |
| `Payment` | jobId, type (CHARGE/TRANSFER/REFUND), amountCents, status |
| `Notification` | userId, type, title, body, jobId, read |
| `Review` | jobId, raterId, direction, stars |
| `SignupRequest` | type (DRIVER/BUSINESS), name, phone, handled |

---

## Deployment

| Service | Platform |
|---|---|
| Frontend (`apps/web`) | Vercel |
| Backend (`apps/api`) | Render |
| Database | Neon (PostgreSQL) |
| CI/CD | GitHub Actions (`.github/workflows/ci.yml`) |

Environment variables are documented in `apps/api/.env.example` and `ENVIRONMENTS.md`.
