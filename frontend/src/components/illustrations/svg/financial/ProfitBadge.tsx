interface IllustrationProps {
  size?: number;
  className?: string;
}

export function ProfitBadge({ size = 40, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-label="Profit indicator"
      className={className}
    >
      {/* Badge/star shape */}
      <path
        d="M20 2L24.5 13.5L36 14.5L27.5 22L30 34L20 28L10 34L12.5 22L4 14.5L15.5 13.5Z"
        fill="hsl(var(--tertiary))"
      />
      {/* Inner highlight */}
      <path
        d="M20 7L23.2 15L31 15.7L25 21L27 29L20 25L13 29L15 21L9 15.7L16.8 15Z"
        fill="hsl(var(--tertiary))"
        opacity="0.85"
      />
      {/* Plus/checkmark inside */}
      <path
        d="M15 20L18 23L25 16"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
