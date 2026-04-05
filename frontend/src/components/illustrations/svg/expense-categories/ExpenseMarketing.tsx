interface IllustrationProps {
  size?: number;
  className?: string;
}

export function ExpenseMarketing({ size = 40, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-label="Marketing expenses"
      className={className}
    >
      {/* Megaphone bell */}
      <path
        d="M10 16L28 8V32L10 24V16Z"
        fill="hsl(var(--primary-container))"
        stroke="hsl(var(--on-surface))"
        strokeWidth="0.8"
        opacity="0.25"
      />
      {/* Megaphone mouth opening */}
      <path
        d="M28 8L34 5V35L28 32V8Z"
        fill="#f59e0b"
      />
      {/* Megaphone inner shadow */}
      <path
        d="M29 10L33 7.5V32.5L29 30V10Z"
        fill="#d97706"
        opacity="0.4"
      />
      {/* Handle grip */}
      <rect x="6" y="16" width="5" height="8" rx="1.5" fill="hsl(var(--on-surface))" opacity="0.5" />
      {/* Handle detail */}
      <rect x="7" y="17.5" width="3" height="5" rx="1" fill="hsl(var(--on-surface))" opacity="0.35" />
      {/* Sound wave lines */}
      <path d="M35 15C37 17 37 23 35 25" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M37 12C39.5 15.5 39.5 24.5 37 28" stroke="#fbbf24" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" fill="none" />
      {/* Sparkle top-right */}
      <path d="M32 4L33 2L34 4L36 5L34 6L33 8L32 6L30 5Z" fill="#fbbf24" opacity="0.8" />
      {/* Sparkle small */}
      <path d="M5 8L5.5 6.5L6 8L7.5 8.5L6 9L5.5 10.5L5 9L3.5 8.5Z" fill="hsl(var(--tertiary))" opacity="0.6" />
      {/* Sparkle bottom */}
      <path d="M7 30L7.7 28.5L8.4 30L10 30.7L8.4 31.4L7.7 33L7 31.4L5.3 30.7Z" fill="#fbbf24" opacity="0.7" />
      {/* Dot accents */}
      <circle cx="36" cy="9" r="1" fill="#fbbf24" opacity="0.5" />
      <circle cx="3" cy="14" r="0.8" fill="hsl(var(--tertiary))" opacity="0.4" />
    </svg>
  );
}
