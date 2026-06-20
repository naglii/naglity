// Mirrors apps/web/components/jobs/JobCard.tsx — adapted to RN.
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { differenceInMinutes, format, formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import type { Job } from '@/types/api';
import { durationMins, formatHoursLabel, formatPrice } from '@/lib/utils';
import { loadTypeLabel } from '@/lib/jobAttributes';
import { colors } from '@/theme/colors';
import { Button, Card } from './ui';
import { SubmitOfferSheet } from './SubmitOfferSheet';

interface Props {
  job: Job;
  onAccept: (jobId: string) => void;
  invited?: boolean;
  offered?: boolean;
  onOffered: () => void;
}

export function JobCard({ job, onAccept, invited, offered, onOffered }: Props) {
  const [offerOpen, setOfferOpen] = useState(false);
  const scheduled = new Date(job.scheduledAt);
  const isNew = differenceInMinutes(new Date(), new Date(job.createdAt)) < 3;
  const bizName = job.business?.name ?? '—';
  const bizInitial = bizName.trim().charAt(0) || '?';
  const isOffersMode = job.pricingMode === 'OFFERS';
  const noPrice = isOffersMode && job.grossPriceCents === 0;

  const confirmAccept = () => {
    Alert.alert(
      'לקבל את העבודה?',
      `${job.title}\n${job.fromLocation} ← ${job.toLocation}\n${format(scheduled, 'dd/MM/yyyy HH:mm')} · ${formatPrice(job.netPriceCents)} נטו`,
      [
        { text: 'ביטול', style: 'cancel' },
        { text: 'אישור וקבלה', onPress: () => onAccept(job.id) },
      ],
    );
  };

  return (
    <Card style={[styles.card, invited && styles.invitedRing]}>
      {/* Header */}
      <View style={styles.header}>
        {isNew && (
          <View style={styles.newBadge}>
            <View style={[styles.dot, { backgroundColor: colors.success }]} />
            <Text style={[styles.newText]}>חדש</Text>
          </View>
        )}
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{bizInitial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>{job.title}</Text>
            <Text style={styles.bizLine} numberOfLines={1}>
              {bizName} · {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true, locale: he })}
            </Text>
          </View>
        </View>
      </View>

      {/* Feature tiles */}
      <View style={styles.tiles}>
        <View style={[styles.tile, { backgroundColor: colors.accent }]}>
          <View style={styles.tileHead}>
            <Ionicons name="calendar-outline" size={13} color={colors.brandStrong} />
            <Text style={styles.tileLabel} numberOfLines={1}>{format(scheduled, 'EEEE, d בMMM', { locale: he })}</Text>
          </View>
          <Text style={styles.tileBig}>{format(scheduled, 'HH:mm')}</Text>
          <Text style={styles.tileFoot}>נסיעה ≈ {formatHoursLabel(durationMins(job.scheduledAt, job.estimatedEndAt))}</Text>
        </View>

        <View style={[styles.tile, { backgroundColor: colors.successSoft }]}>
          <View style={styles.tileHead}>
            <MaterialCommunityIcons name="cash" size={14} color={colors.success} />
            <Text style={[styles.tileLabel, { color: colors.success }]}>תשלום נטו</Text>
          </View>
          <Text style={styles.tileBig}>{noPrice ? 'לפי הצעה' : formatPrice(job.netPriceCents)}</Text>
          <Text style={styles.tileFoot}>{noPrice ? 'הגש את הצעתך' : 'ישירות אליך'}</Text>
        </View>
      </View>

      {/* Route */}
      <View style={styles.body}>
        <View style={styles.route}>
          <View style={styles.routeNode}>
            <View style={[styles.dot, { backgroundColor: colors.success }]} />
            <Text style={styles.routeText}>{job.fromLocation}</Text>
          </View>
          <Ionicons name="arrow-back" size={15} color={colors.mutedForeground} />
          <View style={styles.routeNode}>
            <View style={[styles.dot, { backgroundColor: colors.brandStrong }]} />
            <Text style={styles.routeText}>{job.toLocation}</Text>
          </View>
        </View>

        {/* Attribute badges */}
        <View style={styles.tags}>
          {invited && (
            <Tag bg={colors.warningSoft} fg={colors.warning} icon="sparkles-outline" text="הוזמנת לעבודה" />
          )}
          {isOffersMode && (
            <Tag bg={colors.infoSoft} fg={colors.info} icon="cash-outline" text="פתוח להצעות" />
          )}
          {job.craneCapacityTons != null && (
            <Tag bg={colors.brandSoft} fg={colors.brandStrong} icon="barbell-outline" text={`${job.craneCapacityTons} טון`} />
          )}
          {job.liftHeightMeters != null && (
            <Tag bg={colors.muted} fg={colors.mutedForeground} icon="resize-outline" text={`גובה ${job.liftHeightMeters} מ׳`} />
          )}
          {job.loadType && (
            <Tag bg={colors.muted} fg={colors.mutedForeground} icon="cube-outline" text={loadTypeLabel(job.loadType) ?? ''} />
          )}
        </View>

        {!!job.description && <Text style={styles.desc} numberOfLines={2}>{job.description}</Text>}
        {!!job.accessNotes && (
          <Text style={styles.access}><Text style={styles.accessLabel}>גישה: </Text>{job.accessNotes}</Text>
        )}
      </View>

      {/* CTA */}
      <View style={styles.cta}>
        {isOffersMode ? (
          <Button
            title={offered ? 'עדכן הצעה' : 'שלח הצעה'}
            variant={offered ? 'outline' : 'default'}
            size="lg"
            onPress={() => setOfferOpen(true)}
            icon={<Ionicons name="cash-outline" size={17} color={offered ? colors.foreground : colors.white} />}
          />
        ) : (
          <Button
            title="קבל עבודה"
            size="lg"
            onPress={confirmAccept}
            icon={<Ionicons name="arrow-back" size={16} color={colors.white} />}
          />
        )}
      </View>

      <SubmitOfferSheet
        job={job}
        visible={offerOpen}
        onClose={() => setOfferOpen(false)}
        onSubmitted={onOffered}
      />
    </Card>
  );
}

