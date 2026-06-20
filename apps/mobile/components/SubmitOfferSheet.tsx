// Mirrors apps/web/components/jobs/SubmitOfferDialog.tsx as a bottom sheet.
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import api from '@/lib/api';
import type { Job } from '@/types/api';
import { formatPrice } from '@/lib/utils';
import { colors } from '@/theme/colors';
import { BottomSheet, Button } from './ui';
import { toast } from './Toast';

export function SubmitOfferSheet({
  job,
  visible,
  onClose,
  onSubmitted,
}: {
  job: Job;
  visible: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [amount, setAmount] = useState(
    job.grossPriceCents > 0 ? String(Math.round(job.grossPriceCents / 100)) : '',
  );
  const [eta, setEta] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const amountNum = Number(amount) || 0;

  const submit = async () => {
    if (amountNum < 1) {
      toast.error('מינימום ₪1');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/jobs/${job.id}/offers`, {
        amountCents: Math.round(amountNum * 100),
        etaMinutes: eta ? Number(eta) : undefined,
        note: note || undefined,
      });
      toast.success('ההצעה נשלחה!');
      onSubmitted();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'שגיאה בשליחת ההצעה');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>שליחת הצעת מחיר</Text>
      <Text style={styles.subtitle}>{job.title}</Text>

      <View style={styles.field}>
        <Text style={styles.label}>המחיר שלך (₪)</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={amount}
          onChangeText={setAmount}
          placeholder="0"
          placeholderTextColor={colors.mutedForeground}
        />
        <Text style={styles.hint}>
          אתה תקבל ~{formatPrice(Math.round(amountNum * 100 * 0.9))} (לאחר עמלה)
        </Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>זמן הגעה משוער (דקות) (אופציונלי)</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={eta}
          onChangeText={setEta}
          placeholder="30"
          placeholderTextColor={colors.mutedForeground}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>הערה לעסק (אופציונלי)</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={3}
          placeholder="זמינות, ניסיון, פרטים נוספים…"
          placeholderTextColor={colors.mutedForeground}
        />
      </View>

      <Button title="שלח הצעה" onPress={submit} loading={submitting} size="lg" />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '800', color: colors.foreground, textAlign: 'right', writingDirection: 'rtl' },
  subtitle: { fontSize: 13, color: colors.mutedForeground, textAlign: 'right', writingDirection: 'rtl', marginTop: 2, marginBottom: 8 },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: colors.foreground, textAlign: 'right', writingDirection: 'rtl', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: colors.foreground,
    textAlign: 'right',
    writingDirection: 'rtl',
    backgroundColor: colors.card,
  },
  textarea: { minHeight: 70, textAlignVertical: 'top' },
  hint: { fontSize: 12, color: colors.mutedForeground, textAlign: 'right', writingDirection: 'rtl', marginTop: 6 },
});
