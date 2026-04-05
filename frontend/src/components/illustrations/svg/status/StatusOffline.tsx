interface IllustrationProps {
  size?: number;
  className?: string;
}

export function StatusOffline({ size = 40, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-label="Offline"
      className={className}
    >
      {/* Circle background */}
      <circle cx="20" cy="20" r="18" fill="hsl(var(--surface-container))" stroke="hsl(var(--on-surface))" strokeWidth="1" opacity="0.3" />
      {/* Wifi arc 1 (outer) */}
      <path
        d="M8 18C12.5 13 17 11 20 11C23 11 27.5 13 32 18"
        stroke="hsl(var(--on-surface))"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
      {/* Wifi arc 2 (middle) */}
      <path
        d="M12 22C14.5 19 17 17.5 20 17.5C23 17.5 25.5 19 28 22"
        stroke="hsl(var(--on-surface))"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
      {/* Wifi arc 3 (inner) */}
      <path
        d="M16 26C17.5 24 18.5 23 20 23C21.5 23 22.5 24 24 26"
        stroke="hsl(var(--on-surface))"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
      {/* Wifi dot */}
      <circle cx="20" cy="29" r="1.5" fill="hsl(var(--on-surface))" opacity="0.6" />
      {/* Diagonal slash */}
      <path
        d="M10 10L30 30"
        stroke="hsl(var(--on-surface))"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
