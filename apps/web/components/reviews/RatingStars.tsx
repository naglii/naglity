import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  value: number;
  count?: number;
  size?: number;
  className?: string;
}

/** Read-only star rating. Pass `count` to show "4.5 (12)" or "אין דירוג". */
export function RatingStars({ value, count, size = 14, className }: Props) {
  const full = Math.round(value);
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <span className="inline-flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            style={{ width: size, height: size }}
            className={i < full ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}
          />
        ))}
      </span>
      {count != null && (
        <span className="text-xs text-muted-foreground">{count > 0 ? `${value} (${count})` : 'אין דירוג'}</span>
      )}
    </span>
  );
}
