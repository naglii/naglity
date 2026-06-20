// Minimal toast system — the RN analogue of the web app's `sonner` toasts.
// Usage: import { toast } from '@/components/Toast'; toast.success('...') / toast.error('...').
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';

type ToastKind = 'success' | 'error';
type ToastMsg = { id: number; kind: ToastKind; text: string };

let _id = 0;
const listeners = new Set<(m: ToastMsg) => void>();

function emit(kind: ToastKind, text: string) {
  const msg = { id: ++_id, kind, text };
  listeners.forEach((l) => l(msg));
}

export const toast = {
  success: (text: string) => emit('success', text),
  error: (text: string) => emit('error', text),
};

export function ToastHost() {
  const [msg, setMsg] = useState<ToastMsg | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const listener = (m: ToastMsg) => {
      setMsg(m);
      if (timer.current) clearTimeout(timer.current);
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(
          () => setMsg(null),
        );
      }, 2600);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [opacity]);

  if (!msg) return null;

  const tone = msg.kind === 'success'
    ? { bg: colors.successSoft, fg: colors.success }
    : { bg: colors.destructiveSoft, fg: colors.destructive };

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, { bottom: insets.bottom + 80, opacity }]}
    >
      <View style={[styles.toast, { backgroundColor: tone.bg }]}>
        <Text style={[styles.text, { color: tone.fg }]}>{msg.text}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center', zIndex: 999 },
  toast: {
    maxWidth: '100%',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  text: { fontSize: 14, fontWeight: '700', textAlign: 'center', writingDirection: 'rtl' },
});
