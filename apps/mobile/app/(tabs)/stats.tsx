import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth } from 'date-fns';
import { he } from 'date-fns/locale';
import api from '@/lib/api';
import type { Job } from '@/types/api';
import { durationMins, formatHoursLabel, formatPrice, isInMonth } from '@/lib/utils';
import { StatHero, HeroPill } from '@/components/StatHero';
import { MonthNavigator } from '@/components/MonthNavigator';
import { JobStatusBadge } from '@/components/JobStatusBadge';
import { Card, Chip, Skeleton } from '@/components/ui';
import { colors } from '@/theme/colors';

const sum = (jobs: Job[], pick: (j: Job) => number) => jobs.reduce((t, j) => t + pick(j), 0);
type Filter = 'all' | 'PAID' | 'COMPLETED' | 'upcoming';

export default function StatsScreen() {
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
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.screen}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.h1}>סטטיסטיקות</Text>
          <Text style={styles.sub}>סיכום הכנסות ופעילות לפי חודש</Text>
        </View>
      </View>
      <MonthNavigator month={month} onChange={setMonth} />

      {isLoading ? (
        <View style={{ gap: 14 }}>
          <Skeleton height={140} />
          <View style={styles.cardsGrid}>
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} height={88} style={{ width: '48%' }} />)}
          </View>
        </View>
      ) : (
        <>
          <StatHero
            icon="wallet"
            label={`הכנסות נטו · ${format(month, 'MMMM yyyy', { locale: he })}`}
            amount={formatPrice(m.earnedNet)}
          >
            <HeroPill icon="checkmark-circle" tone="success">{m.paid.length} שולמו · {formatPrice(m.paidNet)}</HeroPill>
            <HeroPill icon="time" tone="info">{m.completed.length} ממתינות · {formatPrice(m.pendingNet)}</HeroPill>
          </StatHero>

          <View style={styles.cardsGrid}>
            <StatTile title="עבודות שהושלמו" value={String(m.done.length)} icon="checkmark-circle" tone="success" />
            <StatTile title="עבודות ששולמו" value={String(m.paid.length)} icon="cash" tone="brand" />
            <StatTile title="שעות עבודה" value={formatHoursLabel(m.totalMins)} icon="timer-outline" tone="info" />
            <StatTile title="מתוכננות החודש" value={String(m.upcoming.length)} icon="calendar" tone="warning" />
          </View>

          {/* Breakdown */}
          <View style={styles.breakdownHead}>
            <Text style={styles.breakdownTitle}>פירוט עבודות</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {chips.map((c) => (
                <Chip key={c.key} label={`${c.label} ${c.count}`} active={filter === c.key} onPress={() => setFilter(c.key)} />
              ))}
            </ScrollView>
          </View>

          {filtered.length === 0 ? (
            <Card style={{ padding: 40, alignItems: 'center' }}>
              <Ionicons name="file-tray-outline" size={26} color={colors.brandStrong} />
              <Text style={styles.emptyText}>אין עבודות להצגה בחודש זה</Text>
            </Card>
          ) : (
            <Card style={{ padding: 0 }}>
              {filtered.map((job, i) => (
                <View key={job.id} style={[styles.jobRow, i > 0 && styles.rowDivider]}>
                  <View style={styles.dateCol}>
                    <Text style={styles.dateBig}>{format(new Date(job.scheduledAt), 'dd/MM')}</Text>
                    <Text style={styles.dateSmall}>{format(new Date(job.scheduledAt), 'HH:mm')}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.jobTitle} numberOfLines={1}>{job.title}</Text>
                    <View style={styles.routeRow}>
                      <Ionicons name="location-outline" size={12} color={colors.brandStrong} />
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

function StatTile({ title, value, icon, tone }: { title: string; value: string; icon: any; tone: 'brand' | 'success' | 'info' | 'warning' }) {
  const TONE = {
    brand: { bg: colors.brandSoft, fg: colors.brandStrong },
    success: { bg: colors.successSoft, fg: colors.success },
    info: { bg: colors.infoSoft, fg: colors.info },
    warning: { bg: colors.warningSoft, fg: colors.warning },
  }[tone];
  return (
    <Card style={styles.tile}>
      <View style={[styles.tileIcon, { backgroundColor: TONE.bg }]}>
        <Ionicons name={icon} size={20} color={TONE.fg} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.tileTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.tileValue}>{value}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, paddingBottom: 40, gap: 16 },
  headerRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  h1: { fontSize: 20, fontWeight: '800', color: colors.foreground, textAlign: 'right', writingDirection: 'rtl' },
  sub: { fontSize: 13, color: colors.mutedForeground, textAlign: 'right', writingDirection: 'rtl', marginTop: 2 },
  cardsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  tile: { width: '48%', flexDirection: 'row-reverse', alignItems: 'center', gap: 12, padding: 14 },
  tileIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tileTitle: { fontSize: 12, color: colors.mutedForeground, textAlign: 'right', writingDirection: 'rtl' },
  tileValue: { fontSize: 22, fontWeight: '800', color: colors.foreground, marginTop: 2, textAlign: 'right' },
  breakdownHead: { gap: 10 },
  breakdownTitle: { fontSize: 14, fontWeight: '700', color: colors.foreground, textAlign: 'right', writingDirection: 'rtl' },
  chipRow: { flexDirection: 'row-reverse', gap: 8, paddingVertical: 2 },
  emptyText: { fontSize: 13, color: colors.mutedForeground, marginTop: 8, writingDirection: 'rtl' },
  jobRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 14, padding: 16 },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  dateCol: { width: 48, alignItems: 'center' },
  dateBig: { fontSize: 14, fontWeight: '800', color: colors.foreground },
  dateSmall: { fontSize: 11, color: colors.mutedForeground, marginTop: 2 },
  jobTitle: { fontSize: 14, fontWeight: '700', color: colors.foreground, textAlign: 'right', writingDirection: 'rtl' },
  routeRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, marginTop: 2 },
  routeText: { fontSize: 12, color: colors.mutedForeground, flexShrink: 1, textAlign: 'right', writingDirection: 'rtl' },
  jobEnd: { alignItems: 'flex-start', gap: 4 },
  jobPrice: { fontSize: 14, fontWeight: '800', color: colors.foreground },
});
