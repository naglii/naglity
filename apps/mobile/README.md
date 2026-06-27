# Naglity Driver — Mobile App

A React Native (Expo SDK 56) **driver app** that mirrors the existing web Driver platform
(`apps/web/app/(dashboard)/driver/`). It talks to the same NestJS API (`apps/api`) — no
separate mobile backend, no duplicated business logic.

## Stack
- Expo SDK 56 · Expo Router · React Native 0.85 · TypeScript
- React Query + Axios (same data layer as web)
- socket.io-client for live updates (`job:new`, `job:accepted`, `notification:new`)
- `expo-secure-store` for the JWT (sent as `Authorization: Bearer …`)

## Screens (mirror the web driver tabs)
| Tab | Route | Web source |
|---|---|---|
| עבודות זמינות | `app/(tabs)/feed.tsx` | `driver/feed` |
| ההצעות שלי | `app/(tabs)/offers.tsx` | `driver/offers` |
| לוח הזמנים | `app/(tabs)/schedule.tsx` | `driver/schedule` |
| תשלומים | `app/(tabs)/payouts.tsx` | `driver/payouts` |
| סטטיסטיקות | `app/(tabs)/stats.tsx` | `driver/stats` (+ merged history) |
| התראות | `app/(tabs)/notifications.tsx` | NotificationBell |
| התחברות | `app/(auth)/login.tsx` | `(auth)/login` |

## Running

The app reads its backend URL from `apps/mobile/.env` (`EXPO_PUBLIC_API_URL` /
`EXPO_PUBLIC_SOCKET_URL`, centralized in `lib/env.ts`). These are **inlined at bundle
time**, so after editing `.env` you must restart Metro with a clear cache (`-c`).
Copy `.env.example` to `.env` to start.

### A. Local — phone & computer on the same Wi-Fi

1. Start the API (from repo root): `pnpm dev:api`
2. Set `apps/mobile/.env` to the host that matches your target:
   | Target | `EXPO_PUBLIC_API_URL` (and `_SOCKET_URL`) |
   |---|---|
   | Physical device (Expo Go) | `http://<YOUR_PC_LAN_IP>:3001` (e.g. `http://192.168.1.126:3001`) |
   | Android emulator | `http://10.0.2.2:3001` |
   | iOS simulator / Expo web | `http://localhost:3001` |
3. Start Metro and open the app:
   ```bash
   pnpm --filter mobile start -- -c     # from repo root (or: cd apps/mobile && npx expo start -c)
   ```
   Scan the QR in Expo Go (or `exp://<YOUR_PC_LAN_IP>:8081`), or press `a` / `i` for an
   emulator / simulator.

### B. Remote — phone on mobile data or a different Wi-Fi

The app has **two** connections, and both must be remote to work off your local network:
the **JS bundle** (served by Metro on your PC) and the **API** (the backend). So you need a
**tunnel** for Metro *and* a **public API URL** for the backend.

1. Deploy the API to the dev/staging environment (Render auto-deploys the `dev` branch):
   `git push origin dev` → public URL like `https://<dev-api>.onrender.com`.
2. Point `apps/mobile/.env` at that public HTTPS URL (not `localhost`, not `192.168.x.x`):
   ```bash
   EXPO_PUBLIC_API_URL=https://<dev-api>.onrender.com
   EXPO_PUBLIC_SOCKET_URL=https://<dev-api>.onrender.com
   ```
3. Start Metro in tunnel mode (makes the bundle reachable from any network too):
   ```bash
   cd apps/mobile && npx expo start --tunnel -c
   ```
   First run installs `@expo/ngrok`. Scan the QR in Expo Go from any network. Keep this
   terminal running — Expo Go still pulls JS from your PC via the tunnel.

> A fully PC‑independent build for testers (no tunnel needed) is an **EAS dev/preview build**
> (`eas build`) — not configured yet; that's the deployment milestone.

### Logging in
Use a **driver** account (e.g. `islamajed` / `123456`). Non-driver roles are rejected.

## Notes / known deltas from web
- Auth uses a `Bearer` token (RN has no cookie jar). The API accepts both cookie and Bearer.
- The feed's "from date" filter (a web `<input type=date>`) is omitted in this first version;
  search + capacity + sort are present. Add a native date picker later if needed.
- Review submission (post-completion rating) is deferred to a fast-follow.
