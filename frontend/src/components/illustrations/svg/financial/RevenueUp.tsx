interface IllustrationProps {
  size?: number;
  className?: string;
}

export function RevenueUp({ size = 40, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-label="Revenue increasing"
      className={className}
    >
      {/* Background circle */}
      <circle cx="20" cy="20" r="18" fill="hsl(var(--surface-container))" />
      {/* Upward trending arrow */}
      <path
        d="M8 28L16 20L22 24L32 12"
        stroke="hsl(var(--tertiary))"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Arrow head */}
      <path
        d="M26 12H32V18"
        stroke="hsl(var(--tertiary))"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Peso sign */}
      <text
        x="10"
        y="16"
        fontSize="10"
        fontWeight="700"
        fill="hsl(var(--tertiary))"
        fontFamily="sans-serif"
      >
        ₱
      </text>
    </svg>
  );
}
