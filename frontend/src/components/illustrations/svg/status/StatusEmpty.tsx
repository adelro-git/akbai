interface IllustrationProps {
  size?: number;
  className?: string;
}

export function StatusEmpty({ size = 40, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-label="No items yet"
      className={className}
    >
      {/* Box back face */}
      <path
        d="M8 16L20 10L32 16L32 28L20 34L8 28Z"
        fill="hsl(var(--surface-container))"
      />
      {/* Box left face */}
      <path
        d="M8 16L20 22L20 34L8 28Z"
        fill="#f59e0b"
        opacity="0.2"
      />
      {/* Box right face */}
      <path
        d="M32 16L20 22L20 34L32 28Z"
        fill="#f59e0b"
        opacity="0.12"
      />
      {/* Box top edge lines */}
      <path
        d="M8 16L20 22L32 16"
        stroke="#d97706"
        strokeWidth="1.2"
        strokeLinejoin="round"
        fill="none"
        opacity="0.5"
      />
      {/* Box left edge */}
      <path d="M8 16L8 28L20 34L20 22" stroke="#d97706" strokeWidth="1.2" strokeLinejoin="round" fill="none" opacity="0.4" />
      {/* Box right edge */}
      <path d="M32 16L32 28L20 34" stroke="#d97706" strokeWidth="1.2" strokeLinejoin="round" fill="none" opacity="0.4" />
      {/* Open flap left */}
      <path
        d="M8 16L14 8L20 12L20 10"
        fill="#f59e0b"
        opacity="0.15"
      />
      {/* Open flap right */}
      <path
        d="M32 16L26 8L20 12L20 10"
        fill="#f59e0b"
        opacity="0.1"
      />
      {/* Dotted interior line suggesting emptiness */}
      <path
        d="M15 25L17 24L19 25L21 24L23 25L25 24"
        stroke="#d97706"
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeDasharray="1.5 1.5"
        fill="none"
        opacity="0.4"
      />
    </svg>
  );
}
