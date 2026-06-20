// Header right-side actions for the tab screens: notification bell (with unread dot) + logout.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { colors } from '@/theme/colors';

export function HeaderActions() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { unreadCount } = useNotifications();

  return (
    <View style={styles.row}>
      <Pressable
        style={styles.btn}
        onPress={() => router.push('/(tabs)/notifications')}
        hitSlop={8}
      >
        <Ionicons name="notifications-outline" size={22} color={colors.foreground} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
          </View>
        )}
      </Pressable>
      <Pressable style={styles.btn} onPress={signOut} hitSlop={8}>
        <Ionicons name="log-out-outline" size={22} color={colors.mutedForeground} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingHorizontal: 12 },
  btn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute', top: 2, left: 2, minWidth: 16, height: 16, borderRadius: 999,
    backgroundColor: colors.destructive, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '800' },
});
