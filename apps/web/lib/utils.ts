import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const netCents = (gross: number) => Math.round(gross * 0.9);
export const platformCents = (gross: number) => Math.round(gross * 0.1);
export const formatPrice = (cents: number) => `₪${(cents / 100).toFixed(2)}`;

export function durationMins(startIso: string, endIso: string): number {
  return Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000);
}

export function formatDuration(startIso: string, endIso: string): string {
  const mins = durationMins(startIso, endIso);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** "12ש׳ 30ד׳" style label from a minute count. */
export function formatHoursLabel(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}ד׳`;
  if (m === 0) return `${h}ש׳`;
  return `${h}ש׳ ${m}ד׳`;
}

/** True when an ISO timestamp falls within the given month. */
export function isInMonth(iso: string, month: Date): boolean {
  const d = new Date(iso);
  return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth();
}
