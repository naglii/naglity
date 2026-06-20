// Mirrors apps/web/components/jobs/ReceiptDialog.tsx as a bottom sheet.
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { StyleSheet, Text, View } from 'react-native';
import api from '@/lib/api';
import type { Receipt } from '@/types/api';
import { formatPrice } from '@/lib/utils';
import { colors } from '@/theme/colors';
import { BottomSheet, Skeleton } from './ui';

function StatusLine({ ok, label, date }: { ok: boolean; label: string; date: string | null }) {
  if (!ok) return null;
  return (
    <View style={styles.statusLine}>
      <Text style={styles.statusLabel}>{label}</Text>
      <Text style={styles.statusDate}>{date ? format(new Date(date), 'dd/MM/yyyy HH:mm') : '—'}</Text>
    </View>
  );
}

export function ReceiptSheet({ jobId, onClose }: { jobId: string | null; onClose: () => void }) {
  const { data, isLoading } = useQuery<Receipt>({
    queryKey: ['receipt', jobId],
    queryFn: () => api.get(`/jobs/${jobId}/receipt`).then((r) => r.data),
    enabled: !!jobId,
  });

  return (
    <BottomSheet visible={!!jobId} onClose={onClose}>
      {isLoading || !data ? (
        <Skeleton height={260} />
      ) : (
        <View>
          {/* header */}
          <View style={styles.head}>
            <View>
              <Text style={styles.brand}>Naglity<Text style={{ color: colors.brandStrong }}>.</Text></Text>
              <Text style={styles.sub}>קבלה / אישור תשלום</Text>
            </View>
            <View style={{ alignItems: 'flex-start' }}>
              <Text style={styles.invoice}>{data.invoiceNumber}</Text>
              <Text style={styles.sub}>{format(new Date(data.issuedAt), 'dd/MM/yyyy')}</Text>
            </View>
          </View>

          {/* parties */}
          <View style={styles.section}>
            <Row label="עסק" value={data.businessName ?? '—'} />
            {!!data.driverName && <Row label="נהג" value={data.driverName} />}
            <Row label="עבודה" value={data.job.title} />
            <Row label="מסלול" value={`${data.job.fromLocation} ← ${data.job.toLocation}`} />
            <Row label="מועד" value={format(new Date(data.job.scheduledAt), 'dd/MM/yyyy HH:mm')} />
          </View>

          {/* amounts */}
          <View style={styles.amounts}>
            <View style={styles.amountRow}>
              <Text style={styles.amountText}>מחיר העבודה</Text>
              <Text style={styles.amountStrong}>{formatPrice(data.grossCents)}</Text>
            </View>
            <View style={[styles.amountRow, styles.amountDivider]}>
              <Text style={[styles.amountText, { color: colors.mutedForeground }]}>עמלת פלטפורמה (10%)</Text>
              <Text style={{ color: colors.mutedForeground }}>−{formatPrice(data.platformFeeCents)}</Text>
            </View>
            <View style={[styles.amountRow, { backgroundColor: colors.successSoft }]}>
              <Text style={styles.netLabel}>תשלום לנהג (נטו)</Text>
              <Text style={styles.netValue}>{formatPrice(data.netCents)}</Text>
            </View>
          </View>

          {/* timeline */}
          <View style={styles.timeline}>
            <StatusLine ok={data.charged} label="חויב מהעסק (בנאמנות)" date={data.chargedAt} />
            <StatusLine ok={data.released} label="שולם לנהג" date={data.releasedAt} />
            <StatusLine ok={data.refunded} label="הוחזר לעסק" date={data.refundedAt} />
            {!data.charged && !data.refunded && <Text style={styles.statusLabel}>טרם בוצע חיוב</Text>}
          </View>

          <Text style={styles.disclaimer}>מסמך הדגמה — אינו מהווה מסמך מס.</Text>
        </View>
      )}
    </BottomSheet>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  brand: { fontSize: 18, fontWeight: '900', color: colors.foreground },
  sub: { fontSize: 11, color: colors.mutedForeground, textAlign: 'right' },
  invoice: { fontSize: 12, fontWeight: '700', color: colors.foreground },
  section: { gap: 4, marginBottom: 16 },
  row: { flexDirection: 'row-reverse', justifyContent: 'space-between', gap: 12 },
  rowLabel: { fontSize: 13, color: colors.mutedForeground, writingDirection: 'rtl' },
  rowValue: { fontSize: 13, fontWeight: '600', color: colors.foreground, writingDirection: 'rtl', flexShrink: 1, textAlign: 'left' },
  amounts: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, overflow: 'hidden', marginBottom: 14 },
  amountRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 14 },
  amountDivider: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border },
  amountText: { fontSize: 14, color: colors.foreground, writingDirection: 'rtl' },
  amountStrong: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  netLabel: { fontSize: 14, fontWeight: '700', color: colors.foreground, writingDirection: 'rtl' },
  netValue: { fontSize: 18, fontWeight: '900', color: colors.success },
  timeline: { backgroundColor: colors.muted, borderRadius: 12, padding: 12, gap: 6 },
  statusLine: { flexDirection: 'row-reverse', justifyContent: 'space-between' },
  statusLabel: { fontSize: 12, color: colors.mutedForeground, writingDirection: 'rtl' },
  statusDate: { fontSize: 12, fontWeight: '600', color: colors.foreground },
  disclaimer: { fontSize: 11, color: colors.mutedForeground, textAlign: 'center', marginTop: 14, writingDirection: 'rtl' },
});
