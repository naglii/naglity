// Shared design tokens: depth (shadows), shape (radii), spacing, and a type scale.
// These replace harsh gray borders with native depth and enforce a clear hierarchy.
import { Platform, type TextStyle, type ViewStyle } from 'react-native';
import { colors } from './colors';

/** Soft, native-feeling elevation. iOS uses shadow*, Android uses elevation. */
export const shadow: Record<'card' | 'raised' | 'sticky', ViewStyle> = {
  card: Platform.select({
    ios: {
      shadowColor: '#0B1220',
      shadowOpacity: 0.06,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
    },
    android: { elevation: 2 },
    default: {},
  })!,
  raised: Platform.select({
    ios: {
      shadowColor: '#0B1220',
      shadowOpacity: 0.1,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
    },
    android: { elevation: 5 },
    default: {},
  })!,
  sticky: Platform.select({
    ios: {
      shadowColor: '#0B1220',
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: -4 },
    },
    android: { elevation: 8 },
    default: {},
  })!,
};

/** Corner radii. */
export const radius = {
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
} as const;

/** 4-pt spacing scale. */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

/** Minimum tap target for gloved hands. */
export const HIT = 48;

/** Type scale — kills the "everything is the same size" look. */
export const type: Record<string, TextStyle> = {
  display: { fontSize: 28, fontWeight: '800', color: colors.foreground },
  figure: { fontSize: 24, fontWeight: '800', color: colors.foreground }, // price & time
  figureLg: { fontSize: 32, fontWeight: '900', color: colors.foreground }, // hero numbers
  title: { fontSize: 17, fontWeight: '700', color: colors.foreground },
  body: { fontSize: 15, fontWeight: '500', color: colors.foreground },
  label: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  caption: { fontSize: 13, fontWeight: '500', color: colors.mutedForeground },
};
