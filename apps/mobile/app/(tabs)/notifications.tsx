import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { useNotifications } from '@/hooks/useNotifications';
import { EmptyState, Skeleton } from '@/components/ui';
import { colors } from '@/theme/colors';
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
          icon={<Ionicons name="notifications-outline" size={26} color={colors.brandStrong} />}
          title="אין התראות"
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
  screen: { padding: 16, paddingBottom: 40 },
  markRow: { alignItems: 'flex-start', paddingVertical: 8 },
  markText: { fontSize: 13, color: colors.brand, fontWeight: '600', writingDirection: 'rtl' },
  list: { gap: 10 },
  item: {
    flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 10,
    backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14,
  },
  itemUnread: { backgroundColor: '#F0F7FF' },
  unreadDot: { width: 8, height: 8, borderRadius: 999, marginTop: 6 },
  itemTitle: { fontSize: 14, fontWeight: '700', color: colors.foreground, textAlign: 'right', writingDirection: 'rtl' },
  itemBody: { fontSize: 13, color: colors.mutedForeground, marginTop: 2, textAlign: 'right', writingDirection: 'rtl' },
  itemTime: { fontSize: 11, color: colors.mutedForeground, marginTop: 6, textAlign: 'right', writingDirection: 'rtl' },
});
