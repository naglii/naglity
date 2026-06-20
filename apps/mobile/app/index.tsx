import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

// Entry point — routes to the feed or login once auth has hydrated.
// (The root Gate also enforces this; this keeps the initial frame correct.)
export default function Index() {
  const { user, ready } = useAuth();
  if (!ready) return null;
  return <Redirect href={user ? '/(tabs)/feed' : '/(auth)/login'} />;
}
