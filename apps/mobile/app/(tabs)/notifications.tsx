import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { useNotifications } from '@/hooks/useNotifications';
import { EmptyState, Skeleton } from '@/components/ui';
import { colors } from '@/theme/colors';
import { radius, shadow, space } from '@/theme/tokens';
import type { Notification } from '@/types/api';

/** Where tapping a notification should take the driver (driver-relevant types only). */
function targetFor(n: Notification): '/(tabs)/feed' | '/(tabs)/schedule' | null {
  switch (n.type) {
    case 'OFFER_ACCEPTED':
      return '/(tabs)/schedule';
    case 'JOB_INVITE':
      return '/(tabs)/feed';
    default:
      return null;
  }
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, unreadCount, markAllRead, isLoading } = useNotifications();

  // Mark everything read when leaving the screen (mirrors the web "close marks read").
  useEffect(() => () => markAllRead(), [markAllRead]);

  if (isLoading) {
    return (
      <View style={styles.screen}>
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} height={70} style={{ marginBottom: 10 }} />)}
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <EmptyState
          icon={<Ionicons name="notifications-outline" size={32} color={colors.primary} />}
          title="אין התראות"
          subtitle="עדכונים על עבודות והצעות יופיעו כאן"
        />
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.screen}>
      {unreadCount > 0 && (
        <Pressable style={styles.markRow} onPress={markAllRead}>
          <Text style={styles.markText}>סמן הכל כנקרא</Text>
        </Pressable>
      )}
      <View style={styles.list}>
        {notifications.map((n) => {
          const target = targetFor(n);
          const Comp: any = target ? Pressable : View;
          return (
            <Comp
              key={n.id}
              style={[styles.item, !n.read && styles.itemUnread]}
              onPress={target ? () => { markAllRead(); router.push(target); } : undefined}
            >
              <View style={[styles.unreadDot, { backgroundColor: !n.read ? colors.primary : 'transparent' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{n.title}</Text>
                <Text style={styles.itemBody} numberOfLines={2}>{n.body}</Text>
                <Text style={styles.itemTime}>
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: he })}
                </Text>
              </View>
              {target && <Ionicons name="chevron-back" size={16} color={colors.mutedForeground} />}
            </Comp>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: space.lg, paddingBottom: 40 },
  markRow: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 4, marginBottom: 4 },
  markText: { fontSize: 14, color: colors.primary, fontWeight: '700', writingDirection: 'rtl' },
  list: { gap: space.md },
  item: {
    flexDirection: 'row-reverse', alignItems: 'flex-start', gap: space.md,
    backgroundColor: colors.card, borderRadius: radius.xl, padding: space.lg,
    ...shadow.card,
  },
  itemUnread: { backgroundColor: colors.primarySoft },
  unreadDot: { width: 9, height: 9, borderRadius: 999, marginTop: 6 },
  itemTitle: { fontSize: 15, fontWeight: '800', color: colors.foreground, textAlign: 'right', writingDirection: 'rtl' },
  itemBody: { fontSize: 14, color: colors.mutedForeground, marginTop: 3, textAlign: 'right', writingDirection: 'rtl', lineHeight: 20 },
  itemTime: { fontSize: 12, color: colors.mutedForeground, marginTop: 8, textAlign: 'right', writingDirection: 'rtl' },
});
