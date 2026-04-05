interface IllustrationProps {
  size?: number;
  className?: string;
}

export function ProfileUser({ size = 48, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="User profile"
      className={className}
    >
      {/* Circular background */}
      <circle cx="24" cy="24" r="22" fill="hsl(var(--primary-container))" stroke="hsl(var(--on-surface))" strokeWidth="1.5" opacity="0.85" />
      {/* Head */}
      <circle cx="24" cy="18" r="7" fill="hsl(var(--on-surface))" opacity="0.7" />
      {/* Body / shoulders */}
      <path
        d="M10 42C10 34 16 28 24 28C32 28 38 34 38 42"
        fill="hsl(var(--on-surface))"
        opacity="0.7"
      />
    </svg>
  );
}
