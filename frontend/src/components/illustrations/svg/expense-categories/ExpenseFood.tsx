interface IllustrationProps {
  size?: number;
  className?: string;
}

export function ExpenseFood({ size = 40, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-label="Food expenses"
      className={className}
    >
      {/* Bowl body */}
      <path
        d="M8 18C8 18 8 28 20 28C32 28 32 18 32 18H8Z"
        fill="hsl(var(--primary-container))"
      />
      {/* Bowl rim */}
      <ellipse cx="20" cy="18" rx="12" ry="3" fill="#f59e0b" />
      {/* Rice mound */}
      <path
        d="M12 18C12 18 14 13 20 13C26 13 28 18 28 18"
        fill="hsl(var(--surface-container))"
      />
      {/* Rice grain details */}
      <ellipse cx="17" cy="15.5" rx="1.5" ry="0.8" fill="#ffffff" opacity="0.6" />
      <ellipse cx="22" cy="14.5" rx="1.5" ry="0.8" fill="#ffffff" opacity="0.6" />
      <ellipse cx="20" cy="16.5" rx="1.2" ry="0.7" fill="#ffffff" opacity="0.5" />
      {/* Bowl base */}
      <rect x="16" y="28" width="8" height="2" rx="1" fill="hsl(var(--on-surface))" opacity="0.2" />
      {/* Spoon */}
      <path
        d="M30 8C30 8 32 9 32 11C32 13 30 13.5 30 13.5L29 13L28.5 9L30 8Z"
        fill="hsl(var(--on-surface))"
        opacity="0.5"
      />
      <rect x="29" y="13" width="1.2" height="8" rx="0.6" fill="hsl(var(--on-surface))" opacity="0.5" />
      {/* Fork */}
      <rect x="7" y="7" width="0.8" height="6" rx="0.4" fill="hsl(var(--on-surface))" opacity="0.5" />
      <rect x="9" y="7" width="0.8" height="6" rx="0.4" fill="hsl(var(--on-surface))" opacity="0.5" />
      <rect x="11" y="7" width="0.8" height="6" rx="0.4" fill="hsl(var(--on-surface))" opacity="0.5" />
      <rect x="7" y="12.5" width="4.8" height="1.5" rx="0.75" fill="hsl(var(--on-surface))" opacity="0.5" />
      <rect x="8.5" y="14" width="1.8" height="7" rx="0.9" fill="hsl(var(--on-surface))" opacity="0.5" />
      {/* Steam wisps */}
      <path d="M16 10C16 8.5 17 7 16.5 5.5" stroke="hsl(var(--on-surface))" strokeWidth="0.8" strokeLinecap="round" opacity="0.25" fill="none" />
      <path d="M20 9C20 7.5 21 6 20.5 4.5" stroke="hsl(var(--on-surface))" strokeWidth="0.8" strokeLinecap="round" opacity="0.25" fill="none" />
      <path d="M24 10C24 8.5 25 7 24.5 5.5" stroke="hsl(var(--on-surface))" strokeWidth="0.8" strokeLinecap="round" opacity="0.25" fill="none" />
    </svg>
  );
}
