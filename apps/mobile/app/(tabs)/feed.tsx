import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '@/lib/api';
import { initSocket } from '@/lib/socket';
import { playNewJobChime } from '@/lib/sound';
import type { Job, JobOffer, Notification, PayoutAccountStatus } from '@/types/api';
import { JobCard } from '@/components/JobCard';
import { Button, Chip, EmptyState, ScreenHeader, Skeleton } from '@/components/ui';
import { toast } from '@/components/Toast';
import { colors } from '@/theme/colors';
import { radius, space } from '@/theme/tokens';

const FEED_KEY = ['driver-feed'];
const bySchedule = (a: Job, b: Job) =>
  new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();

export default function FeedScreen() {
  const qc = useQueryClient();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'date' | 'price'>('date');
  // Ids of jobs that just arrived — drives the per-card pulse/flash animation.
  const [justArrivedIds, setJustArrivedIds] = useState<Set<string>>(() => new Set());

  // Fire the audio + visual cue for a freshly-arrived job, then clear the flag
  // so later re-renders don't re-animate the card.
  const markArrived = useCallback((id: string) => {
    setJustArrivedIds((prev) => new Set(prev).add(id));
    playNewJobChime();
    setTimeout(() => {
      setJustArrivedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 4000);
  }, []);

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
    const onNew = ({ job }: { job: Job }) => {
      qc.setQueryData<Job[]>(FEED_KEY, (old = []) =>
        old.some((j) => j.id === job.id) ? old : [...old, job].sort(bySchedule),
      );
      markArrived(job.id);
    };
    const onAccepted = ({ jobId }: { jobId: string }) =>
      qc.setQueryData<Job[]>(FEED_KEY, (old = []) => old.filter((j) => j.id !== jobId));
    socket.on('job:new', onNew);
    socket.on('job:accepted', onAccepted);
    return () => {
      socket.off('job:new', onNew);
      socket.off('job:accepted', onAccepted);
    };
  }, [qc, markArrived]);

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

  // DEV-only: synthesize an incoming job through the same path as the socket
  // 'job:new' event, so the chime + card animation can be tested with no backend.
  const triggerMockJob = useCallback(() => {
    const now = new Date();
    const mock: Job = {
      id: `mock-${Date.now()}`,
      businessId: 'mock-biz',
      driverId: null,
      status: 'OPEN',
      title: 'הרמת חומרי בניין',
      description: 'משטח לבנים ושקי מלט לקומה 3',
      grossPriceCents: 45000,
      netPriceCents: 38000,
      scheduledAt: new Date(now.getTime() + 2 * 3600_000).toISOString(),
      estimatedEndAt: new Date(now.getTime() + 3 * 3600_000).toISOString(),
      fromLocation: 'תל אביב',
      toLocation: 'רמת גן',
      craneCapacityTons: 15,
      liftHeightMeters: 24,
      pricingMode: 'LOCATION',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      business: { id: 'mock-biz', name: 'קבלן בדיקה' },
      driver: null,
    };
    qc.setQueryData<Job[]>(FEED_KEY, (old = []) => [...old, mock].sort(bySchedule));
    markArrived(mock.id);
  }, [qc, markArrived]);

  const filtered = useMemo(() => {
    let list = jobs;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((j) =>
        [j.title, j.fromLocation, j.toLocation].some((s) => s?.toLowerCase().includes(q)),
      );
    }
    return [...list].sort((a, b) => {
      const ai = invitedIds.has(a.id) ? 1 : 0;
      const bi = invitedIds.has(b.id) ? 1 : 0;
      if (ai !== bi) return bi - ai;
      return sort === 'price' ? b.netPriceCents - a.netPriceCents : bySchedule(a, b);
    });
  }, [jobs, search, sort, invitedIds]);

  if (isLoading) {
    return (
      <View style={styles.screen}>
        {[0, 1, 2].map((i) => <Skeleton key={i} height={260} style={{ marginBottom: space.md }} />)}
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.screen, { paddingBottom: insets.bottom + 96 }]}
    >
      {needsPayout && (
        <Pressable style={styles.payoutBanner} onPress={() => router.push('/(tabs)/payouts')}>
          <View style={styles.payoutIcon}>
            <Ionicons name="business" size={20} color={colors.pending} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.payoutTitle}>הגדר אמצעי לקבלת תשלום</Text>
            <Text style={styles.payoutSub}>חובה כדי שתוכל לקבל עבודות</Text>
          </View>
          <Ionicons name="arrow-back" size={18} color={colors.pending} />
        </Pressable>
      )}

      <ScreenHeader
        title="עבודות זמינות"
        accessory={
          <View style={styles.countPill}>
            <View style={styles.countDot} />
            <Text style={styles.countText}>{filtered.length}</Text>
          </View>
        }
      />

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.mutedForeground} />
        <TextInput
          style={styles.searchInput}
          placeholder="חיפוש לפי אזור או כותרת"
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Sort toggle */}
      <View style={styles.chipRow}>
        <Chip label="הקרוב ביותר" active={sort === 'date'} onPress={() => setSort('date')} />
        <Chip label="תשלום גבוה" active={sort === 'price'} onPress={() => setSort('price')} />
      </View>

      {/* DEV-only: trigger a mock incoming job to test the chime + card animation. */}
      {__DEV__ && (
        <Button
          title="עבודה חדשה (בדיקה)"
          variant="outline"
          onPress={triggerMockJob}
          icon={<Ionicons name="notifications" size={18} color={colors.foreground} />}
        />
      )}

      {jobs.length === 0 ? (
        <EmptyState
          icon={<Ionicons name="cube-outline" size={34} color={colors.primary} />}
          title="אין עבודות פתוחות כרגע"
          subtitle="עבודות חדשות יופיעו כאן בזמן אמת"
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Ionicons name="search" size={30} color={colors.primary} />}
          title="אין עבודות שתואמות את החיפוש"
          subtitle="נסה חיפוש אחר"
        />
      ) : (
        <View style={{ gap: space.md, marginTop: space.xs }}>
          {filtered.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onAccept={handleAccept}
              invited={invitedIds.has(job.id)}
              offered={offeredIds.has(job.id)}
              highlight={justArrivedIds.has(job.id)}
              onOffered={() => qc.invalidateQueries({ queryKey: ['my-offers'] })}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: space.lg, paddingBottom: 40, gap: space.md },
  payoutBanner: {
    flexDirection: 'row', alignItems: 'center', gap: space.md,
    backgroundColor: colors.pendingSoft, borderRadius: radius.xl, padding: space.lg,
  },
  payoutIcon: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  payoutTitle: { fontSize: 15, fontWeight: '800', color: colors.pending, textAlign: 'right', writingDirection: 'rtl' },
  payoutSub: { fontSize: 13, color: colors.mutedForeground, textAlign: 'right', writingDirection: 'rtl', marginTop: 2 },
  countPill: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.moneySoft, paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.pill },
  countDot: { width: 8, height: 8, borderRadius: 999, backgroundColor: colors.money },
  countText: { fontSize: 15, fontWeight: '800', color: colors.money },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    backgroundColor: colors.card, borderRadius: radius.lg, paddingHorizontal: space.lg, height: 52,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.foreground, textAlign: 'right', writingDirection: 'rtl' },
  chipRow: { flexDirection: 'row', gap: space.sm, paddingVertical: 2 },
});
