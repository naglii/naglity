'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  length?: number;
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
  status?: 'idle' | 'ok' | 'error';
}

/** Segmented one-time-code input: per-digit boxes with auto-advance, backspace and paste. */
export function OtpInput({ length = 4, value, onChange, autoFocus, disabled, status = 'idle' }: Props) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const chars = Array.from({ length }, (_, i) => value[i] ?? '');

  const setAt = (i: number, ch: string) => {
    const arr = Array.from({ length }, (_, k) => value[k] ?? '');
    arr[i] = ch;
    onChange(arr.join('').slice(0, length));
  };

  const handleChange = (i: number, raw: string) => {
    const d = raw.replace(/\D/g, '');
    if (!d) { setAt(i, ''); return; }
    setAt(i, d[d.length - 1]);
    if (i < length - 1) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !chars[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const d = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!d) return;
    onChange(d);
    refs.current[Math.min(d.length, length - 1)]?.focus();
  };

  const ring =
    status === 'ok'
      ? 'border-success ring-success/30'
      : status === 'error'
        ? 'border-destructive ring-destructive/30'
        : 'focus:border-brand-strong focus:ring-brand/25';

  return (
    <div dir="ltr" className="flex justify-center gap-2.5" onPaste={handlePaste}>
      {chars.map((c, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          disabled={disabled}
          value={c}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className={cn(
            'size-12 rounded-xl border bg-background text-center text-xl font-bold outline-none ring-2 ring-transparent transition-colors disabled:opacity-60',
            ring,
          )}
        />
      ))}
    </div>
  );
}
