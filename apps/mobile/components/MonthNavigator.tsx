// Mirrors apps/web/components/stats/MonthNavigator.tsx.
// Stepping forward is disabled once you reach the current month. In RTL the
// "older" controls sit on the right, "newer" on the left.
import { addMonths, addYears, format, isSameMonth, startOfMonth } from 'date-fns';
import { he } from 'date-fns/locale';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { radius, shadow } from '@/theme/tokens';

export function MonthNavigator({ month, onChange }: { month: Date; onChange: (m: Date) => void }) {
  const current = startOfMonth(new Date());
  const isCurrent = isSameMonth(month, current);
  const go = (next: Date) => onChange(startOfMonth(next > current ? current : next));

  return (
    <View style={styles.wrap}>
      <NavBtn icon="play-skip-forward" onPress={() => go(addYears(month, -1))} />
      <NavBtn icon="chevron-forward" onPress={() => go(addMonths(month, -1))} />
      <Text style={styles.label}>{format(month, 'MMMM yyyy', { locale: he })}</Text>
      <NavBtn icon="chevron-back" onPress={() => go(addMonths(month, 1))} disabled={isCurrent} />
      <NavBtn icon="play-skip-back" onPress={() => go(addYears(month, 1))} disabled={isCurrent} />
    </View>
  );
}

function NavBtn({ icon, onPress, disabled }: { icon: any; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.btn, disabled && { opacity: 0.25 }, pressed && !disabled && { backgroundColor: colors.muted }]}
    >
      <Ionicons name={icon} size={18} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 5,
    ...shadow.card,
  },
  btn: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md },
  label: { flex: 1, minWidth: 120, textAlign: 'center', fontSize: 15, fontWeight: '800', color: colors.foreground },
});
