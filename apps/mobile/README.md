# Naglity Driver — Mobile App

A React Native (Expo SDK 54) **driver app** that mirrors the existing web Driver platform
(`apps/web/app/(dashboard)/driver/`). It talks to the same NestJS API (`apps/api`) — no
separate mobile backend, no duplicated business logic.

## Stack
- Expo SDK 54 · Expo Router · React Native 0.81 · TypeScript
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

1. Start the API (from repo root):
   ```bash
   pnpm dev:api
   ```
2. Point the app at your API. Edit `apps/mobile/.env`:
   - **Emulator/Simulator:** `http://localhost:3001` works as-is.
   - **Physical device:** replace `localhost` with your dev machine's LAN IP, e.g.
     `EXPO_PUBLIC_API_URL=http://192.168.1.20:3001` (same for `EXPO_PUBLIC_SOCKET_URL`).
     The device and computer must be on the same Wi-Fi.
3. Start the app:
   ```bash
   pnpm dev:mobile        # from repo root
   # or: cd apps/mobile && pnpm start
   ```
4. Open in Expo Go (scan the QR) or press `i` / `a` for iOS / Android.

Log in with a **driver** account (e.g. `islamajed` / `123456`). Non-driver roles are rejected.

## Notes / known deltas from web
- Auth uses a `Bearer` token (RN has no cookie jar). The API accepts both cookie and Bearer.
- The feed's "from date" filter (a web `<input type=date>`) is omitted in this first version;
  search + capacity + sort are present. Add a native date picker later if needed.
- Review submission (post-completion rating) is deferred to a fast-follow.
