// Mirrors apps/web/components/stats/MonthNavigator.tsx.
// Stepping forward is disabled once you reach the current month. In RTL the
// "older" controls sit on the right, "newer" on the left.
import { addMonths, addYears, format, isSameMonth, startOfMonth } from 'date-fns';
import { he } from 'date-fns/locale';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

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
    <Pressable onPress={onPress} disabled={disabled} style={[styles.btn, disabled && { opacity: 0.3 }]}>
      <Ionicons name={icon} size={16} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 4,
  },
  btn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  label: { minWidth: 110, textAlign: 'center', fontSize: 13, fontWeight: '700', color: colors.foreground },
});
