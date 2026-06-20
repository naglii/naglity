import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth } from 'date-fns';
import { he } from 'date-fns/locale';
import api from '@/lib/api';
import type { JobOffer } from '@/types/api';
import { formatPrice, netCents } from '@/lib/utils';
import { OFFER_STATUS_CONFIG } from '@/theme/jobStatus';
import { Card, Chip, EmptyState, Skeleton } from '@/components/ui';
import { colors } from '@/theme/colors';
import { radius, space } from '@/theme/tokens';

const monthKey = (iso: string) => format(startOfMonth(new Date(iso)), 'yyyy-MM');

export default function OffersScreen() {
  const [month, setMonth] = useState('all');

  const { data: offers = [], isLoading } = useQuery<JobOffer[]>({
    queryKey: ['my-offers'],
    queryFn: () => api.get('/jobs/my-offers').then((r) => r.data),
  });

  const withDate = useMemo(() => offers.filter((o) => o.job?.scheduledAt), [offers]);

  const months = useMemo(() => {
    const map = new Map<string, Date>();
    for (const o of withDate) map.set(monthKey(o.job!.scheduledAt), startOfMonth(new Date(o.job!.scheduledAt)));
    return Array.from(map.entries())
      .map(([key, date]) => ({ key, date }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [withDate]);

  const filtered = useMemo(() => {
    const list = month === 'all' ? withDate : withDate.filter((o) => monthKey(o.job!.scheduledAt) === month);
    return [...list].sort((a, b) => new Date(a.job!.scheduledAt).getTime() - new Date(b.job!.scheduledAt).getTime());
  }, [withDate, month]);

  if (isLoading) {
    return (
      <View style={styles.screen}>
        {[0, 1, 2].map((i) => <Skeleton key={i} height={110} style={{ marginBottom: 12 }} />)}
      </View>
    );
  }

  if (offers.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <EmptyState
          icon={<Ionicons name="cash-outline" size={34} color={colors.primary} />}
          title="לא שלחת הצעות עדיין"
          subtitle='הצעות שתגיש על עבודות "פתוחות להצעות" יופיעו כאן'
        />
      </View>
    );
  }

  const pending = withDate.filter((o) => o.status === 'PENDING').length;

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.screen}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.h1}>ההצעות שלי</Text>
          <Text style={styles.sub}>{filtered.length} הצעות · לפי תאריך העבודה</Text>
        </View>
        <View style={styles.pendingPill}>
          <Text style={styles.pendingText}>{pending} ממתינות</Text>
        </View>
      </View>

      {months.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          <Chip label="הכל" active={month === 'all'} onPress={() => setMonth('all')} />
          {months.map(({ key, date }) => (
            <Chip key={key} label={format(date, 'MMMM yyyy', { locale: he })} active={month === key} onPress={() => setMonth(key)} />
          ))}
        </ScrollView>
      )}

      {filtered.length === 0 ? (
        <Text style={styles.emptyMonth}>אין הצעות בחודש זה</Text>
      ) : (
        <View style={{ gap: 12 }}>
          {filtered.map((o) => {
            const s = OFFER_STATUS_CONFIG[o.status] ?? OFFER_STATUS_CONFIG.PENDING;
            const scheduled = new Date(o.job!.scheduledAt);
            return (
              <Card key={o.id} style={[styles.offerCard, { borderRightColor: s.border, borderRightWidth: 4 }]}>
                <View style={styles.offerBody}>
                  <View style={styles.offerTitleRow}>
                    <Text style={styles.offerTitle} numberOfLines={1}>{o.job!.title}</Text>
                    <View style={[styles.statusChip, { backgroundColor: s.bg }]}>
                      <Text style={[styles.statusText, { color: s.fg }]}>{s.label}</Text>
                    </View>
                  </View>

                  <View style={styles.routeRow}>
                    <Ionicons name="location-outline" size={14} color={colors.brandStrong} />
                    <Text style={styles.routeText} numberOfLines={1}>
                      {o.job!.fromLocation} ← {o.job!.toLocation}
                    </Text>
                  </View>

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar-outline" size={13} color={colors.mutedForeground} />
                      <Text style={styles.metaText}>{format(scheduled, 'EEEE, d בMMM · HH:mm', { locale: he })}</Text>
                    </View>
                    {o.etaMinutes != null && (
                      <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={13} color={colors.mutedForeground} />
                        <Text style={styles.metaText}>הגעה ~{o.etaMinutes} דק׳</Text>
                      </View>
                    )}
                  </View>

                  {!!o.note && <Text style={styles.note} numberOfLines={1}>“{o.note}”</Text>}
                </View>

                <View style={styles.priceRail}>
                  <Text style={styles.priceBig}>{formatPrice(o.amountCents)}</Text>
                  <Text style={styles.priceLabel}>ההצעה שלך</Text>
                  <Text style={styles.priceNet}>תקבל ~{formatPrice(netCents(o.amountCents))}</Text>
                </View>
              </Card>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: space.lg, paddingBottom: 40, gap: space.md },
  headerRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  h1: { fontSize: 24, fontWeight: '800', color: colors.foreground, textAlign: 'right', writingDirection: 'rtl' },
  sub: { fontSize: 14, color: colors.mutedForeground, textAlign: 'right', writingDirection: 'rtl', marginTop: 2 },
  pendingPill: { backgroundColor: colors.pendingSoft, paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.pill },
  pendingText: { fontSize: 13, fontWeight: '800', color: colors.pending },
  chipRow: { flexDirection: 'row-reverse', gap: space.sm, paddingVertical: 2 },
  emptyMonth: { textAlign: 'center', color: colors.mutedForeground, paddingVertical: 40, writingDirection: 'rtl' },
  offerCard: { flexDirection: 'row-reverse' },
  offerBody: { flex: 1, padding: space.lg, gap: space.sm },
  offerTitleRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: space.sm },
  offerTitle: { fontSize: 16, fontWeight: '800', color: colors.foreground, flexShrink: 1, textAlign: 'right', writingDirection: 'rtl' },
  statusChip: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999 },
  statusText: { fontSize: 12, fontWeight: '800', writingDirection: 'rtl' },
  routeRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  routeText: { fontSize: 14, color: colors.mutedForeground, flexShrink: 1, textAlign: 'right', writingDirection: 'rtl' },
  metaRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: space.md },
  metaItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: colors.mutedForeground, writingDirection: 'rtl' },
  note: { fontSize: 13, color: colors.foreground, writingDirection: 'rtl', textAlign: 'right' },
  priceRail: {
    width: 116, alignItems: 'center', justifyContent: 'center', gap: 2,
    backgroundColor: colors.primarySoft, padding: space.md,
  },
  priceBig: { fontSize: 20, fontWeight: '900', color: colors.primary },
  priceLabel: { fontSize: 11, color: colors.mutedForeground, writingDirection: 'rtl' },
  priceNet: { fontSize: 12, fontWeight: '800', color: colors.money, marginTop: 4, writingDirection: 'rtl' },
});
