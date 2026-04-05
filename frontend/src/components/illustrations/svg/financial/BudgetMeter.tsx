interface IllustrationProps {
  size?: number;
  className?: string;
}

export function BudgetMeter({ size = 40, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-label="Budget meter"
      className={className}
    >
      {/* Background circle */}
      <circle cx="20" cy="20" r="18" fill="hsl(var(--surface-container))" stroke="hsl(var(--on-surface))" strokeWidth="0.8" opacity="0.25" />
      {/* Gauge track - caution zone (amber, left side) */}
      <path
        d="M8 26A14 14 0 0 1 20 8"
        stroke="#f59e0b"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      {/* Gauge track - good zone (teal, right side) */}
      <path
        d="M20 8A14 14 0 0 1 32 26"
        stroke="hsl(var(--tertiary))"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      {/* Center pivot */}
      <circle cx="20" cy="26" r="2.5" fill="hsl(var(--on-surface))" />
      {/* Needle pointing to good zone */}
      <path
        d="M20 26L28 14"
        stroke="hsl(var(--on-surface))"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Min label */}
      <circle cx="9" cy="28" r="1.5" fill="#d97706" />
      {/* Max label */}
      <circle cx="31" cy="28" r="1.5" fill="hsl(var(--tertiary))" />
    </svg>
  );
}
