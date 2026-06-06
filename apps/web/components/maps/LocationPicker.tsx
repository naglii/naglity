'use client';

import { useEffect, useRef, useState } from 'react';
import api from '@/lib/api';
import type { GeoPlace } from '@/types/api';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2 } from 'lucide-react';

interface LocationPickerProps {
  value: string;
  onChange: (label: string, place?: GeoPlace) => void;
  placeholder?: string;
  kind?: 'start' | 'end';
  className?: string;
}

export function LocationPicker({ value, onChange, placeholder, kind = 'start', className }: LocationPickerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GeoPlace[]>([]);
  const [query, setQuery] = useState(value);
  const boxRef = useRef<HTMLDivElement>(null);
  const justPicked = useRef(false);

  useEffect(() => setQuery(value), [value]);

  // Debounced search.
  useEffect(() => {
    if (justPicked.current) {
      justPicked.current = false;
      return;
    }
    const q = query.trim();
    if (q.length < 1) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get<GeoPlace[]>('/location/search', { params: { q } });
        setResults(data);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  // Close on outside click.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const pick = (p: GeoPlace) => {
    justPicked.current = true;
    setQuery(p.label);
    setOpen(false);
    setResults([]);
    onChange(p.label, p);
  };

  const dotColor = kind === 'end' ? 'bg-brand-strong' : 'bg-success';

  return (
    <div ref={boxRef} className={`relative ${className ?? ''}`}>
      <span className={`absolute top-1/2 size-2 -translate-y-1/2 start-3 rounded-full ${dotColor}`} />
      <Input
        className="h-9 ps-8 pe-8"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
        }}
        onFocus={() => results.length && setOpen(true)}
        autoComplete="off"
      />
      <span className="pointer-events-none absolute top-1/2 -translate-y-1/2 end-2.5 text-muted-foreground">
        {loading ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />}
      </span>

      {open && results.length > 0 && (
        <ul className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-xl border bg-popover p-1 shadow-lg">
          {results.map((p) => (
            <li key={`${p.label}-${p.lat}`}>
              <button
                type="button"
                onClick={() => pick(p)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start text-sm hover:bg-accent"
              >
                <span className="icon-chip size-7 shrink-0 bg-accent text-brand-strong">
                  <MapPin className="size-3.5" />
                </span>
                <span className="truncate font-medium">{p.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
