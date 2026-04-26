// ============================================================
// IconPera — Phase 4 brand icon (Money tracker — does triple duty for Pera tab,
// expense tracker home tile, weekly story KPI grid).
// Source: design_handoff_akbai_redesign/synthesis/repos/icons.html (B4 approved).
// Two stacked coins; front coin has face; ₱ on back coin.
// ============================================================
import { useId } from 'react';
import type { IconProps } from './IconResibo';

export function IconPera({ size = 24, className, color, ...rest }: IconProps) {
  const gradId = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      role="img"
      className={className}
      {...rest}
    >
      <defs>
        <radialGradient id={gradId} cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffd97a" />
          <stop offset="100%" stopColor="#c87b14" />
        </radialGradient>
      </defs>
      <ellipse cx="30" cy="54" rx="18" ry="2.2" fill="#c89a3e" opacity="0.25" />
      <circle cx="38" cy="32" r="14" fill={`url(#${gradId})`} stroke={color ?? '#8a4e0a'} strokeWidth="1.5" />
      <text x="38" y="37" textAnchor="middle" fontSize="13" fontWeight="900" fill="#fff8ea">
        ₱
      </text>
      <circle cx="22" cy="28" r="13" fill={`url(#${gradId})`} stroke={color ?? '#8a4e0a'} strokeWidth="1.5" />
      <path d="M17 26 Q19 24 21 26" stroke="#6d3a08" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M23 26 Q25 24 27 26" stroke="#6d3a08" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M19 30 Q22 33 25 30" stroke="#b0391a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}
