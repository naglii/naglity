import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import api from '@/lib/api';
import type { DriverPayout, Job, PayoutAccountStatus } from '@/types/api';
import { formatPrice } from '@/lib/utils';
import { Button, Card, EmptyState } from '@/components/ui';
import { ReceiptSheet } from '@/components/ReceiptSheet';
import { toast } from '@/components/Toast';
import { colors } from '@/theme/colors';
import { radius, space } from '@/theme/tokens';

export default function PayoutsScreen() {
  const qc = useQueryClient();
  const [receiptJobId, setReceiptJobId] = useState<string | null>(null);

  const { data: account } = useQuery<PayoutAccountStatus>({
    queryKey: ['payout-account'],
    queryFn: () => api.get('/drivers/me/payout-account').then((r) => r.data),
  });

  const setupAccount = useMutation({
    mutationFn: () => api.post('/drivers/me/payout-account').then((r) => r.data),
    onSuccess: () => { toast.success('אמצעי קבלת תשלום הוגדר'); qc.invalidateQueries({ queryKey: ['payout-account'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'שגיאה'),
  });
  const removeAccount = useMutation({
    mutationFn: () => api.delete('/drivers/me/payout-account').then((r) => r.data),
    onSuccess: () => { toast.success('אמצעי קבלת התשלום הוסר'); qc.invalidateQueries({ queryKey: ['payout-account'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'שגיאה'),
  });

  const { data: payouts = [] } = useQuery<DriverPayout[]>({
    queryKey: ['driver-payouts'],
    queryFn: () => api.get('/drivers/me/payouts').then((r) => r.data),
  });

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ['driver-jobs'],
    queryFn: () => api.get('/drivers/me/jobs').then((r) => r.data),
  });

  const totalPaid = useMemo(
    () => payouts.filter((p) => p.status === 'SUCCEEDED').reduce((s, p) => s + p.amountCents, 0),
    [payouts],
  );
  const onTheWay = useMemo(
    () => jobs.filter((j) => j.status === 'ACCEPTED' || j.status === 'IN_PROGRESS').reduce((s, j) => s + j.netPriceCents, 0),
    [jobs],
  );

  const accountActive = account?.payoutsEnabled;
  const isDemo = account?.provider === 'fake';
  const succeeded = payouts.filter((p) => p.status === 'SUCCEEDED').length;

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.screen}>
      <View>
        <Text style={styles.h1}>תשלומים</Text>
        <Text style={styles.sub}>אמצעי קבלת תשלום והתשלומים שקיבלת</Text>
      </View>

      {/* payout account */}
      <Card style={{ padding: 20 }}>
        {accountActive ? (
          <View style={styles.accountActive}>
            <View style={[styles.iconChip, { backgroundColor: colors.successSoft }]}>
              <Ionicons name="business" size={20} color={colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.accountTitle}>אמצעי קבלת תשלום פעיל {isDemo && <Text style={styles.demo}>(חשבון דמו)</Text>}</Text>
              {!!account?.payoutLast4 && (
                <Text style={styles.accountLine}>חשבון •••• {account.payoutLast4}</Text>
              )}
              <Text style={styles.accountSub}>התשלומים יועברו לחשבונך עם השלמת עבודות.</Text>
            </View>
            <Button title="הסר" variant="ghost" size="sm" loading={removeAccount.isPending} onPress={() => removeAccount.mutate()} />
          </View>
        ) : (
          <View style={styles.accountSetup}>
            <View style={[styles.iconChip, styles.iconChipLg, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="business-outline" size={30} color={colors.primary} />
            </View>
            <Text style={styles.accountTitle}>הגדר אמצעי לקבלת תשלום</Text>
            <Text style={[styles.accountSub, { textAlign: 'center' }]}>חובה להגדיר חשבון לקבלת כספים כדי שתוכל לקבל עבודות</Text>
            <Button
              title="הגדר אמצעי קבלת תשלום"
              size="lg"
              loading={setupAccount.isPending}
              onPress={() => setupAccount.mutate()}
              icon={<Ionicons name="business-outline" size={16} color={colors.white} />}
            />
          </View>
        )}
      </Card>

      {/* total */}
      <Card style={[styles.totalCard, { backgroundColor: colors.successSoft }]}>
        <View style={styles.totalHead}>
          <View style={[styles.iconChip, { width: 28, height: 28, backgroundColor: colors.successSoft }]}>
            <Ionicons name="wallet" size={15} color={colors.success} />
          </View>
          <Text style={styles.totalLabel}>סך הכל שולם לך</Text>
        </View>
        <Text style={styles.totalAmount}>{formatPrice(totalPaid)}</Text>
        <View style={styles.totalPills}>
          <View style={[styles.pill, { backgroundColor: colors.successSoft }]}>
            <Ionicons name="checkmark-circle" size={13} color={colors.success} />
            <Text style={[styles.pillText, { color: colors.success }]}>{succeeded} תשלומים</Text>
          </View>
          {onTheWay > 0 && (
            <View style={[styles.pill, { backgroundColor: colors.infoSoft }]}>
              <Ionicons name="time" size={13} color={colors.info} />
              <Text style={[styles.pillText, { color: colors.info }]}>בדרך אליך · {formatPrice(onTheWay)}</Text>
            </View>
          )}
        </View>
      </Card>

      {payouts.length === 0 ? (
        <EmptyState
          icon={<Ionicons name="wallet-outline" size={34} color={colors.primary} />}
          title="אין תשלומים עדיין"
          subtitle="תשלומים יופיעו כאן לאחר שעבודות יושלמו וישולמו"
        />
      ) : (
        <Card style={{ padding: 0 }}>
          {payouts.map((p, i) => (
            <View key={p.id} style={[styles.payoutRow, i > 0 && styles.rowDivider]}>
              <View style={[styles.iconChip, { width: 36, height: 36, backgroundColor: p.status === 'SUCCEEDED' ? colors.successSoft : colors.warningSoft }]}>
                <Ionicons name={p.status === 'SUCCEEDED' ? 'checkmark-circle' : 'time'} size={17} color={p.status === 'SUCCEEDED' ? colors.success : colors.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.payoutTitle} numberOfLines={1}>{p.jobTitle}</Text>
                <Text style={styles.payoutMeta} numberOfLines={1}>
                  {p.fromLocation} ← {p.toLocation} · {format(new Date(p.scheduledAt), 'dd/MM/yy')}
                </Text>
              </View>
              <View style={styles.payoutEnd}>
                <Text style={styles.payoutAmount}>{formatPrice(p.amountCents)}</Text>
                <Pressable style={styles.receiptBtn} onPress={() => setReceiptJobId(p.jobId)}>
                  <Ionicons name="receipt-outline" size={14} color={colors.mutedForeground} />
                  <Text style={styles.receiptText}>קבלה</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </Card>
      )}

      <ReceiptSheet jobId={receiptJobId} onClose={() => setReceiptJobId(null)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: space.lg, paddingBottom: 40, gap: space.lg },
  h1: { fontSize: 24, fontWeight: '800', color: colors.foreground, textAlign: 'right', writingDirection: 'rtl' },
  sub: { fontSize: 14, color: colors.mutedForeground, textAlign: 'right', writingDirection: 'rtl', marginTop: 2 },
  iconChip: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  iconChipLg: { width: 64, height: 64, borderRadius: radius.lg },
  accountActive: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  accountSetup: { alignItems: 'center', gap: space.md },
  accountTitle: { fontSize: 16, fontWeight: '800', color: colors.foreground, textAlign: 'right', writingDirection: 'rtl' },
  demo: { fontSize: 12, fontWeight: '400', color: colors.mutedForeground },
  accountLine: { fontSize: 15, color: colors.foreground, marginTop: 4, textAlign: 'right' },
  accountSub: { fontSize: 14, color: colors.mutedForeground, marginTop: 2, textAlign: 'right', writingDirection: 'rtl', lineHeight: 20 },
  totalCard: { padding: 24 },
  totalHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  totalLabel: { fontSize: 14, fontWeight: '600', color: colors.money, writingDirection: 'rtl' },
  totalAmount: { fontSize: 40, fontWeight: '900', color: colors.money, marginTop: 8, textAlign: 'right' },
  totalPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 13, borderRadius: 999 },
  pillText: { fontSize: 13, fontWeight: '700', writingDirection: 'rtl' },
  payoutRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  payoutTitle: { fontSize: 15, fontWeight: '800', color: colors.foreground, textAlign: 'right', writingDirection: 'rtl' },
  payoutMeta: { fontSize: 13, color: colors.mutedForeground, marginTop: 2, textAlign: 'right', writingDirection: 'rtl' },
  payoutEnd: { alignItems: 'center', gap: 5 },
  payoutAmount: { fontSize: 15, fontWeight: '800', color: colors.money },
  receiptBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  receiptText: { fontSize: 13, color: colors.primary, fontWeight: '600', writingDirection: 'rtl' },
});
