interface IllustrationProps {
  size?: number;
  className?: string;
}

export function ReplyDrafter({ size = 64, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      role="img"
      aria-label="Reply drafter"
      className={className}
    >
      {/* Message bubble */}
      <rect x="6" y="8" width="40" height="32" rx="6" fill="hsl(var(--primary-container))" />
      {/* Bubble tail */}
      <path d="M14 40 L8 50 L24 40Z" fill="hsl(var(--primary-container))" />

      {/* Text lines in bubble */}
      <rect x="12" y="15" width="24" height="2.5" rx="1" fill="hsl(var(--on-surface))" opacity="0.2" />
      <rect x="12" y="20" width="18" height="2.5" rx="1" fill="hsl(var(--on-surface))" opacity="0.15" />
      <rect x="12" y="25" width="28" height="2.5" rx="1" fill="hsl(var(--on-surface))" opacity="0.15" />
      <rect x="12" y="30" width="14" height="2.5" rx="1" fill="hsl(var(--on-surface))" opacity="0.12" />

      {/* Pencil / pen */}
      {/* Pencil body */}
      <rect
        x="44"
        y="20"
        width="6"
        height="30"
        rx="1.5"
        fill="#d4954a"
        transform="rotate(-30 44 20)"
      />
      {/* Pencil tip */}
      <path
        d="M36.5 51.5 L33 56 L38 54Z"
        fill="#e8b06a"
      />
      <path
        d="M34.5 54 L33 56 L35.5 55Z"
        fill="hsl(var(--on-surface))"
        opacity="0.5"
      />
      {/* Pencil top band */}
      <rect
        x="44"
        y="22"
        width="6"
        height="4"
        fill="#c07830"
        transform="rotate(-30 44 20)"
      />
      {/* Eraser */}
      <rect
        x="44"
        y="17"
        width="6"
        height="5"
        rx="1.5"
        fill="#e8a0a0"
        transform="rotate(-30 44 20)"
      />

      {/* AI sparkles */}
      <circle cx="52" cy="10" r="2" fill="hsl(var(--tertiary))" opacity="0.6" />
      <circle cx="58" cy="16" r="1.5" fill="hsl(var(--tertiary))" opacity="0.4" />
      <circle cx="54" cy="20" r="1" fill="hsl(var(--tertiary))" opacity="0.3" />

      {/* Cursor blink line */}
      <rect x="28" y="30" width="1.5" height="3" rx="0.5" fill="hsl(var(--tertiary))" opacity="0.6" />
    </svg>
  );
}
