// Color tokens for the mobile app's premium, high-contrast look.
// Plain hex so RN StyleSheet can consume them directly.
//
// Palette intent (crane drivers, gloves, bright sun):
//   primary  = Navy        → buttons, active chips, key emphasis
//   secondary= Brand blue   → secondary/outline actions
//   money    = Emerald      → earnings / price / settled
//   pending  = Amber        → waiting-for-driver / pending

export const colors = {
  // ── Primary (navy) ──
  primary: '#1E3A8A',
  primaryStrong: '#172E6E',
  primarySoft: '#E0E7FF',
  primaryForeground: '#FFFFFF',

  // ── Secondary accent (brand blue) ──
  brand: '#208AEF',
  brandStrong: '#1366C9',
  brandSoft: '#E6F1FE',
  secondary: '#208AEF',
  secondarySoft: '#E6F1FE',

  // ── Money / success (emerald) ──
  money: '#059669',
  moneySoft: '#ECFDF5',
  success: '#059669',
  successSoft: '#ECFDF5',

  // ── Pending / waiting (amber) ──
  pending: '#D97706',
  pendingSoft: '#FFFBEB',
  warning: '#D97706',
  warningSoft: '#FFFBEB',

  // ── Info (blue) ──
  info: '#2563EB',
  infoSoft: '#DBEAFE',

  // ── Destructive (red) ──
  destructive: '#DC2626',
  destructiveSoft: '#FEE2E2',

  // ── Neutrals ──
  foreground: '#0F172A', // slate-900 — primary text
  slate700: '#334155', // chip text, secondary headings
  mutedForeground: '#64748B', // slate-500 — secondary text
  muted: '#F1F5F9', // slate-100 — inactive chips / soft fills
  accent: '#F1F5F9',
  border: '#E2E8F0', // dividers only (not card outlines)
  background: '#F4F6FA', // soft off-white app canvas
  card: '#FFFFFF',
  white: '#FFFFFF',
} as const;

export type ColorToken = keyof typeof colors;
