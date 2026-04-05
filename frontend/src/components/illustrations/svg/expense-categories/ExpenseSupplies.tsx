interface IllustrationProps {
  size?: number;
  className?: string;
}

export function ExpenseSupplies({ size = 40, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-label="Supplies expenses"
      className={className}
    >
      {/* Box body */}
      <rect x="6" y="16" width="28" height="18" rx="2" fill="hsl(var(--primary-container))" stroke="hsl(var(--on-surface))" strokeWidth="0.8" opacity="0.25" />
      {/* Box front face darker shade */}
      <rect x="6" y="24" width="28" height="10" rx="1" fill="#d97706" opacity="0.25" />
      {/* Box flap left */}
      <path
        d="M6 16L6 12C6 11 7 10 8 10L18 10L18 16H6Z"
        fill="#f59e0b"
      />
      {/* Box flap right */}
      <path
        d="M22 10L32 10C33 10 34 11 34 12V16H22V10Z"
        fill="#e8a308"
      />
      {/* Gap between flaps */}
      <rect x="18" y="10" width="4" height="6" fill="hsl(var(--on-surface))" opacity="0.1" />
      {/* Item 1: pencil peeking out */}
      <rect x="12" y="5" width="2" height="12" rx="0.5" fill="#fbbf24" />
      <polygon points="12,5 14,5 13,2.5" fill="#d97706" />
      {/* Item 2: ruler peeking out */}
      <rect x="24" y="7" width="2.5" height="10" rx="0.5" fill="hsl(var(--tertiary))" opacity="0.7" />
      <rect x="24.8" y="8" width="0.8" height="1" rx="0.2" fill="hsl(var(--surface-container))" />
      <rect x="24.8" y="10" width="0.8" height="1" rx="0.2" fill="hsl(var(--surface-container))" />
      <rect x="24.8" y="12" width="0.8" height="1" rx="0.2" fill="hsl(var(--surface-container))" />
      {/* Item 3: round object (tape roll) */}
      <circle cx="18" cy="8" r="3" fill="hsl(var(--on-surface))" opacity="0.45" />
      <circle cx="18" cy="8" r="1.5" fill="hsl(var(--surface-container))" />
      {/* Box tape strip */}
      <rect x="18" y="16" width="4" height="10" rx="0.5" fill="#fbbf24" opacity="0.4" />
    </svg>
  );
}
