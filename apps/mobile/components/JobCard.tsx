// Mirrors apps/web/components/jobs/JobCard.tsx — adapted to RN. Visual revamp only;
// all logic (accept/offer flow, props, state) is unchanged.
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { differenceInMinutes, format, formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import type { Job } from '@/types/api';
import { durationMins, formatHoursLabel, formatPrice } from '@/lib/utils';
import { loadTypeLabel } from '@/lib/jobAttributes';
import { colors } from '@/theme/colors';
import { radius, space } from '@/theme/tokens';
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
  // UI-only: progressive disclosure of secondary details (Wolt-style clean default).
  const [expanded, setExpanded] = useState(false);
  const scheduled = new Date(job.scheduledAt);
  const isNew = differenceInMinutes(new Date(), new Date(job.createdAt)) < 3;
  const bizName = job.business?.name ?? '—';
  const bizInitial = bizName.trim().charAt(0) || '?';
  const isOffersMode = job.pricingMode === 'OFFERS';
  const noPrice = isOffersMode && job.grossPriceCents === 0;
  const hasStatus = invited || isOffersMode;
  const hasDetails =
    job.craneCapacityTons != null ||
    job.liftHeightMeters != null ||
    !!job.loadType ||
    !!job.description ||
    !!job.accessNotes;

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
    <Card style={invited ? styles.invited : undefined}>
      <View style={styles.body}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{bizInitial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>{job.title}</Text>
            <Text style={styles.biz} numberOfLines={1}>
              {bizName} · {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true, locale: he })}
            </Text>
          </View>
          {isNew && (
            <View style={styles.newBadge}>
              <View style={styles.newDot} />
              <Text style={styles.newText}>חדש</Text>
            </View>
          )}
        </View>

        {/* Key figures: when + payout */}
        <View style={styles.figures}>
          <View style={styles.figureBlock}>
            <View style={styles.figureHead}>
              <Ionicons name="calendar-outline" size={14} color={colors.mutedForeground} />
              <Text style={styles.figureLabel} numberOfLines={1}>{format(scheduled, 'EEEE, d בMMM', { locale: he })}</Text>
            </View>
            <Text style={styles.figureTime}>{format(scheduled, 'HH:mm')}</Text>
            <Text style={styles.figureFoot}>נסיעה ≈ {formatHoursLabel(durationMins(job.scheduledAt, job.estimatedEndAt))}</Text>
          </View>

          <View style={styles.figureSep} />

          <View style={[styles.figureBlock, { alignItems: 'flex-start' }]}>
            <View style={styles.figureHead}>
              <MaterialCommunityIcons name="cash" size={15} color={colors.money} />
              <Text style={[styles.figureLabel, { color: colors.money }]}>תשלום נטו</Text>
            </View>
            <Text style={styles.figurePrice}>{noPrice ? 'לפי הצעה' : formatPrice(job.netPriceCents)}</Text>
            <Text style={styles.figureFoot}>{noPrice ? 'הגש את הצעתך' : 'ישירות אליך'}</Text>
          </View>
        </View>

        {/* Route */}
        <View style={styles.route}>
          <View style={styles.routeNode}>
            <View style={[styles.routeDot, { backgroundColor: colors.money }]} />
            <Text style={styles.routeText} numberOfLines={1}>{job.fromLocation}</Text>
          </View>
          <Ionicons name="arrow-back" size={16} color={colors.mutedForeground} />
          <View style={styles.routeNode}>
            <View style={[styles.routeDot, { backgroundColor: colors.primary }]} />
            <Text style={styles.routeText} numberOfLines={1}>{job.toLocation}</Text>
          </View>
        </View>

        {/* Status badges that gate the action stay visible */}
        {hasStatus && (
          <View style={styles.tags}>
            {invited && <Tag bg={colors.pendingSoft} fg={colors.pending} icon="sparkles-outline" text="הוזמנת לעבודה" />}
            {isOffersMode && <Tag bg={colors.infoSoft} fg={colors.info} icon="cash-outline" text="פתוח להצעות" />}
          </View>
        )}

        {/* Secondary details behind a subtle toggle (Wolt-style) */}
        {hasDetails && (
          <Pressable
            style={({ pressed }) => [styles.detailsToggle, pressed && { opacity: 0.7 }]}
            onPress={() => setExpanded((v) => !v)}
            hitSlop={6}
          >
            <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.primary} />
            <Text style={styles.detailsToggleText}>{expanded ? 'הסתר פרטים' : 'הצג פרטים'}</Text>
          </Pressable>
        )}

        {expanded && hasDetails && (
          <View style={styles.detailBlock}>
            <View style={styles.tags}>
              {job.craneCapacityTons != null && <Tag bg={colors.primarySoft} fg={colors.primary} icon="barbell-outline" text={`${job.craneCapacityTons} טון`} />}
              {job.liftHeightMeters != null && <Tag bg={colors.muted} fg={colors.slate700} icon="resize-outline" text={`גובה ${job.liftHeightMeters} מ׳`} />}
              {job.loadType && <Tag bg={colors.muted} fg={colors.slate700} icon="cube-outline" text={loadTypeLabel(job.loadType) ?? ''} />}
            </View>
            {!!job.description && <Text style={styles.desc}>{job.description}</Text>}
            {!!job.accessNotes && (
              <Text style={styles.access}><Text style={styles.accessLabel}>גישה: </Text>{job.accessNotes}</Text>
            )}
          </View>
        )}

        {/* Inset CTA */}
        {isOffersMode ? (
          <Button
            title={offered ? 'עדכן הצעה' : 'שלח הצעה'}
            variant={offered ? 'outline' : 'secondary'}
            size="lg"
            onPress={() => setOfferOpen(true)}
            style={styles.cta}
            icon={<Ionicons name="cash-outline" size={18} color={offered ? colors.foreground : colors.brandStrong} />}
          />
        ) : (
          <Button
            title="קבל עבודה"
            size="lg"
            onPress={confirmAccept}
            style={styles.cta}
            icon={<Ionicons name="checkmark-circle" size={18} color={colors.white} />}
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
      <Ionicons name={icon} size={14} color={fg} />
      <Text style={[styles.tagText, { color: fg }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  invited: { borderWidth: 2, borderColor: colors.pending },
  body: { padding: space.lg, gap: space.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  avatar: {
    width: 48, height: 48, borderRadius: radius.lg, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontWeight: '800', fontSize: 18 },
  title: { fontSize: 17, fontWeight: '800', color: colors.foreground, textAlign: 'right', writingDirection: 'rtl' },
  biz: { fontSize: 13, color: colors.mutedForeground, textAlign: 'right', writingDirection: 'rtl', marginTop: 2 },
  newBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.moneySoft, paddingVertical: 4, paddingHorizontal: 9, borderRadius: radius.pill,
  },
  newDot: { width: 7, height: 7, borderRadius: 999, backgroundColor: colors.money },
  newText: { fontSize: 11, fontWeight: '800', color: colors.money },
  figures: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.background, borderRadius: radius.lg, padding: space.md,
  },
  figureBlock: { flex: 1, gap: 4 },
  figureSep: { width: 1, alignSelf: 'stretch', backgroundColor: colors.border, marginHorizontal: space.md },
  figureHead: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  figureLabel: { fontSize: 12, fontWeight: '600', color: colors.mutedForeground, writingDirection: 'rtl' },
  figureTime: { fontSize: 26, fontWeight: '900', color: colors.foreground, textAlign: 'right' },
  figurePrice: { fontSize: 26, fontWeight: '900', color: colors.money, textAlign: 'right' },
  figureFoot: { fontSize: 12, color: colors.mutedForeground, textAlign: 'right', writingDirection: 'rtl' },
  route: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  routeNode: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  routeDot: { width: 9, height: 9, borderRadius: 999 },
  routeText: { fontSize: 15, fontWeight: '600', color: colors.foreground, writingDirection: 'rtl', flexShrink: 1 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 10, borderRadius: radius.md },
  tagText: { fontSize: 13, fontWeight: '700', writingDirection: 'rtl' },
  desc: { fontSize: 14, color: colors.mutedForeground, textAlign: 'right', writingDirection: 'rtl', lineHeight: 20 },
  access: { fontSize: 13, color: colors.mutedForeground, textAlign: 'right', writingDirection: 'rtl' },
  accessLabel: { fontWeight: '700', color: colors.slate700 },
  detailsToggle: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingVertical: 4 },
  detailsToggleText: { fontSize: 14, fontWeight: '700', color: colors.primary, writingDirection: 'rtl' },
  detailBlock: { gap: space.md },
  cta: { marginTop: space.xs },
});
