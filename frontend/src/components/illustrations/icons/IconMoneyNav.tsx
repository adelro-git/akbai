// ============================================================
// IconMoneyNav — Phase 4 nav icon (bottom-nav Pera tab)
// Source: design_handoff_akbai_redesign/synthesis/repos/icons.html (B4 approved)
// Two stacked coins with peso glyph drawn as path (no text — avoids accessibility leak).
// Active state inverts to filled coins.
// ============================================================
import type { NavIconProps } from './IconHomeNav';

export function IconMoneyNav({ size = 26, className, active = false, ...rest }: NavIconProps) {
  // Source uses different fills/strokes for the two coins so we describe each pair.
  if (active) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 28 28"
        fill="none"
        role="img"
        className={className}
        {...rest}
      >
        <circle cx="18" cy="15" r="8" fill="#c87b14" stroke="#8a3d0a" strokeWidth="1.5" />
        <circle cx="10" cy="13" r="7.5" fill="#f5b347" stroke="#8a3d0a" strokeWidth="1.5" />
        <path
          d="M7 10 L7 16 M7 10 L11 10 Q13 10 13 12 Q13 14 11 14 L7 14 M5.5 12 L12 12"
          stroke="#fff"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      role="img"
      className={className}
      {...rest}
    >
      <circle cx="18" cy="15" r="8" fill="#fde8c0" stroke="#b06410" strokeWidth="1.5" />
      <circle cx="10" cy="13" r="7.5" fill="#fef3d9" stroke="#b06410" strokeWidth="1.5" />
      <path
        d="M7 10 L7 16 M7 10 L11 10 Q13 10 13 12 Q13 14 11 14 L7 14 M5.5 12 L12 12"
        stroke="#8a3d0a"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
