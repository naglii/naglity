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
        {[0, 1, 2].map((i) => <Skeleton key={i} height={120} style={{ marginBottom: 12 }} />)}
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
          icon={<Ionicons name="calendar-outline" size={28} color={colors.brandStrong} />}
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
        <View key={group.key} style={{ gap: 12 }}>
          <View style={styles.dayHead}>
            <Text style={styles.dayLabel}>{dayLabel(group.date)}</Text>
            <View style={styles.dayCount}><Text style={styles.dayCountText}>{group.jobs.length}</Text></View>
            <View style={styles.dayRule} />
          </View>

          {group.jobs.map((job) => {
            const isJobToday = isSameDay(new Date(job.scheduledAt), new Date());
            return (
              <Card key={job.id} style={{ borderRightWidth: 4, borderRightColor: accentByStatus[job.status] ?? colors.border }}>
                <View style={styles.timeRail}>
                  <Text style={styles.time}>{format(new Date(job.scheduledAt), 'HH:mm')}</Text>
                  <Text style={styles.timeLabel}>התחלה</Text>
                </View>
                <View style={styles.jobBody}>
                  <View style={styles.jobTitleRow}>
                    <Text style={styles.jobTitle} numberOfLines={1}>{job.title}</Text>
                    <JobStatusBadge status={job.status} />
                  </View>

                  <View style={styles.routeRow}>
                    <Ionicons name="location-outline" size={14} color={colors.brandStrong} />
                    <Text style={styles.routeText} numberOfLines={1}>{job.fromLocation} ← {job.toLocation}</Text>
                  </View>

                  <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={13} color={colors.mutedForeground} />
                    <Text style={styles.metaText}>זמן נסיעה משוער · {formatHoursLabel(durationMins(job.scheduledAt, job.estimatedEndAt))}</Text>
                  </View>

                  {(job.craneCapacityTons != null || job.loadType) && (
                    <View style={styles.tags}>
                      {job.craneCapacityTons != null && (
                        <View style={[styles.tag, { backgroundColor: colors.brandSoft }]}>
                          <Ionicons name="barbell-outline" size={13} color={colors.brandStrong} />
                          <Text style={[styles.tagText, { color: colors.brandStrong }]}>{job.craneCapacityTons} טון</Text>
                        </View>
                      )}
                      {job.loadType && (
                        <View style={[styles.tag, { backgroundColor: colors.muted }]}>
                          <Ionicons name="cube-outline" size={13} color={colors.mutedForeground} />
                          <Text style={[styles.tagText, { color: colors.mutedForeground }]}>{loadTypeLabel(job.loadType)}</Text>
                        </View>
                      )}
                    </View>
                  )}

                  <View style={styles.footerRow}>
                    <Text style={styles.price}>
                      {formatPrice(job.netPriceCents)} <Text style={styles.priceUnit}>נטו</Text>
                    </Text>
                    <View style={styles.actions}>
                      {!!job.business?.phone && (
                        <Button
                          title="התקשר"
                          variant="outline"
                          size="sm"
                          onPress={() => Linking.openURL(`tel:${job.business!.phone}`)}
                          icon={<Ionicons name="call-outline" size={14} color={colors.foreground} />}
                        />
                      )}
                      {job.status === 'ACCEPTED' && (
                        <Button
                          title="התחל"
                          size="sm"
                          disabled={!isJobToday}
                          onPress={() => startMutation.mutate(job.id)}
                          icon={<Ionicons name="play" size={14} color={colors.white} />}
                        />
                      )}
                      {job.status === 'ACCEPTED' && (
                        <Button
                          title="בטל"
                          variant="outline"
                          size="sm"
                          disabled={isJobToday}
                          onPress={() => confirmCancel(job)}
                          icon={<Ionicons name="close" size={14} color={colors.foreground} />}
                        />
                      )}
                    </View>
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
  screen: { padding: 16, paddingBottom: 40, gap: 22 },
  h1: { fontSize: 20, fontWeight: '800', color: colors.foreground, textAlign: 'right', writingDirection: 'rtl' },
  sub: { fontSize: 13, color: colors.mutedForeground, textAlign: 'right', writingDirection: 'rtl', marginTop: 2 },
  dayHead: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  dayLabel: { fontSize: 14, fontWeight: '700', color: colors.foreground, writingDirection: 'rtl' },
  dayCount: { backgroundColor: colors.accent, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  dayCountText: { fontSize: 11, fontWeight: '700', color: colors.mutedForeground },
  dayRule: { flex: 1, height: 1, backgroundColor: colors.border },
  timeRail: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.accent, paddingHorizontal: 16, paddingVertical: 10 },
  time: { fontSize: 18, fontWeight: '800', color: colors.foreground },
  timeLabel: { fontSize: 11, color: colors.mutedForeground, writingDirection: 'rtl' },
  jobBody: { padding: 16, gap: 10 },
  jobTitleRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  jobTitle: { fontSize: 15, fontWeight: '700', color: colors.foreground, flexShrink: 1, textAlign: 'right', writingDirection: 'rtl' },
  routeRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  routeText: { fontSize: 14, color: colors.mutedForeground, flexShrink: 1, textAlign: 'right', writingDirection: 'rtl' },
  metaRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, color: colors.mutedForeground, writingDirection: 'rtl' },
  tags: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 },
  tag: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8 },
  tagText: { fontSize: 12, fontWeight: '700', writingDirection: 'rtl' },
  footerRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 2 },
  price: { fontSize: 15, fontWeight: '800', color: colors.foreground },
  priceUnit: { fontSize: 12, fontWeight: '400', color: colors.mutedForeground },
  actions: { flexDirection: 'row-reverse', gap: 8, flexShrink: 1 },
  hint: { fontSize: 11, color: colors.mutedForeground, writingDirection: 'rtl', textAlign: 'right' },
});
