export interface AuthUser {
  id: string;
  username: string;
  email: string | null;
  role: 'ADMIN' | 'DRIVER' | 'BUSINESS';
  profileId: string | null;
}

const USER_KEY = 'naglity_user';
const TOKEN_KEY = 'naglity_token';

export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw) as AuthUser;
    if (!user.username) { clearAuth(); return null; }
    return user;
  } catch {
    clearAuth();
    return null;
  }
}

export function setAuth(user: AuthUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearAuth() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
}
