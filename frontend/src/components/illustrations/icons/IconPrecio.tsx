// ============================================================
// IconPrecio — Phase 4 brand icon (Tamang Presyo / Costing)
// Source: design_handoff_akbai_redesign/synthesis/repos/icons.html (B4 approved)
// Solid honey-gradient price tag with hole + ₱. Strongest identity in the icon set.
// ============================================================
import { useId } from 'react';
import type { IconProps } from './IconResibo';

export function IconPrecio({ size = 24, className, color, ...rest }: IconProps) {
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
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f5b347" />
          <stop offset="100%" stopColor="#c87b14" />
        </linearGradient>
      </defs>
      <ellipse cx="30" cy="54" rx="15" ry="2" fill="#c89a3e" opacity="0.22" />
      <path
        d="M14 18 L34 14 Q38 13 41 16 L48 23 Q51 26 50 30 L46 50 Q45 54 41 54 Q37 55 34 52 L17 35 Q14 32 14 28 Z"
        fill={`url(#${gradId})`}
        stroke={color ?? '#8a4e0a'}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="22" cy="25" r="3" fill="#fef3d9" stroke={color ?? '#8a4e0a'} strokeWidth="1.4" />
      <text x="36" y="36" textAnchor="middle" fontSize="14" fontWeight="900" fill="white">
        ₱
      </text>
    </svg>
  );
}
