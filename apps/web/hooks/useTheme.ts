'use client';

import { useEffect, useState } from 'react';

export type Theme = 'slate' | 'stone' | 'zinc' | 'indigo';

const THEME_KEY = 'naglity_theme';

export const THEMES: { id: Theme; label: string; dot: string }[] = [
  { id: 'slate', label: 'Slate',  dot: 'bg-blue-500' },
  { id: 'stone', label: 'Stone',  dot: 'bg-orange-400' },
  { id: 'zinc',  label: 'Zinc',   dot: 'bg-zinc-500' },
  { id: 'indigo',label: 'Indigo', dot: 'bg-indigo-500' },
];

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('slate');

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY) as Theme | null;
    applyTheme(saved && THEMES.some(t => t.id === saved) ? saved : 'slate');
  }, []);

  function applyTheme(t: Theme) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem(THEME_KEY, t);
    setThemeState(t);
  }

  return { theme, setTheme: applyTheme };
}
