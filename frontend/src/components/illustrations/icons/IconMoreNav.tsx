// ============================================================
// IconMoreNav — Phase 4 nav icon (bottom-nav More / Iba pa tab)
// Source: design_handoff_akbai_redesign/synthesis/repos/icons.html (B4 approved)
// Three hollow circles. The simplest icon in the set — high recognition.
// ============================================================
import type { NavIconProps } from './IconHomeNav';

export function IconMoreNav({ size = 26, className, active = false, ...rest }: NavIconProps) {
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
      <circle cx="8" cy="14" r="2.2" fill={fill} stroke={stroke} strokeWidth="1.5" />
      <circle cx="14" cy="14" r="2.2" fill={fill} stroke={stroke} strokeWidth="1.5" />
      <circle cx="20" cy="14" r="2.2" fill={fill} stroke={stroke} strokeWidth="1.5" />
    </svg>
  );
}
