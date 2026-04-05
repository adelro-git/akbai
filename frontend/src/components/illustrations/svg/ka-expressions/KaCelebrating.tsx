interface IllustrationProps {
  size?: number;
  className?: string;
}

export function KaCelebrating({ size = 48, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="Kai is celebrating"
      className={className}
    >
      {/* Confetti pieces */}
      <rect x="6" y="6" width="3" height="3" rx="0.5" fill="#f59e0b" opacity="0.7" transform="rotate(15 7.5 7.5)" />
      <rect x="40" y="4" width="2.5" height="2.5" rx="0.5" fill="hsl(var(--tertiary))" opacity="0.7" transform="rotate(-20 41 5)" />
      <rect x="3" y="20" width="2" height="2" rx="0.5" fill="#fbbf24" opacity="0.6" transform="rotate(30 4 21)" />
      <rect x="44" y="22" width="2.5" height="2.5" rx="0.5" fill="#d97706" opacity="0.6" transform="rotate(-10 45 23)" />
      <circle cx="8" cy="36" r="1.5" fill="#fbbf24" opacity="0.5" />
      <circle cx="42" cy="36" r="1.2" fill="hsl(var(--tertiary))" opacity="0.5" />
      {/* Golden C-shape body */}
      <path
        d="M30 10C18 10 10 18 10 26C10 34 18 42 30 42C32 42 33 41 33 40C33 39 32 38 30 38C20.5 38 14 32 14 26C14 20 20.5 14 30 14C32 14 33 13 33 12C33 11 32 10 30 10Z"
        fill="#f59e0b"
        stroke="#92400e"
        strokeWidth="1"
      />
      {/* Shading */}
      <path
        d="M30 14C20.5 14 14 20 14 26C14 28 14.8 30 16 31.5C17 28 21 22 30 20C32 19.5 33 17 33 16C33 15 32 14 30 14Z"
        fill="#d97706"
        opacity="0.6"
      />
      {/* Happy eyes - curved upward (squinting with joy) */}
      <path d="M20 23C21 21.5 23 21.5 24 23" stroke="#1c1c18" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M28 23C29 21.5 31 21.5 32 23" stroke="#1c1c18" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Wide happy smile */}
      <path
        d="M20 30C22 34 30 34 32 30"
        stroke="#1c1c18"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Sparkle top-left */}
      <path
        d="M6 12L7 14.5L9.5 15.5L7 16.5L6 19L5 16.5L2.5 15.5L5 14.5Z"
        fill="#fbbf24"
      />
      {/* Sparkle top-right */}
      <path
        d="M40 14L41 16L43 17L41 18L40 20L39 18L37 17L39 16Z"
        fill="#fde68a"
      />
    </svg>
  );
}
