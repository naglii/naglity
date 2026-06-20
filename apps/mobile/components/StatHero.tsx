// Mirrors apps/web/components/stats/StatHero.tsx + HeroPill.
import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

type Tone = 'brand' | 'success' | 'warning' | 'info' | 'muted';

const TONE: Record<Tone, { bg: string; fg: string }> = {
  brand: { bg: colors.brandSoft, fg: colors.brandStrong },
  success: { bg: colors.successSoft, fg: colors.success },
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
  const accent = tone === 'success' ? colors.success : colors.brandStrong;
  const chipBg = tone === 'success' ? colors.successSoft : colors.brandSoft;
  return (
    <View style={[styles.card, { backgroundColor: tone === 'success' ? colors.successSoft : colors.brandSoft }]}>
      <View style={styles.cardInner}>
        <View style={styles.labelRow}>
          <View style={[styles.iconChip, { backgroundColor: chipBg }]}>
            <Ionicons name={icon} size={15} color={accent} />
          </View>
          <Text style={styles.label}>{label}</Text>
        </View>
        <Text style={[styles.amount, { color: accent }]}>{amount}</Text>
        {children && <View style={styles.pills}>{children}</View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  cardInner: { backgroundColor: 'rgba(255,255,255,0.55)', padding: 22 },
  labelRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  iconChip: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: colors.mutedForeground, writingDirection: 'rtl' },
  amount: { fontSize: 34, fontWeight: '900', marginTop: 8, textAlign: 'right' },
  pills: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  pill: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999 },
  pillText: { fontSize: 12, fontWeight: '700', writingDirection: 'rtl' },
});
