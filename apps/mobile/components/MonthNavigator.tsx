// Month selector — a prominent "MM/YYYY ⌄" title that opens a clean month-picker sheet.
// Numeric month format per product preference. Keeps the { month, onChange } contract;
// selecting a month only calls onChange (no business logic here).
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addMonths, format, isSameMonth, startOfMonth } from 'date-fns';
import { colors } from '@/theme/colors';
import { radius, space } from '@/theme/tokens';
import { BottomSheet } from './ui';

const MONTHS_BACK = 18;

export function MonthNavigator({ month, onChange }: { month: Date; onChange: (m: Date) => void }) {
  const [open, setOpen] = useState(false);
  const current = startOfMonth(new Date());

  // Recent months, newest first (no future months — there's no future data).
  const months = useMemo(
    () => Array.from({ length: MONTHS_BACK }, (_, i) => addMonths(current, -i)),
    [current],
  );

  const select = (m: Date) => {
    onChange(startOfMonth(m));
    setOpen(false);
  };

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.title, pressed && { opacity: 0.6 }]}
        onPress={() => setOpen(true)}
        hitSlop={8}
      >
        <Text style={styles.titleText}>{format(month, 'MM/yyyy')}</Text>
        <Ionicons name="chevron-down" size={22} color={colors.foreground} />
      </Pressable>

      <BottomSheet visible={open} onClose={() => setOpen(false)}>
        <Text style={styles.sheetTitle}>בחר חודש</Text>
        <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
          {months.map((m) => {
            const active = isSameMonth(m, month);
            return (
              <Pressable
                key={m.toISOString()}
                style={({ pressed }) => [styles.row, active && styles.rowActive, pressed && { opacity: 0.7 }]}
                onPress={() => select(m)}
              >
                <Text style={[styles.rowText, active && styles.rowTextActive]}>{format(m, 'MM/yyyy')}</Text>
                {active && <Ionicons name="checkmark" size={20} color={colors.primary} />}
              </Pressable>
            );
          })}
        </ScrollView>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  title: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  titleText: { fontSize: 24, fontWeight: '900', color: colors.foreground },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: colors.foreground, textAlign: 'right', writingDirection: 'rtl', marginBottom: space.sm },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: space.md, borderRadius: radius.md,
  },
  rowActive: { backgroundColor: colors.primarySoft },
  rowText: { fontSize: 17, fontWeight: '600', color: colors.foreground },
  rowTextActive: { color: colors.primary, fontWeight: '800' },
});
