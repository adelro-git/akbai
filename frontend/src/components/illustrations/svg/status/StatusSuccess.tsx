interface IllustrationProps {
  size?: number;
  className?: string;
}

export function StatusSuccess({ size = 40, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-label="Success"
      className={className}
    >
      {/* Circle background */}
      <circle cx="20" cy="20" r="18" fill="hsl(var(--tertiary))" stroke="hsl(var(--on-surface))" strokeWidth="1" opacity="0.3" />
      {/* Checkmark */}
      <path
        d="M12 20L17.5 25.5L28 14.5"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
