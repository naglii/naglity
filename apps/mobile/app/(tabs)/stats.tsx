import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth } from 'date-fns';
import api from '@/lib/api';
import type { Job } from '@/types/api';
import { durationMins, formatHoursLabel, formatPrice, isInMonth } from '@/lib/utils';
import { StatHero, HeroPill } from '@/components/StatHero';
import { MonthNavigator } from '@/components/MonthNavigator';
import { JobStatusBadge } from '@/components/JobStatusBadge';
import { Card, Chip, ScreenHeader, Skeleton } from '@/components/ui';
import { colors } from '@/theme/colors';
import { radius, space } from '@/theme/tokens';

const sum = (jobs: Job[], pick: (j: Job) => number) => jobs.reduce((t, j) => t + pick(j), 0);
type Filter = 'all' | 'PAID' | 'COMPLETED' | 'upcoming';

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [filter, setFilter] = useState<Filter>('all');

  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ['driver-jobs'],
    queryFn: () => api.get('/drivers/me/jobs').then((r) => r.data),
  });

  const m = useMemo(() => {
    const inMonth = jobs.filter((j) => isInMonth(j.scheduledAt, month));
    const paid = inMonth.filter((j) => j.status === 'PAID');
    const completed = inMonth.filter((j) => j.status === 'COMPLETED');
    const done = [...paid, ...completed];
    const upcoming = inMonth.filter((j) => j.status === 'ACCEPTED' || j.status === 'IN_PROGRESS');
    return {
      inMonth, paid, completed, done, upcoming,
      earnedNet: sum(done, (j) => j.netPriceCents),
      paidNet: sum(paid, (j) => j.netPriceCents),
      pendingNet: sum(completed, (j) => j.netPriceCents),
      totalMins: sum(done, (j) => durationMins(j.scheduledAt, j.estimatedEndAt)),
    };
  }, [jobs, month]);

  const filtered = useMemo(() => {
    const pool =
      filter === 'all' ? m.inMonth
      : filter === 'PAID' ? m.paid
      : filter === 'COMPLETED' ? m.completed
      : m.upcoming;
    return [...pool].sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
  }, [filter, m]);

  const chips: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'הכל', count: m.inMonth.length },
    { key: 'PAID', label: 'שולמו', count: m.paid.length },
    { key: 'COMPLETED', label: 'ממתין לתשלום', count: m.completed.length },
    { key: 'upcoming', label: 'מתוכננות', count: m.upcoming.length },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={[styles.screen, { paddingBottom: insets.bottom + 96 }]}>
      <ScreenHeader title="סטטיסטיקות" />
      <View style={styles.monthRow}>
        <MonthNavigator month={month} onChange={setMonth} />
      </View>

      {isLoading ? (
        <View style={{ gap: space.lg }}>
          <Skeleton height={150} />
          <View style={styles.grid}>
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} height={120} style={{ width: '48%' }} />)}
          </View>
        </View>
      ) : (
        <>
          <StatHero
            icon="wallet"
            label="הכנסות נטו"
            amount={formatPrice(m.earnedNet)}
            tone="success"
          >
            <HeroPill icon="checkmark-circle" tone="success">{m.paid.length} שולמו · {formatPrice(m.paidNet)}</HeroPill>
            <HeroPill icon="time" tone="info">{m.completed.length} ממתינות · {formatPrice(m.pendingNet)}</HeroPill>
          </StatHero>

          <View style={styles.grid}>
            <StatTile title="עבודות שהושלמו" value={String(m.done.length)} icon="checkmark-circle" tone="success" />
            <StatTile title="עבודות ששולמו" value={String(m.paid.length)} icon="cash" tone="primary" />
            <StatTile title="שעות עבודה" value={formatHoursLabel(m.totalMins)} icon="timer-outline" tone="info" />
            <StatTile title="מתוכננות החודש" value={String(m.upcoming.length)} icon="calendar" tone="warning" />
          </View>

          {/* Breakdown */}
          <Text style={styles.breakdownTitle}>פירוט עבודות</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {chips.map((c) => (
              <Chip key={c.key} label={`${c.label} ${c.count}`} active={filter === c.key} onPress={() => setFilter(c.key)} />
            ))}
          </ScrollView>

          {filtered.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="file-tray-outline" size={30} color={colors.primary} />
              <Text style={styles.emptyText}>אין עבודות להצגה בחודש זה</Text>
            </Card>
          ) : (
            <Card>
              {filtered.map((job, i) => (
                <View key={job.id} style={[styles.jobRow, i > 0 && styles.rowDivider]}>
                  <View style={styles.dateCol}>
                    <Text style={styles.dateBig}>{format(new Date(job.scheduledAt), 'dd/MM')}</Text>
                    <Text style={styles.dateSmall}>{format(new Date(job.scheduledAt), 'HH:mm')}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.jobTitle} numberOfLines={1}>{job.title}</Text>
                    <View style={styles.routeRow}>
                      <Ionicons name="location-outline" size={13} color={colors.primary} />
                      <Text style={styles.routeText} numberOfLines={1}>{job.fromLocation} ← {job.toLocation}</Text>
                    </View>
                  </View>
                  <View style={styles.jobEnd}>
                    <Text style={styles.jobPrice}>{formatPrice(job.netPriceCents)}</Text>
                    <JobStatusBadge status={job.status} />
                  </View>
                </View>
              ))}
            </Card>
          )}
        </>
      )}
    </ScrollView>
  );
}

