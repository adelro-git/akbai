// ============================================================
// IconChatNav — Phase 4 nav icon (bottom-nav Chat / Kausap tab)
// Source: design_handoff_akbai_redesign/synthesis/repos/icons.html (B4 approved)
// Speech bubble + 3 typing dots — same metaphor as IconUsap, simplified.
// ============================================================
import type { NavIconProps } from './IconHomeNav';

export function IconChatNav({ size = 26, className, active = false, ...rest }: NavIconProps) {
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
        d="M5 10 Q5 5 10 5 L18 5 Q23 5 23 10 L23 16 Q23 21 18 21 L13 21 L9 24 L10 21 Q5 21 5 16 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="13" r="1.3" fill={stroke} />
      <circle cx="14" cy="13" r="1.3" fill={stroke} />
      <circle cx="18" cy="13" r="1.3" fill={stroke} />
    </svg>
  );
}
