interface IllustrationProps {
  size?: number;
  className?: string;
}

export function KnowingEarnings({ size = 48, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="Knowing your earnings"
      className={className}
    >
      {/* Chart background area */}
      <rect x="4" y="8" width="40" height="32" rx="3" fill="hsl(var(--surface-container))" opacity="0.5" />

      {/* Grid lines */}
      <line x1="8" y1="16" x2="40" y2="16" stroke="hsl(var(--on-surface))" strokeWidth="0.5" opacity="0.08" />
      <line x1="8" y1="22" x2="40" y2="22" stroke="hsl(var(--on-surface))" strokeWidth="0.5" opacity="0.08" />
      <line x1="8" y1="28" x2="40" y2="28" stroke="hsl(var(--on-surface))" strokeWidth="0.5" opacity="0.08" />
      <line x1="8" y1="34" x2="40" y2="34" stroke="hsl(var(--on-surface))" strokeWidth="0.5" opacity="0.08" />

      {/* Upward trend area fill */}
      <path
        d="M8 34 L16 30 L24 26 L32 18 L40 12 L40 34Z"
        fill="hsl(var(--tertiary))"
        opacity="0.12"
      />

      {/* Upward trend line */}
      <path
        d="M8 34 L16 30 L24 26 L32 18 L40 12"
        stroke="hsl(var(--tertiary))"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Data points */}
      <circle cx="8" cy="34" r="2" fill="hsl(var(--tertiary))" />
      <circle cx="16" cy="30" r="2" fill="hsl(var(--tertiary))" />
      <circle cx="24" cy="26" r="2" fill="hsl(var(--tertiary))" />
      <circle cx="32" cy="18" r="2" fill="hsl(var(--tertiary))" />
      <circle cx="40" cy="12" r="2" fill="hsl(var(--tertiary))" />

      {/* Upward arrow */}
      <path
        d="M38 14 L40 10 L42 14"
        stroke="hsl(var(--tertiary))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Peso sign */}
      <text
        x="14"
        y="20"
        fontSize="12"
        fontWeight="bold"
        fill="hsl(var(--primary-container))"
        opacity="0.7"
      >
        ₱
      </text>
    </svg>
  );
}
