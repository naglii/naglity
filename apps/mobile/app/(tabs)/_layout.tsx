import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { HeaderActions } from '@/components/HeaderActions';
import { colors } from '@/theme/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { fontWeight: '800', color: colors.foreground },
        headerTitleAlign: 'center',
        headerRight: () => <HeaderActions />,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: 'עבודות זמינות',
          tabBarLabel: 'עבודות',
          tabBarIcon: ({ color, size }) => <Ionicons name="cube-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="offers"
        options={{
          title: 'ההצעות שלי',
          tabBarLabel: 'הצעות',
          tabBarIcon: ({ color, size }) => <Ionicons name="cash-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'לוח הזמנים',
          tabBarLabel: 'יומן',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="payouts"
        options={{
          title: 'תשלומים',
          tabBarLabel: 'תשלומים',
          tabBarIcon: ({ color, size }) => <Ionicons name="wallet-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'סטטיסטיקות',
          tabBarLabel: 'נתונים',
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen name="notifications" options={{ title: 'התראות', href: null }} />
    </Tabs>
  );
}
