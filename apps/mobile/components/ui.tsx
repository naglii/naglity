// Small set of UI primitives (RN ports of the web's shadcn-style components).
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

/* ── Card ── */
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/* ── Button ── */
type ButtonVariant = 'default' | 'outline' | 'ghost' | 'destructive';
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
  const pad = size === 'sm' ? { paddingVertical: 7, paddingHorizontal: 12 }
    : size === 'lg' ? { paddingVertical: 14, paddingHorizontal: 18 }
    : { paddingVertical: 11, paddingHorizontal: 16 };
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.btn,
        pad,
        { backgroundColor: v.bg, borderColor: v.border, borderWidth: v.border ? 1 : 0 },
        isDisabled && { opacity: 0.45 },
        pressed && !isDisabled && { opacity: 0.85 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.fg} />
      ) : (
        <>
          {icon}
          <Text style={[styles.btnText, { color: v.fg, fontSize: size === 'sm' ? 13 : 15 }]}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const BTN_VARIANT: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
  default: { bg: colors.primary, fg: colors.primaryForeground },
  outline: { bg: colors.card, fg: colors.foreground, border: colors.border },
  ghost: { bg: 'transparent', fg: colors.foreground },
  destructive: { bg: colors.destructive, fg: colors.white },
};

/* ── Chip / Badge ── */
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
  const color = active ? colors.primaryForeground : fg ?? colors.mutedForeground;
  const content = (
    <View style={[styles.chip, { backgroundColor: background }]}>
      {dot && <View style={[styles.dot, { backgroundColor: dot }]} />}
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{content}</Pressable> : content;
}

/* ── Skeleton ── */
export function Skeleton({ height, style }: { height: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.skeleton, { height }, style]} />;
}

/* ── EmptyState ── */
export function EmptyState({
  icon,
  title,
  subtitle,
  children,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <View style={styles.empty}>
      {icon && <View style={styles.emptyIcon}>{icon}</View>}
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySub}>{subtitle}</Text>}
      {children}
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
  h1: { fontSize: 20, fontWeight: '800', color: colors.foreground, writingDirection: 'rtl' },
  sub: { fontSize: 13, color: colors.mutedForeground, writingDirection: 'rtl' },
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  btn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
  },
  btnText: { fontWeight: '700', writingDirection: 'rtl' },
  chip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  chipText: { fontSize: 12, fontWeight: '700', writingDirection: 'rtl' },
  dot: { width: 7, height: 7, borderRadius: 999 },
  skeleton: { backgroundColor: colors.muted, borderRadius: 14, width: '100%' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 72, gap: 6 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 20, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.foreground, writingDirection: 'rtl', textAlign: 'center' },
  emptySub: { fontSize: 13, color: colors.mutedForeground, textAlign: 'center', writingDirection: 'rtl', paddingHorizontal: 24 },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 34,
    maxHeight: '90%',
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 999, backgroundColor: colors.border,
    alignSelf: 'center', marginBottom: 14,
  },
});
