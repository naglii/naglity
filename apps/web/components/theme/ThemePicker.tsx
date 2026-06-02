'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDriverTheme, type DriverTheme } from './ThemeContext';

interface ThemeDef {
  id: DriverTheme;
  label: string;
  /** Three OKLCH colors: [background, primary/accent, sidebar] */
  swatchColors: [string, string, string];
}

const THEMES: ThemeDef[] = [
  {
    id: 'default',
    label: 'ברירת מחדל',
    swatchColors: [
      'oklch(0.967 0.001 286.375)',
      'oklch(0.274 0.006 286.033)',
      'oklch(0.92 0.004 286.32)',
    ],
  },
  {
    id: 'night',
    label: 'לילה',
    swatchColors: [
      'oklch(0.13 0.016 265)',
      'oklch(0.62 0.22 250)',
      'oklch(0.10 0.018 265)',
    ],
  },
  {
    id: 'desert',
    label: 'מדבר',
    swatchColors: [
      'oklch(0.96 0.018 82)',
      'oklch(0.56 0.18 50)',
      'oklch(0.26 0.055 52)',
    ],
  },
  {
    id: 'ocean',
    label: 'ים',
    swatchColors: [
      'oklch(0.96 0.016 192)',
      'oklch(0.44 0.16 200)',
      'oklch(0.21 0.075 200)',
    ],
  },
  {
    id: 'sunset',
    label: 'שקיעה',
    swatchColors: [
      'oklch(0.97 0.013 295)',
      'oklch(0.47 0.23 295)',
      'oklch(0.23 0.09 285)',
    ],
  },
];

export function ThemePicker() {
  const { theme, setTheme } = useDriverTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((o) => !o)}
        title="שנה סגנון"
        aria-label="שנה סגנון"
        aria-expanded={open}
      >
        <Palette className="size-4" />
      </Button>

      {open && (
        <div
          className="absolute left-0 top-full mt-2 z-50 w-60 rounded-2xl border bg-card shadow-xl p-2"
          role="menu"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2 pt-1 pb-2">
            בחר סגנון
          </p>

          <div className="flex flex-col gap-1">
            {THEMES.map((t) => {
              const isActive = theme === t.id;
              return (
                <button
                  key={t.id}
                  role="menuitem"
                  onClick={() => { setTheme(t.id); setOpen(false); }}
                  className={`flex items-center gap-3 w-full rounded-xl px-2 py-2 text-right transition-all
                    hover:bg-muted
                    ${isActive ? 'bg-muted ring-1 ring-primary/30' : ''}`}
                >
                  {/* Three-stripe color swatch */}
                  <div className="shrink-0 flex rounded-lg overflow-hidden size-9 shadow-sm border border-black/10">
                    {t.swatchColors.map((color, i) => (
                      <div key={i} style={{ background: color }} className="flex-1" />
                    ))}
                  </div>

                  <span className="flex-1 text-sm font-medium leading-none">{t.label}</span>

                  {isActive ? (
                    <Check className="size-4 text-primary shrink-0" />
                  ) : (
                    <div className="size-4 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
