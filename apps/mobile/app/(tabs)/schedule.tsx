import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, isBefore, isSameDay, isToday, isTomorrow, startOfDay } from 'date-fns';
import { he } from 'date-fns/locale';
import api from '@/lib/api';
import type { Job } from '@/types/api';
import { durationMins, formatHoursLabel, formatPrice } from '@/lib/utils';
import { loadTypeLabel } from '@/lib/jobAttributes';
import { JobStatusBadge } from '@/components/JobStatusBadge';
import { Button, Card, EmptyState, Skeleton } from '@/components/ui';
import { toast } from '@/components/Toast';
import { colors } from '@/theme/colors';
import { radius, space } from '@/theme/tokens';

const accentByStatus: Record<string, string> = {
  ACCEPTED: colors.warning,
  IN_PROGRESS: colors.info,
};

function dayLabel(d: Date): string {
  if (isToday(d)) return 'היום';
  if (isTomorrow(d)) return 'מחר';
  return format(d, 'EEEE, d בMMMM', { locale: he });
}

export default function ScheduleScreen() {
  const qc = useQueryClient();

  const { data: jobs, isLoading } = useQuery<Job[]>({
    queryKey: ['driver-jobs'],
    queryFn: () => api.get('/drivers/me/jobs').then((r) => r.data),
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => api.post(`/jobs/${id}/start`),
    onSuccess: () => { toast.success('העבודה החלה'); qc.invalidateQueries({ queryKey: ['driver-jobs'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'שגיאה'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.post(`/jobs/${id}/cancel`),
    onSuccess: () => { toast.success('העבודה בוטלה וחזרה לרשימת ההצעות'); qc.invalidateQueries({ queryKey: ['driver-jobs'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'שגיאה בביטול'),
  });

  const confirmCancel = (job: Job) => {
    Alert.alert(
      'לבטל את קבלת העבודה?',
      `${job.title}\nהעבודה תחזור לרשימת ההצעות לנהגים אחרים.`,
      [
        { text: 'חזרה', style: 'cancel' },
        { text: 'אישור ביטול', style: 'destructive', onPress: () => cancelMutation.mutate(job.id) },
      ],
    );
  };

  if (isLoading) {
    return (
      <View style={styles.screen}>
        {[0, 1, 2].map((i) => <Skeleton key={i} height={150} style={{ marginBottom: space.md }} />)}
      </View>
    );
  }

  const today = startOfDay(new Date());
  const active = (jobs ?? [])
    .filter((j) => ['ACCEPTED', 'IN_PROGRESS'].includes(j.status))
    .filter((j) => !isBefore(new Date(j.scheduledAt), today))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  if (active.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <EmptyState
          icon={<Ionicons name="calendar-outline" size={34} color={colors.primary} />}
          title="לוח הזמנים ריק"
          subtitle="עבודות שתקבל יופיעו כאן מסודרות לפי יום ושעה"
        />
      </View>
    );
  }

  const groups: { key: string; date: Date; jobs: Job[] }[] = [];
  for (const job of active) {
    const d = new Date(job.scheduledAt);
    const last = groups[groups.length - 1];
    if (last && isSameDay(last.date, d)) last.jobs.push(job);
    else groups.push({ key: job.id, date: d, jobs: [job] });
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.screen}>
      <View>
        <Text style={styles.h1}>לוח הזמנים שלי</Text>
        <Text style={styles.sub}>{active.length} עבודות פעילות</Text>
      </View>

      {groups.map((group) => (
        <View key={group.key} style={{ gap: space.md }}>
          <View style={styles.dayHeader}>
            <Text style={styles.dayLabel}>{dayLabel(group.date)}</Text>
            <View style={styles.dayCount}><Text style={styles.dayCountText}>{group.jobs.length}</Text></View>
          </View>

          {group.jobs.map((job) => {
            const isJobToday = isSameDay(new Date(job.scheduledAt), new Date());
            return (
              <Card key={job.id} style={{ borderRightWidth: 5, borderRightColor: accentByStatus[job.status] ?? colors.border }}>
                <View style={styles.jobBody}>
                  {/* time + status row */}
                  <View style={styles.topRow}>
                    <View style={styles.timeBlock}>
                      <Text style={styles.time}>{format(new Date(job.scheduledAt), 'HH:mm')}</Text>
                      <Text style={styles.timeLabel}>שעת התחלה</Text>
                    </View>
                    <JobStatusBadge status={job.status} />
                  </View>

                  <Text style={styles.jobTitle} numberOfLines={1}>{job.title}</Text>

                  <View style={styles.routeRow}>
                    <Ionicons name="location-outline" size={15} color={colors.primary} />
                    <Text style={styles.routeText} numberOfLines={1}>{job.fromLocation} ← {job.toLocation}</Text>
                  </View>

                  <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={14} color={colors.mutedForeground} />
                    <Text style={styles.metaText}>נסיעה · {formatHoursLabel(durationMins(job.scheduledAt, job.estimatedEndAt))}</Text>
                  </View>

                  {(job.craneCapacityTons != null || job.loadType) && (
                    <View style={styles.tags}>
                      {job.craneCapacityTons != null && (
                        <View style={[styles.tag, { backgroundColor: colors.primarySoft }]}>
                          <Ionicons name="barbell-outline" size={14} color={colors.primary} />
                          <Text style={[styles.tagText, { color: colors.primary }]}>{job.craneCapacityTons} טון</Text>
                        </View>
                      )}
                      {job.loadType && (
                        <View style={[styles.tag, { backgroundColor: colors.muted }]}>
                          <Ionicons name="cube-outline" size={14} color={colors.slate700} />
                          <Text style={[styles.tagText, { color: colors.slate700 }]}>{loadTypeLabel(job.loadType)}</Text>
                        </View>
                      )}
                    </View>
                  )}

                  <View style={styles.priceRow}>
                    <Text style={styles.price}>{formatPrice(job.netPriceCents)}</Text>
                    <Text style={styles.priceUnit}>תשלום נטו</Text>
                  </View>

                  {/* Actions */}
                  {job.status === 'ACCEPTED' && (
                    <Button
                      title="התחל עבודה"
                      size="lg"
                      disabled={!isJobToday}
                      onPress={() => startMutation.mutate(job.id)}
                      icon={<Ionicons name="play" size={18} color={colors.white} />}
                    />
                  )}
                  <View style={styles.secondaryActions}>
                    {!!job.business?.phone && (
                      <Button
                        title="התקשר"
                        variant="secondary"
                        size="md"
                        style={{ flex: 1 }}
                        onPress={() => Linking.openURL(`tel:${job.business!.phone}`)}
                        icon={<Ionicons name="call-outline" size={16} color={colors.brandStrong} />}
                      />
                    )}
                    {job.status === 'ACCEPTED' && (
                      <Button
                        title="בטל"
                        variant="destructive"
                        size="md"
                        style={{ flex: 1 }}
                        disabled={isJobToday}
                        onPress={() => confirmCancel(job)}
                        icon={<Ionicons name="close" size={16} color={colors.destructive} />}
                      />
                    )}
                  </View>

                  {isJobToday && job.status === 'ACCEPTED' && (
                    <Text style={styles.hint}>לא ניתן לבטל ביום העבודה</Text>
                  )}
                </View>
              </Card>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: space.lg, paddingBottom: 40, gap: space.xl },
  h1: { fontSize: 24, fontWeight: '800', color: colors.foreground, textAlign: 'right', writingDirection: 'rtl' },
  sub: { fontSize: 14, color: colors.mutedForeground, textAlign: 'right', writingDirection: 'rtl', marginTop: 2 },
  dayHeader: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: space.sm,
    backgroundColor: colors.primarySoft, alignSelf: 'flex-end',
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.pill,
  },
  dayLabel: { fontSize: 14, fontWeight: '800', color: colors.primaryStrong, writingDirection: 'rtl' },
  dayCount: { backgroundColor: colors.card, borderRadius: 999, minWidth: 22, alignItems: 'center', paddingHorizontal: 7, paddingVertical: 1 },
  dayCountText: { fontSize: 12, fontWeight: '800', color: colors.primary },
  jobBody: { padding: space.lg, gap: space.md },
  topRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  timeBlock: { flexDirection: 'row-reverse', alignItems: 'baseline', gap: 6 },
  time: { fontSize: 28, fontWeight: '900', color: colors.foreground },
  timeLabel: { fontSize: 12, color: colors.mutedForeground, writingDirection: 'rtl' },
  jobTitle: { fontSize: 17, fontWeight: '800', color: colors.foreground, textAlign: 'right', writingDirection: 'rtl' },
  routeRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  routeText: { fontSize: 15, color: colors.foreground, flexShrink: 1, textAlign: 'right', writingDirection: 'rtl' },
  metaRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, color: colors.mutedForeground, writingDirection: 'rtl' },
  tags: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 7 },
  tag: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 10, borderRadius: radius.md },
  tagText: { fontSize: 13, fontWeight: '700', writingDirection: 'rtl' },
  priceRow: { flexDirection: 'row-reverse', alignItems: 'baseline', gap: 7 },
  price: { fontSize: 22, fontWeight: '900', color: colors.money },
  priceUnit: { fontSize: 13, color: colors.mutedForeground, writingDirection: 'rtl' },
  secondaryActions: { flexDirection: 'row-reverse', gap: space.sm },
  hint: { fontSize: 12, color: colors.mutedForeground, writingDirection: 'rtl', textAlign: 'right' },
});
