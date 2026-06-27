import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/Toast';
import { Button } from '@/components/ui';
import { colors } from '@/theme/colors';
import type { LoginResponse } from '@/types/api';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!identifier.trim() || !password) {
      toast.error('יש להזין שם משתמש וסיסמה');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post<LoginResponse>('/auth/login', {
        identifier: identifier.trim(),
        password,
      });
      if (data.user.role !== 'DRIVER') {
        toast.error('אפליקציה זו מיועדת לנהגים בלבד');
        return;
      }
      await signIn(data.user, data.accessToken);
      // The root Gate redirects to the feed once `user` is set.
    } catch (err: any) {
      if (!err.response) {
        // No HTTP response = the request never reached the API (wrong URL / server down / firewall).
        toast.error('אין חיבור לשרת. ודא שהשרת פועל ושכתובת ה-API נכונה');
      } else if (err.response.status === 401) {
        toast.error(err.response.data?.message ?? 'שם משתמש או סיסמה שגויים');
      } else {
        toast.error(err.response.data?.message ?? 'שגיאה, נסה שוב');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 60 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logo}>
          <Ionicons name="cube" size={30} color={colors.white} />
        </View>
        <Text style={styles.brand}>Naglity</Text>
        <Text style={styles.tagline}>אפליקציית הנהגים — עבודות מנוף</Text>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>שם משתמש או אימייל</Text>
            <TextInput
              style={styles.input}
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="שם משתמש"
              placeholderTextColor={colors.mutedForeground}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>סיסמה</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••"
              placeholderTextColor={colors.mutedForeground}
              onSubmitEditing={submit}
            />
          </View>

          <Button title="התחברות" onPress={submit} loading={loading} size="lg" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingBottom: 40, alignItems: 'center' },
  logo: {
    width: 76, height: 76, borderRadius: 24, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  brand: { fontSize: 30, fontWeight: '900', color: colors.foreground },
  tagline: { fontSize: 15, color: colors.mutedForeground, marginTop: 4, marginBottom: 36, writingDirection: 'rtl' },
  form: { width: '100%', gap: 18 },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: '700', color: colors.foreground, textAlign: 'right', writingDirection: 'rtl' },
  input: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 16,
    paddingHorizontal: 16, height: 54, fontSize: 16, color: colors.foreground,
    backgroundColor: colors.card, textAlign: 'right', writingDirection: 'rtl',
  },
});
