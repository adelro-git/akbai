interface IllustrationProps {
  size?: number;
  className?: string;
}

export function MorningBriefing({ size = 64, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      role="img"
      aria-label="Morning briefing"
      className={className}
    >
      {/* Sun (half rising) */}
      <circle cx="32" cy="20" r="12" fill="#f59e0b" opacity="0.2" />
      <circle cx="32" cy="20" r="8" fill="#f59e0b" opacity="0.4" />
      {/* Sun rays */}
      <line x1="32" y1="6" x2="32" y2="9" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <line x1="41" y1="9" x2="39.5" y2="11.5" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <line x1="23" y1="9" x2="24.5" y2="11.5" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <line x1="46" y1="16" x2="43" y2="17" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      <line x1="18" y1="16" x2="21" y2="17" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" opacity="0.3" />

      {/* Horizon line */}
      <rect x="6" y="24" width="52" height="1" rx="0.5" fill="hsl(var(--on-surface))" opacity="0.3" />

      {/* Clipboard body */}
      <rect x="14" y="28" width="36" height="32" rx="3" fill="hsl(var(--surface))" />
      <rect x="14" y="28" width="36" height="32" rx="3" stroke="hsl(var(--on-surface))" strokeWidth="1" opacity="0.3" />

      {/* Clipboard clip */}
      <rect x="24" y="25" width="16" height="6" rx="2" fill="hsl(var(--surface-container))" />
      <rect x="24" y="25" width="16" height="6" rx="2" stroke="hsl(var(--on-surface))" strokeWidth="1" opacity="0.3" />
      <rect x="28" y="26" width="8" height="2" rx="1" fill="hsl(var(--primary-container))" />

      {/* Checklist items */}
      {/* Item 1 - checked */}
      <rect x="19" y="35" width="4" height="4" rx="1" fill="hsl(var(--tertiary))" opacity="0.5" />
      <path d="M20 37.5 L21 38.5 L23 36" stroke="hsl(var(--tertiary))" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="25" y="36" width="18" height="2" rx="1" fill="hsl(var(--on-surface))" opacity="0.4" />

      {/* Item 2 - checked */}
      <rect x="19" y="42" width="4" height="4" rx="1" fill="hsl(var(--tertiary))" opacity="0.5" />
      <path d="M20 44.5 L21 45.5 L23 43" stroke="hsl(var(--tertiary))" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="25" y="43" width="14" height="2" rx="1" fill="hsl(var(--on-surface))" opacity="0.4" />

      {/* Item 3 - unchecked */}
      <rect x="19" y="49" width="4" height="4" rx="1" fill="hsl(var(--surface-container))" />
      <rect x="19" y="49" width="4" height="4" rx="1" stroke="hsl(var(--on-surface))" strokeWidth="1" opacity="0.3" fill="none" />
      <rect x="25" y="50" width="20" height="2" rx="1" fill="hsl(var(--on-surface))" opacity="0.35" />

      {/* Item 4 - unchecked */}
      <rect x="19" y="55" width="4" height="4" rx="1" fill="hsl(var(--surface-container))" />
      <rect x="19" y="55" width="4" height="4" rx="1" stroke="hsl(var(--on-surface))" strokeWidth="1" opacity="0.3" fill="none" />
      <rect x="25" y="56" width="16" height="2" rx="1" fill="hsl(var(--on-surface))" opacity="0.35" />
    </svg>
  );
}
