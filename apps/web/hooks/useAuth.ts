'use client';

import { useState, useEffect } from 'react';
import { getToken, getUser, setAuth, clearAuth, type AuthUser } from '@/lib/auth';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(getUser());
    setToken(getToken());
    setReady(true);
  }, []);

  const login = (newToken: string, newUser: AuthUser) => {
    setAuth(newToken, newUser);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    clearAuth();
    setToken(null);
    setUser(null);
  };

  return { user, token, ready, login, logout };
}
