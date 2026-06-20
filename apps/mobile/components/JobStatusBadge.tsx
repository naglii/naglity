import { StyleSheet, Text, View } from 'react-native';
import type { JobStatus } from '@/types/api';
import { JOB_STATUS_CONFIG } from '@/theme/jobStatus';

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const c = JOB_STATUS_CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <View style={[styles.dot, { backgroundColor: c.dot }]} />
      <Text style={[styles.label, { color: c.fg }]}>{c.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  dot: { width: 6, height: 6, borderRadius: 999 },
  label: { fontSize: 12, fontWeight: '700', writingDirection: 'rtl' },
});
