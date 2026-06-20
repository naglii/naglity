// Color tokens mirroring the web app's design system (brand / success / info / warning / destructive).
// Kept as plain hex so RN StyleSheet can consume them directly.

export const colors = {
  brand: '#208AEF',
  brandStrong: '#1366C9',
  brandSoft: '#E6F1FE',

  success: '#16A34A',
  successSoft: '#DCFCE7',

  warning: '#B45309',
  warningSoft: '#FEF3C7',

  info: '#2563EB',
  infoSoft: '#DBEAFE',

  destructive: '#DC2626',
  destructiveSoft: '#FEE2E2',

  foreground: '#0F172A',
  mutedForeground: '#64748B',
  muted: '#F1F5F9',
  accent: '#F1F5F9',
  border: '#E2E8F0',
  background: '#F8FAFC',
  card: '#FFFFFF',
  white: '#FFFFFF',

  primary: '#208AEF',
  primaryForeground: '#FFFFFF',
} as const;

export type ColorToken = keyof typeof colors;
