interface IllustrationProps {
  size?: number;
  className?: string;
}

export function RevenueDown({ size = 40, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-label="Revenue decreasing"
      className={className}
    >
      {/* Background circle */}
      <circle cx="20" cy="20" r="18" fill="hsl(var(--surface-container))" stroke="hsl(var(--on-surface))" strokeWidth="1.2" opacity="0.7" />
      {/* Downward trending arrow */}
      <path
        d="M8 12L16 20L22 16L32 28"
        stroke="#d97706"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Arrow head */}
      <path
        d="M26 28H32V22"
        stroke="#d97706"
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
        fill="#d97706"
        fontFamily="sans-serif"
      >
        ₱
      </text>
    </svg>
  );
}
