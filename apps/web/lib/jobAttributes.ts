// Shared crane-job attribute options + display helpers.

/** Common crane-truck / mobile-crane capacities in tons. */
export const CRANE_CAPACITIES = [8, 12, 15, 20, 25, 30, 40, 50, 60, 80, 100, 120] as const;

export const LOAD_TYPES: { value: string; label: string }[] = [
  { value: 'building_materials', label: 'חומרי בניין' },
  { value: 'container', label: 'מכולה' },
  { value: 'machinery', label: 'ציוד / מכונה' },
  { value: 'prefab', label: 'אלמנטים טרומיים' },
  { value: 'panels', label: 'לוחות / עץ' },
  { value: 'furniture', label: 'ריהוט / הובלה' },
  { value: 'other', label: 'אחר' },
];

export function loadTypeLabel(value?: string | null): string | null {
  if (!value) return null;
  return LOAD_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function formatCapacity(tons?: number | null): string | null {
  return tons ? `${tons} טון` : null;
}

/** Capacity buckets for filtering the driver feed. */
export const CAPACITY_BUCKETS: { key: string; label: string; test: (t?: number | null) => boolean }[] = [
  { key: 'all', label: 'כל הקיבולות', test: () => true },
  { key: 'le15', label: 'עד 15 טון', test: (t) => t != null && t <= 15 },
  { key: '16-30', label: '16–30 טון', test: (t) => t != null && t > 15 && t <= 30 },
  { key: '31-50', label: '31–50 טון', test: (t) => t != null && t > 30 && t <= 50 },
  { key: 'gt50', label: '50+ טון', test: (t) => t != null && t > 50 },
];
