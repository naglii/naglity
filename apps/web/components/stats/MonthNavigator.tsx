'use client';

import { addMonths, addYears, format, isSameMonth, startOfMonth } from 'date-fns';
import { he } from 'date-fns/locale';
import { ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  /** Any date within the selected month. */
  month: Date;
  onChange: (month: Date) => void;
}

/**
 * Credit-card-statement style month picker. Stepping/​jumping forward is
 * disabled once you reach the current month (no future data exists).
 * In RTL the "older" controls sit on the right, "newer" on the left.
 */
export function MonthNavigator({ month, onChange }: Props) {
  const current = startOfMonth(new Date());
  const isCurrent = isSameMonth(month, current);
  const go = (next: Date) => onChange(startOfMonth(next > current ? current : next));

  const btn =
    'grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-30';

  return (
    <div className="flex items-center gap-1 rounded-xl border bg-card p-1 shadow-sm">
      {/* older */}
      <button className={btn} onClick={() => go(addYears(month, -1))} aria-label="שנה קודמת">
        <ChevronsRight className="size-4" />
      </button>
      <button className={btn} onClick={() => go(addMonths(month, -1))} aria-label="חודש קודם">
        <ChevronRight className="size-4" />
      </button>

      <span className="min-w-[8.5rem] select-none text-center text-sm font-semibold capitalize">
        {format(month, 'MMMM yyyy', { locale: he })}
      </span>

      {/* newer */}
      <button
        className={cn(btn)}
        onClick={() => go(addMonths(month, 1))}
        disabled={isCurrent}
        aria-label="חודש הבא"
      >
        <ChevronLeft className="size-4" />
      </button>
      <button
        className={cn(btn)}
        onClick={() => go(addYears(month, 1))}
        disabled={isCurrent}
        aria-label="שנה הבאה"
      >
        <ChevronsLeft className="size-4" />
      </button>
    </div>
  );
}