function Tag({ bg, fg, icon, text }: { bg: string; fg: string; icon: any; text: string }) {
  return (
    <View style={[styles.tag, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={13} color={fg} />
      <Text style={[styles.tagText, { color: fg }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 0 },
  invitedRing: { borderColor: colors.warning, borderWidth: 2 },
  header: { backgroundColor: colors.brandSoft, padding: 16, paddingBottom: 12 },
  newBadge: {
    position: 'absolute', top: 14, left: 14, flexDirection: 'row-reverse', alignItems: 'center',
    gap: 4, backgroundColor: colors.successSoft, paddingVertical: 2, paddingHorizontal: 8, borderRadius: 999,
  },
  newText: { fontSize: 10, fontWeight: '800', color: colors.success },
  headerRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: colors.brand,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  title: { fontSize: 15, fontWeight: '800', color: colors.foreground, textAlign: 'right', writingDirection: 'rtl' },
  bizLine: { fontSize: 12, color: colors.mutedForeground, textAlign: 'right', writingDirection: 'rtl', marginTop: 2 },
  tiles: { flexDirection: 'row-reverse', gap: 12, paddingHorizontal: 16, marginTop: 12 },
  tile: { flex: 1, borderRadius: 12, padding: 12 },
  tileHead: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5 },
  tileLabel: { fontSize: 11, fontWeight: '600', color: colors.mutedForeground, writingDirection: 'rtl' },
  tileBig: { fontSize: 24, fontWeight: '900', color: colors.foreground, marginTop: 6, textAlign: 'right' },
  tileFoot: { fontSize: 12, color: colors.mutedForeground, marginTop: 6, textAlign: 'right', writingDirection: 'rtl' },
  body: { paddingHorizontal: 16, paddingTop: 12 },
  route: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  routeNode: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  routeText: { fontSize: 14, fontWeight: '600', color: colors.foreground, writingDirection: 'rtl' },
  dot: { width: 8, height: 8, borderRadius: 999 },
  tags: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  tag: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8 },
  tagText: { fontSize: 12, fontWeight: '700', writingDirection: 'rtl' },
  desc: { fontSize: 14, color: colors.mutedForeground, marginTop: 8, textAlign: 'right', writingDirection: 'rtl' },
  access: { fontSize: 12, color: colors.mutedForeground, marginTop: 6, textAlign: 'right', writingDirection: 'rtl' },
  accessLabel: { fontWeight: '700', color: colors.foreground },
  cta: { padding: 16, paddingTop: 14 },
});
