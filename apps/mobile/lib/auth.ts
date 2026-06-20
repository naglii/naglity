// Token + user persistence via expo-secure-store (the RN analogue of the web's localStorage auth).
// Mirrors apps/web/lib/auth.ts, adapted to async secure storage.
import * as SecureStore from 'expo-secure-store';
import type { AuthUser } from '@/types/api';

const USER_KEY = 'naglity_user';
const TOKEN_KEY = 'naglity_token';

// In-memory mirror so synchronous callers (axios interceptor, socket auth) get the token instantly.
let _token: string | null = null;
let _user: AuthUser | null = null;

/** Load persisted auth into memory. Call once at app start before rendering the gate. */
export async function hydrateAuth(): Promise<{ user: AuthUser | null; token: string | null }> {
  try {
    _token = await SecureStore.getItemAsync(TOKEN_KEY);
    const raw = await SecureStore.getItemAsync(USER_KEY);
    _user = raw ? (JSON.parse(raw) as AuthUser) : null;
    if (_user && !_user.username) {
      await clearAuth();
    }
  } catch {
    await clearAuth();
  }
  return { user: _user, token: _token };
}

export function getTokenSync(): string | null {
  return _token;
}

export function getUserSync(): AuthUser | null {
  return _user;
}

export async function setAuth(user: AuthUser, token: string): Promise<void> {
  _user = user;
  _token = token;
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearAuth(): Promise<void> {
  _user = null;
  _token = null;
  await SecureStore.deleteItemAsync(USER_KEY).catch(() => {});
  await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
}
