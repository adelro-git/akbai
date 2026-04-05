interface IllustrationProps {
  size?: number;
  className?: string;
}

export function RetailSariSari({ size = 48, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="Retail or sari-sari store"
      className={className}
    >
      {/* Awning stripes */}
      <path d="M4 14 L44 14 L42 8 L6 8Z" fill="hsl(var(--primary-container))" />
      <path d="M10 8 L11 14" stroke="#e8b06a" strokeWidth="1" opacity="0.6" />
      <path d="M16 8 L17 14" stroke="#e8b06a" strokeWidth="1" opacity="0.6" />
      <path d="M22 8 L23 14" stroke="#e8b06a" strokeWidth="1" opacity="0.6" />
      <path d="M28 8 L29 14" stroke="#e8b06a" strokeWidth="1" opacity="0.6" />
      <path d="M34 8 L35 14" stroke="#e8b06a" strokeWidth="1" opacity="0.6" />
      <path d="M40 8 L41 14" stroke="#e8b06a" strokeWidth="1" opacity="0.6" />
      {/* Awning scallop */}
      <path
        d="M4 14 Q8 18 12 14 Q16 18 20 14 Q24 18 28 14 Q32 18 36 14 Q40 18 44 14"
        fill="hsl(var(--primary-container))"
      />

      {/* Store body */}
      <rect x="6" y="14" width="36" height="26" fill="hsl(var(--surface-container))" />

      {/* Open window / counter */}
      <rect x="10" y="18" width="28" height="14" rx="1" fill="hsl(var(--surface))" />

      {/* Shelf 1 */}
      <rect x="11" y="24" width="26" height="1" fill="hsl(var(--on-surface))" opacity="0.35" />
      {/* Products on shelf 1 */}
      <rect x="13" y="19" width="4" height="5" rx="1" fill="#d4954a" opacity="0.7" />
      <rect x="18" y="20" width="3" height="4" rx="0.5" fill="hsl(var(--tertiary))" opacity="0.5" />
      <rect x="22" y="19" width="4" height="5" rx="1" fill="#e8b06a" opacity="0.7" />
      <circle cx="30" cy="22" r="2.5" fill="#c07830" opacity="0.5" />

      {/* Shelf 2 */}
      <rect x="11" y="30" width="26" height="1" fill="hsl(var(--on-surface))" opacity="0.35" />
      {/* Products on shelf 2 */}
      <rect x="12" y="26" width="5" height="4" rx="1" fill="hsl(var(--tertiary))" opacity="0.4" />
      <rect x="19" y="27" width="3" height="3" rx="0.5" fill="#d4954a" opacity="0.6" />
      <rect x="24" y="26" width="4" height="4" rx="1" fill="hsl(var(--primary-container))" />
      <rect x="30" y="27" width="5" height="3" rx="0.5" fill="#c07830" opacity="0.4" />

      {/* Counter ledge */}
      <rect x="6" y="34" width="36" height="2" rx="0.5" fill="hsl(var(--on-surface))" opacity="0.4" />

      {/* Ground */}
      <rect x="4" y="40" width="40" height="2" rx="1" fill="hsl(var(--on-surface))" opacity="0.3" />
    </svg>
  );
}
