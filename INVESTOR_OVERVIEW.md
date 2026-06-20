# Naglity — Investor Overview

> The marketplace for mobile crane work. We connect businesses that need lifting done
> with crane-truck operators who do it — and take a transparent cut of every job.

---

## The one-liner

**Naglity is "Uber for mobile cranes."** A business posts a crane job, available drivers
see it instantly, one accepts (or bids), the work gets done, and payment moves
automatically through escrow — with the platform earning a fee on every completed job.

---

## The problem

Booking a crane truck today is slow, opaque, and offline:
- **Businesses** (construction, logistics, events, deliveries) rely on phone calls, WhatsApp,
  and personal contacts to find an available crane — with no price transparency and no
  guarantee of availability.
- **Drivers / crane owners** have expensive equipment that sits idle between jobs, and depend
  on word-of-mouth to fill their schedule.
- **Payment** is cash/invoice-based, with disputes, late payments, and no trust layer.

It's a fragmented, high-ticket, repeat-purchase market with no dominant digital player.

---

## The solution

A real-time, two-sided marketplace with payments and trust built in:

```
Business posts a job  →  Drivers see it live  →  Driver accepts or bids
        →  Payment held in escrow  →  Job completed  →  Funds released to driver
        →  Both sides rate each other
```

- **Instant matching** — jobs broadcast to qualified drivers in real time.
- **Two pricing models** — fixed price (first to accept) or competitive bidding (business picks the best offer).
- **Escrow payments** — the business is charged when a driver is booked; funds release to the driver on completion (or refund on cancellation). Removes payment risk for both sides.
- **Trust layer** — mutual star ratings, driver profiles (crane capacity, lift height, completed jobs).

---

## Business model

- **Take rate: 10% of every completed job** (driver nets 90%). Revenue scales directly with
  gross marketplace volume (GMV).
- Built-in expansion levers: premium driver placement, subscription tiers, insurance/financing
  add-ons, and surge/dynamic pricing — all natural extensions of the existing transaction engine.

---

## Who's on the platform (three sides, one system)

| Role | What they get |
|---|---|
| **Businesses / customers** | Post jobs, see transparent pricing, choose a rated driver, pay securely, track spend |
| **Drivers (crane operators)** | A live feed of nearby work, fill idle time, get paid reliably, build a reputation |
| **Admins (Naglity)** | Onboarding, oversight of all jobs, revenue analytics, and the full transaction ledger |

---

## Product status — built and working today

This is **not** a slide deck idea; the platform is engineered and functional across **three
applications sharing one backend**:

- **Web platform** — serves all three roles (business, driver, admin) end to end.
- **Driver mobile app** — a polished, native iOS/Android app (built on Expo) giving drivers a
  premium, on-the-go experience: real-time job feed, one-tap accept/bid, schedule, payouts,
  receipts, and earnings analytics.
- **Backend & payments** — real-time engine (live jobs + notifications), escrow payment flow,
  SMS notifications, ratings, and analytics. Payment and SMS providers are **pluggable**, so
  going from demo to live processing (e.g. Stripe) is a configuration step, not a rebuild.

**Core loop proven:** post → match → accept/bid → escrow → complete → payout → rate.

---

## Why it's defensible

- **Liquidity & network effects** — more drivers attract more businesses and vice versa; the
  first platform to reach local liquidity wins the region.
- **Trust & data** — ratings, completion history, and pricing data compound over time and are
  hard for a new entrant to replicate.
- **Switching cost** — once a driver's schedule and earnings live in Naglity, and a business's
  job history and billing live there too, the platform becomes the system of record.
- **Real-time, payments-native architecture** — built from day one for instant matching and
  money movement, not bolted on later.

---

## Market

A **high-value, recurring, B2B services market**: cranes are booked repeatedly by construction,
logistics, infrastructure, and events businesses, with individual jobs worth meaningful sums.
High average order value plus repeat demand makes even a modest take rate compelling, and the
sector is largely undigitized — a classic "vertical marketplace" opportunity.

---

## Traction enablers / what's next

- **Go-live on real payments** (pluggable provider already in place).
- **Geographic launch** in a dense first market to bootstrap local liquidity.
- **Driver supply acquisition** (the harder side of the marketplace) via direct onboarding —
  admin tooling for this already exists.
- **Growth levers** ready to layer on: dynamic pricing, premium placements, subscriptions, and
  insurance/financing partnerships.

---

*Naglity is a working, three-app marketplace (web + driver mobile + backend) with real-time
matching and escrow payments already implemented — positioned to digitize a fragmented,
high-ticket crane-rental market and earn a transparent fee on every job.*
