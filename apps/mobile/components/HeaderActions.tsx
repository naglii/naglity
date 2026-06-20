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
        style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
        onPress={() => router.push('/(tabs)/notifications')}
        hitSlop={6}
      >
        <Ionicons name="notifications-outline" size={23} color={colors.foreground} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
          </View>
        )}
      </Pressable>
      <Pressable style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]} onPress={signOut} hitSlop={6}>
        <Ionicons name="log-out-outline" size={23} color={colors.mutedForeground} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8 },
  btn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  btnPressed: { backgroundColor: colors.muted },
  badge: {
    position: 'absolute', top: 6, start: 6, minWidth: 18, height: 18, borderRadius: 999,
    backgroundColor: colors.destructive, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
    borderWidth: 2, borderColor: colors.card,
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '800' },
});
