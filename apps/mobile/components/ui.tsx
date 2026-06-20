// Small set of UI primitives (RN ports of the web's shadcn-style components).
// Visual layer only — props/APIs are unchanged so screens keep working as-is.
import { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { colors } from '@/theme/colors';
import { HIT, radius, shadow, space } from '@/theme/tokens';

/* ── Card ── Borderless white surface with soft native depth. */
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/* ── Button ── Chunky, glove-friendly tap targets. */
type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export function Button({
  title,
  onPress,
  variant = 'default',
  disabled,
  loading,
  icon,
  size = 'md',
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
}) {
  const v = BTN_VARIANT[variant];
  const height = size === 'sm' ? 44 : size === 'lg' ? 56 : 52;
  const fontSize = size === 'sm' ? 14 : size === 'lg' ? 17 : 16;
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.btn,
        { height, paddingHorizontal: size === 'sm' ? 14 : 18 },
        { backgroundColor: v.bg, borderColor: v.border, borderWidth: v.border ? 1.5 : 0 },
        isDisabled && { opacity: 0.4 },
        pressed && !isDisabled && { opacity: 0.88, transform: [{ scale: 0.98 }] },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.fg} />
      ) : (
        <>
          {icon}
          <Text style={[styles.btnText, { color: v.fg, fontSize }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const BTN_VARIANT: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
  default: { bg: colors.primary, fg: colors.primaryForeground },
  secondary: { bg: colors.brandSoft, fg: colors.brandStrong, border: colors.brandSoft },
  outline: { bg: colors.card, fg: colors.foreground, border: colors.border },
  ghost: { bg: 'transparent', fg: colors.foreground },
  destructive: { bg: colors.destructiveSoft, fg: colors.destructive, border: colors.destructiveSoft },
};

/* ── Chip ── Native pill with a generous tap target. */
export function Chip({
  label,
  bg,
  fg,
  dot,
  active,
  onPress,
}: {
  label: string;
  bg?: string;
  fg?: string;
  dot?: string;
  active?: boolean;
  onPress?: () => void;
}) {
  const background = active ? colors.primary : bg ?? colors.muted;
  const color = active ? colors.primaryForeground : fg ?? colors.slate700;
  const content = (
    <View style={[styles.chip, { backgroundColor: background }]}>
      {dot && <View style={[styles.dot, { backgroundColor: dot }]} />}
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.8 }}>
      {content}
    </Pressable>
  ) : (
    content
  );
}

/* ── Skeleton ── */
export function Skeleton({ height, style }: { height: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.skeleton, { height }, style]} />;
}

/* ── EmptyState ── Intentional, centered, soft tonal icon. */
export function EmptyState({
  icon,
  title,
  subtitle,
  children,
  tone = colors.primarySoft,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  children?: ReactNode;
  tone?: string;
}) {
  return (
    <View style={styles.empty}>
      {icon && <View style={[styles.emptyIcon, { backgroundColor: tone }]}>{icon}</View>}
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySub}>{subtitle}</Text>}
      {children && <View style={{ marginTop: space.lg, width: '100%', maxWidth: 280 }}>{children}</View>}
    </View>
  );
}

/* ── BottomSheet (Modal) ── */
export function BottomSheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.sheetHandle} />
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export const text: Record<string, TextStyle> = {
  h1: { fontSize: 22, fontWeight: '800', color: colors.foreground, writingDirection: 'rtl' },
  sub: { fontSize: 14, color: colors.mutedForeground, writingDirection: 'rtl' },
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xxl,
    overflow: 'hidden',
    ...shadow.card,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.xl,
  },
  btnText: { fontWeight: '800', writingDirection: 'rtl' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    minHeight: 44,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  chipText: { fontSize: 14, fontWeight: '700', writingDirection: 'rtl' },
  dot: { width: 8, height: 8, borderRadius: 999 },
  skeleton: { backgroundColor: '#E8ECF2', borderRadius: radius.xl, width: '100%' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 24, gap: 8 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.foreground, writingDirection: 'rtl', textAlign: 'center' },
  emptySub: {
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(8,12,20,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: space.xl,
    paddingBottom: 34,
    maxHeight: '90%',
    ...shadow.raised,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
});

export { HIT };
