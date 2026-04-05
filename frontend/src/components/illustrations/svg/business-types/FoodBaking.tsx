interface IllustrationProps {
  size?: number;
  className?: string;
}

export function FoodBaking({ size = 48, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="Food and baking business"
      className={className}
    >
      {/* Plate */}
      <ellipse cx="24" cy="40" rx="16" ry="4" fill="hsl(var(--surface-container))" />
      <ellipse cx="24" cy="39" rx="14" ry="3" fill="hsl(var(--surface))" />

      {/* Paper liner */}
      <path
        d="M16 32 L14 39 L16.5 38 L19 39 L21.5 38 L24 39 L26.5 38 L29 39 L31.5 38 L34 39 L32 32Z"
        fill="#f5e6d3"
      />

      {/* Pan de sal body */}
      <ellipse cx="24" cy="30" rx="9" ry="7" fill="#d4954a" stroke="#92400e" strokeWidth="1.2" />
      {/* Bread highlight */}
      <ellipse cx="22" cy="27" rx="5" ry="3.5" fill="#e8b06a" />
      {/* Bread score line */}
      <path d="M20 29 Q24 25 28 29" stroke="#c07830" strokeWidth="1" fill="none" />

      {/* Steam curl 1 */}
      <path
        d="M20 18 Q18 14 20 11"
        stroke="hsl(var(--on-surface))"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
      {/* Steam curl 2 */}
      <path
        d="M24 16 Q22 12 24 9"
        stroke="hsl(var(--on-surface))"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
      {/* Steam curl 3 */}
      <path
        d="M28 17 Q26 13 28 10"
        stroke="hsl(var(--on-surface))"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
    </svg>
  );
}
