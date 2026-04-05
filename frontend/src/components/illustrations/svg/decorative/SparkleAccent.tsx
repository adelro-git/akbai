interface IllustrationProps {
  size?: number;
  className?: string;
}

export function SparkleAccent({ size = 24, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* 4-pointed sparkle star */}
      <path
        d="M12 0L14 9L24 12L14 15L12 24L10 15L0 12L10 9Z"
        fill="hsl(var(--primary-container))"
        stroke="hsl(var(--on-surface))"
        strokeWidth="0.5"
        opacity="0.9"
      />
    </svg>
  );
}
