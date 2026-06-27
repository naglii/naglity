// Single source of truth for the backend URLs.
// Set these in apps/mobile/.env (see .env.example) — they are inlined into the
// bundle at build time, so switching environments only means editing that file:
//   • Local (same Wi-Fi):   http://<YOUR_PC_LAN_IP>:3001
//   • Remote dev (anywhere): https://<dev-api>.onrender.com  (run: expo start --tunnel)
//   • Production (later):    https://<prod-api-domain>
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';
export const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL ?? API_URL;
