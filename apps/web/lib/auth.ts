export interface AuthUser {
  id: string;
  username: string;
  email: string | null;
  role: 'ADMIN' | 'DRIVER' | 'BUSINESS';
  profileId: string | null;
}

const USER_KEY = 'nagli_user';

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

export function clearAuth() {
  localStorage.removeItem(USER_KEY);
}
