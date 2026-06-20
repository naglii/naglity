// Auth context — mirrors apps/web/hooks/useAuth.ts, adapted to SecureStore + socket lifecycle.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { clearAuth, getUserSync, hydrateAuth, setAuth } from '@/lib/auth';
import { disconnectSocket, initSocket } from '@/lib/socket';
import { queryClient } from '@/lib/queryClient';
import type { AuthUser } from '@/types/api';

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  signIn: (user: AuthUser, token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const { user: hydrated, token } = await hydrateAuth();
      setUser(hydrated);
      if (hydrated && token) initSocket();
      setReady(true);
    })();
  }, []);

  const signIn = async (newUser: AuthUser, token: string) => {
    await setAuth(newUser, token);
    setUser(newUser);
    initSocket();
  };

  const signOut = async () => {
    disconnectSocket();
    await clearAuth();
    queryClient.clear();
    setUser(getUserSync()); // null
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, ready, signIn, signOut }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
