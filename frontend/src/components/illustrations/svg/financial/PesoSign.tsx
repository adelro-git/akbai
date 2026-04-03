interface IllustrationProps {
  size?: number;
  className?: string;
}

export function PesoSign({ size = 40, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-label="Philippine peso"
      className={className}
    >
      {/* Circular background */}
      <circle cx="20" cy="20" r="18" fill="#f59e0b" />
      {/* Inner ring highlight */}
      <circle cx="20" cy="20" r="14" fill="#fbbf24" />
      {/* Peso symbol */}
      <text
        x="20"
        y="27"
        fontSize="22"
        fontWeight="800"
        fill="#92400e"
        textAnchor="middle"
        fontFamily="sans-serif"
      >
        ₱
      </text>
      {/* Shine accent */}
      <ellipse cx="14" cy="13" rx="4" ry="2.5" fill="#fde68a" opacity="0.6" />
    </svg>
  );
}
