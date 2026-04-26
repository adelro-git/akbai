// ============================================================
// IconScanNav — Phase 4 nav icon (bottom-nav Scan tab)
// Source: design_handoff_akbai_redesign/synthesis/repos/icons.html (B4 approved)
// Receipt with zigzag bottom + 2 lines (matches IconResibo metaphor at smaller scale).
// Anton's C2 keeps Scan in the bottom nav; this icon is in scope.
// ============================================================
import type { NavIconProps } from './IconHomeNav';

export function IconScanNav({ size = 26, className, active = false, ...rest }: NavIconProps) {
  const fill = active ? '#f5b347' : '#fef3d9';
  const stroke = active ? '#8a3d0a' : '#b06410';
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
      <path
        d="M8 5 Q8 4 9 4 L19 4 Q20 4 20 5 L20 22 L18.5 21 L17 22 L15.5 21 L14 22 L12.5 21 L11 22 L9.5 21 L8 22 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <line x1="11" y1="11" x2="17" y2="11" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
      <line x1="11" y1="14" x2="15" y2="14" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}
