'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type DriverTheme = 'default' | 'night' | 'desert' | 'ocean' | 'sunset';

const STORAGE_KEY = 'driver-theme';

interface ThemeContextValue {
  theme: DriverTheme;
  setTheme: (t: DriverTheme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'default',
  setTheme: () => {},
});

export function DriverThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<DriverTheme>('default');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as DriverTheme | null;
    if (saved && saved !== 'default') {
      document.documentElement.setAttribute('data-theme', saved);
      setThemeState(saved);
    }
  }, []);

  function setTheme(t: DriverTheme) {
    setThemeState(t);
    if (t === 'default') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', t);
    }
    localStorage.setItem(STORAGE_KEY, t);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useDriverTheme = () => useContext(ThemeContext);
