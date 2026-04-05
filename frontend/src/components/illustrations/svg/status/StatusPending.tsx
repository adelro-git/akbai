interface IllustrationProps {
  size?: number;
  className?: string;
}

export function StatusPending({ size = 40, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-label="Pending"
      className={className}
    >
      {/* Circle background */}
      <circle cx="20" cy="20" r="18" fill="hsl(var(--surface-container))" stroke="hsl(var(--on-surface))" strokeWidth="1" opacity="0.3" />
      {/* Clock face */}
      <circle cx="20" cy="20" r="12" fill="hsl(var(--surface-container))" stroke="hsl(var(--on-surface))" strokeWidth="2" />
      {/* Hour hand */}
      <path
        d="M20 20L20 13"
        stroke="hsl(var(--on-surface))"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Minute hand */}
      <path
        d="M20 20L26 17"
        stroke="hsl(var(--on-surface))"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Center dot */}
      <circle cx="20" cy="20" r="1.5" fill="hsl(var(--on-surface))" />
    </svg>
  );
}
