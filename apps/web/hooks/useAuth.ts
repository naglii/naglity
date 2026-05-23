'use client';

import { useState, useEffect } from 'react';
import { getUser, setAuth, clearAuth, type AuthUser } from '@/lib/auth';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(getUser());
    setReady(true);
  }, []);

  const login = (newUser: AuthUser) => {
    setAuth(newUser);
    setUser(newUser);
  };

  const logout = () => {
    clearAuth();
    setUser(null);
  };

  return { user, ready, login, logout };
}