const TONES: Record<string, { bg: string; fg: string }> = {
  primary: { bg: colors.primarySoft, fg: colors.primary },
  success: { bg: colors.moneySoft, fg: colors.money },
  info: { bg: colors.infoSoft, fg: colors.info },
  warning: { bg: colors.warningSoft, fg: colors.warning },
};

function StatTile({ title, value, icon, tone }: { title: string; value: string; icon: any; tone: 'primary' | 'success' | 'info' | 'warning' }) {
  const t = TONES[tone];
  return (
    <Card style={styles.tile}>
      <View style={[styles.tileIcon, { backgroundColor: t.bg }]}>
        <Ionicons name={icon} size={22} color={t.fg} />
      </View>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileTitle} numberOfLines={1}>{title}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { padding: space.lg, paddingBottom: 40, gap: space.lg },
  monthRow: { alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, justifyContent: 'space-between' },
  tile: { width: '48%', padding: space.lg, gap: space.sm, alignItems: 'flex-end' },
  tileIcon: { width: 48, height: 48, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  tileValue: { fontSize: 30, fontWeight: '900', color: colors.foreground, marginTop: 4 },
  tileTitle: { fontSize: 13, color: colors.mutedForeground, textAlign: 'right', writingDirection: 'rtl' },
  breakdownTitle: { fontSize: 17, fontWeight: '800', color: colors.foreground, textAlign: 'right', writingDirection: 'rtl' },
  chipRow: { flexDirection: 'row', gap: space.sm, paddingVertical: 2 },
  emptyCard: { padding: 40, alignItems: 'center', gap: space.sm },
  emptyText: { fontSize: 14, color: colors.mutedForeground, writingDirection: 'rtl' },
  jobRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  dateCol: { width: 50, alignItems: 'center' },
  dateBig: { fontSize: 15, fontWeight: '800', color: colors.foreground },
  dateSmall: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
  jobTitle: { fontSize: 15, fontWeight: '700', color: colors.foreground, textAlign: 'right', writingDirection: 'rtl' },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  routeText: { fontSize: 13, color: colors.mutedForeground, flexShrink: 1, textAlign: 'right', writingDirection: 'rtl' },
  jobEnd: { alignItems: 'flex-start', gap: 5 },
  jobPrice: { fontSize: 15, fontWeight: '800', color: colors.money },
});
