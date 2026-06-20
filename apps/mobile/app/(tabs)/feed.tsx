import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import api from '@/lib/api';
import { initSocket } from '@/lib/socket';
import type { Job, JobOffer, Notification, PayoutAccountStatus } from '@/types/api';
import { CAPACITY_BUCKETS } from '@/lib/jobAttributes';
import { JobCard } from '@/components/JobCard';
import { Chip, EmptyState, Skeleton } from '@/components/ui';
import { toast } from '@/components/Toast';
import { colors } from '@/theme/colors';

const FEED_KEY = ['driver-feed'];
const bySchedule = (a: Job, b: Job) =>
  new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();

export default function FeedScreen() {
  const qc = useQueryClient();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [capacity, setCapacity] = useState('all');
  const [sort, setSort] = useState<'date' | 'price'>('date');

  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: FEED_KEY,
    queryFn: () => api.get('/drivers/me/feed').then((r) => r.data),
  });

  const { data: account } = useQuery<PayoutAccountStatus>({
    queryKey: ['payout-account'],
    queryFn: () => api.get('/drivers/me/payout-account').then((r) => r.data),
  });
  const needsPayout = account && !account.payoutsEnabled;

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then((r) => r.data),
  });
  const invitedIds = useMemo(
    () => new Set(notifications.filter((n) => n.type === 'JOB_INVITE' && n.jobId).map((n) => n.jobId as string)),
    [notifications],
  );

  const { data: myOffers = [] } = useQuery<JobOffer[]>({
    queryKey: ['my-offers'],
    queryFn: () => api.get('/jobs/my-offers').then((r) => r.data),
  });
  const offeredIds = useMemo(
    () => new Set(myOffers.filter((o) => o.status === 'PENDING').map((o) => o.jobId)),
    [myOffers],
  );

  useEffect(() => {
    const socket = initSocket();
    const onNew = ({ job }: { job: Job }) =>
      qc.setQueryData<Job[]>(FEED_KEY, (old = []) => [...old, job].sort(bySchedule));
    const onAccepted = ({ jobId }: { jobId: string }) =>
      qc.setQueryData<Job[]>(FEED_KEY, (old = []) => old.filter((j) => j.id !== jobId));
    socket.on('job:new', onNew);
    socket.on('job:accepted', onAccepted);
    return () => {
      socket.off('job:new', onNew);
      socket.off('job:accepted', onAccepted);
    };
  }, [qc]);

  const handleAccept = async (jobId: string) => {
    qc.setQueryData<Job[]>(FEED_KEY, (old = []) => old.filter((j) => j.id !== jobId));
    try {
      await api.post(`/jobs/${jobId}/accept`);
      toast.success('העבודה התקבלה!');
      qc.invalidateQueries({ queryKey: ['driver-jobs'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'לא ניתן לקבל את העבודה');
      qc.invalidateQueries({ queryKey: FEED_KEY });
    }
  };

  const filtered = useMemo(() => {
    let list = jobs;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((j) =>
        [j.title, j.fromLocation, j.toLocation].some((s) => s?.toLowerCase().includes(q)),
      );
    }
    if (capacity !== 'all') {
      const bucket = CAPACITY_BUCKETS.find((b) => b.key === capacity);
      if (bucket) list = list.filter((j) => bucket.test(j.craneCapacityTons));
    }
    return [...list].sort((a, b) => {
      const ai = invitedIds.has(a.id) ? 1 : 0;
      const bi = invitedIds.has(b.id) ? 1 : 0;
      if (ai !== bi) return bi - ai;
      return sort === 'price' ? b.netPriceCents - a.netPriceCents : bySchedule(a, b);
    });
  }, [jobs, search, capacity, sort, invitedIds]);

  if (isLoading) {
    return (
      <View style={styles.screen}>
        {[0, 1, 2].map((i) => <Skeleton key={i} height={210} style={{ marginBottom: 12 }} />)}
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.screen}>
      {needsPayout && (
        <Pressable style={styles.payoutBanner} onPress={() => router.push('/(tabs)/payouts')}>
          <View style={styles.payoutIcon}>
            <Ionicons name="business-outline" size={18} color={colors.warning} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.payoutTitle}>הגדר אמצעי לקבלת תשלום</Text>
            <Text style={styles.payoutSub}>חובה להגדיר חשבון לקבלת כספים כדי לקבל עבודות</Text>
          </View>
          <Ionicons name="arrow-back" size={16} color={colors.warning} />
        </Pressable>
      )}

      <View style={styles.headerRow}>
        <View>
          <Text style={styles.h1}>עבודות זמינות</Text>
          <Text style={styles.sub}>בחר עבודה וקבל אותה בלחיצה אחת</Text>
        </View>
        <View style={styles.countPill}>
          <View style={[styles.dot, { backgroundColor: colors.success }]} />
          <Text style={styles.countText}>{filtered.length} פתוחות</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          style={styles.searchInput}
          placeholder="חיפוש לפי אזור או כותרת"
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Capacity chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {CAPACITY_BUCKETS.map((b) => (
          <Chip key={b.key} label={b.label} active={capacity === b.key} onPress={() => setCapacity(b.key)} />
        ))}
      </ScrollView>

      {/* Sort toggle */}
      <View style={styles.chipRow}>
        <Chip label="הקרוב ביותר" active={sort === 'date'} onPress={() => setSort('date')} />
        <Chip label="תשלום גבוה" active={sort === 'price'} onPress={() => setSort('price')} />
      </View>

      {jobs.length === 0 ? (
        <EmptyState
          icon={<Ionicons name="cube-outline" size={28} color={colors.brandStrong} />}
          title="אין עבודות פתוחות כרגע"
          subtitle="עבודות חדשות יופיעו כאן בזמן אמת"
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Ionicons name="search" size={26} color={colors.brandStrong} />}
          title="אין עבודות שתואמות את הסינון"
        />
      ) : (
        <View style={{ gap: 12, marginTop: 8 }}>
          {filtered.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onAccept={handleAccept}
              invited={invitedIds.has(job.id)}
              offered={offeredIds.has(job.id)}
              onOffered={() => qc.invalidateQueries({ queryKey: ['my-offers'] })}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, paddingBottom: 40, gap: 10 },
  payoutBanner: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 12,
    backgroundColor: colors.warningSoft, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.warning,
  },
  payoutIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  payoutTitle: { fontSize: 14, fontWeight: '700', color: colors.warning, textAlign: 'right', writingDirection: 'rtl' },
  payoutSub: { fontSize: 12, color: colors.mutedForeground, textAlign: 'right', writingDirection: 'rtl', marginTop: 2 },
  headerRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  h1: { fontSize: 20, fontWeight: '800', color: colors.foreground, textAlign: 'right', writingDirection: 'rtl' },
  sub: { fontSize: 13, color: colors.mutedForeground, textAlign: 'right', writingDirection: 'rtl', marginTop: 2 },
  countPill: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, backgroundColor: colors.successSoft, paddingVertical: 5, paddingHorizontal: 12, borderRadius: 999 },
  countText: { fontSize: 13, fontWeight: '700', color: colors.success },
  dot: { width: 8, height: 8, borderRadius: 999 },
  searchWrap: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 8,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, paddingHorizontal: 12, height: 42,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.foreground, textAlign: 'right', writingDirection: 'rtl' },
  chipRow: { flexDirection: 'row-reverse', gap: 8, paddingVertical: 2 },
});
