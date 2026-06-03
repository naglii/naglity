import { cn } from '@/lib/utils';

/** Custom crane glyph — a tower-crane silhouette that reads at small sizes. */
export function CraneGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {/* mast */}
      <path d="M9 21V5" />
      {/* jib (horizontal arm) + counter-jib */}
      <path d="M4 5h15" />
      {/* tie bars */}
      <path d="M9 5l4 3M9 5L5.5 8" />
      {/* hoist line + hook load */}
      <path d="M17 5v4" />
      <rect x="15.5" y="9" width="3" height="2.5" rx="0.5" />
      {/* base */}
      <path d="M6.5 21h5" />
    </svg>
  );
}

interface BrandMarkProps {
  className?: string;
  iconClassName?: string;
}

/** The gradient tile + crane — use standalone where space is tight. */
export function BrandMark({ className, iconClassName }: BrandMarkProps) {
  return (
    <span
      className={cn(
        'bg-brand-gradient grid place-items-center rounded-xl text-white shadow-sm shadow-brand/30',
        className,
      )}
    >
      <CraneGlyph className={cn('size-[60%]', iconClassName)} />
    </span>
  );
}

interface LogoProps {
  /** Tailwind size for the gradient tile, e.g. 'size-9'. */
  markClassName?: string;
  /** Wordmark text size, e.g. 'text-lg'. */
  wordClassName?: string;
  className?: string;
  showWord?: boolean;
}

/** Full lockup: crane mark + "Naglity" wordmark with a brand accent dot. */
export function Logo({
  markClassName = 'size-9',
  wordClassName = 'text-lg',
  className,
  showWord = true,
}: LogoProps) {
  return (
    <span className={cn('flex items-center gap-2.5', className)} dir="ltr">
      <BrandMark className={markClassName} />
      {showWord && (
        <span
          className={cn(
            'font-black tracking-tight leading-none flex items-baseline',
            wordClassName,
          )}
        >
          <span className="text-foreground">Naglity</span>
          <span className="text-brand-strong">.</span>
        </span>
      )}
    </span>
  );
}
