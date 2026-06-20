// Mirrors apps/web/components/stats/StatHero.tsx + HeroPill.
import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { radius, shadow, space } from '@/theme/tokens';

type Tone = 'brand' | 'success' | 'warning' | 'info' | 'muted';

const TONE: Record<Tone, { bg: string; fg: string }> = {
  brand: { bg: colors.primarySoft, fg: colors.primary },
  success: { bg: colors.moneySoft, fg: colors.money },
  warning: { bg: colors.warningSoft, fg: colors.warning },
  info: { bg: colors.infoSoft, fg: colors.info },
  muted: { bg: colors.muted, fg: colors.mutedForeground },
};

export function HeroPill({ icon, tone = 'muted', children }: { icon?: any; tone?: Tone; children: ReactNode }) {
  const t = TONE[tone];
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }]}>
      {icon && <Ionicons name={icon} size={13} color={t.fg} />}
      <Text style={[styles.pillText, { color: t.fg }]}>{children}</Text>
    </View>
  );
}

export function StatHero({
  icon,
  label,
  amount,
  children,
  tone = 'brand',
}: {
  icon: any;
  label: string;
  amount: string;
  children?: ReactNode;
  tone?: 'brand' | 'success';
}) {
  const accent = tone === 'success' ? colors.money : colors.primary;
  const chipBg = tone === 'success' ? colors.moneySoft : colors.primarySoft;
  return (
    <View style={styles.card}>
      <View style={styles.labelRow}>
        <View style={[styles.iconChip, { backgroundColor: chipBg }]}>
          <Ionicons name={icon} size={18} color={accent} />
        </View>
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={[styles.amount, { color: accent }]}>{amount}</Text>
      {children && <View style={styles.pills}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.xxl, padding: 24, ...shadow.card },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  iconChip: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: colors.mutedForeground, writingDirection: 'rtl' },
  amount: { fontSize: 40, fontWeight: '900', marginTop: 10, textAlign: 'right' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 13, borderRadius: 999 },
  pillText: { fontSize: 13, fontWeight: '700', writingDirection: 'rtl' },
});
