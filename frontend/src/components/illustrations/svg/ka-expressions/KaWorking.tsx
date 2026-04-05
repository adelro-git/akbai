interface IllustrationProps {
  size?: number;
  className?: string;
}

export function KaWorking({ size = 48, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="Kai is working"
      className={className}
    >
      {/* Golden C-shape body */}
      <path
        d="M26 8C14 8 6 16 6 24C6 32 14 40 26 40C28 40 29 39 29 38C29 37 28 36 26 36C16.5 36 10 30 10 24C10 18 16.5 12 26 12C28 12 29 11 29 10C29 9 28 8 26 8Z"
        fill="#f59e0b"
        stroke="#92400e"
        strokeWidth="1"
      />
      {/* Shading */}
      <path
        d="M26 12C16.5 12 10 18 10 24C10 26 10.8 28 12 29.5C13 26 17 20 26 18C28 17.5 29 15 29 14C29 13 28 12 26 12Z"
        fill="#d97706"
        opacity="0.6"
      />
      {/* Focused left eye - slightly narrowed */}
      <ellipse cx="18" cy="22" rx="2" ry="1.6" fill="#1c1c18" />
      {/* Focused right eye */}
      <ellipse cx="26" cy="22" rx="2" ry="1.6" fill="#1c1c18" />
      {/* Determined straight mouth */}
      <path
        d="M19 28L27 28"
        stroke="#1c1c18"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Clipboard */}
      <rect x="34" y="14" width="10" height="13" rx="1.5" fill="hsl(var(--surface-container))" />
      {/* Clipboard clip */}
      <rect x="37" y="12" width="4" height="3" rx="1" fill="#d97706" />
      {/* Clipboard lines */}
      <rect x="36" y="19" width="6" height="1" rx="0.5" fill="hsl(var(--on-surface))" opacity="0.3" />
      <rect x="36" y="22" width="4" height="1" rx="0.5" fill="hsl(var(--on-surface))" opacity="0.3" />
      <rect x="36" y="25" width="5" height="1" rx="0.5" fill="hsl(var(--on-surface))" opacity="0.3" />
    </svg>
  );
}
