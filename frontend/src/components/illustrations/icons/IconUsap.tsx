// ============================================================
// IconUsap — Phase 4 brand icon (Chat / Kausap with Kai)
// Source: design_handoff_akbai_redesign/synthesis/repos/icons.html (B4 approved)
// Speech bubble with tail + 3 typing dots, honey-cream-to-honey diagonal gradient.
// ============================================================
import { useId } from 'react';
import type { IconProps } from './IconResibo';

export function IconUsap({ size = 24, className, color, ...rest }: IconProps) {
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
          <stop offset="0%" stopColor="#fef3d9" />
          <stop offset="100%" stopColor="#fad88f" />
        </linearGradient>
      </defs>
      <ellipse cx="30" cy="54" rx="15" ry="2" fill="#c89a3e" opacity="0.2" />
      <path
        d="M12 22 Q12 14 20 14 L40 14 Q48 14 48 22 L48 34 Q48 42 40 42 L28 42 L20 50 L22 42 Q12 42 12 34 Z"
        fill={`url(#${gradId})`}
        stroke={color ?? '#b06410'}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="22" cy="28" r="2.2" fill="#b06410" />
      <circle cx="30" cy="28" r="2.2" fill="#b06410" />
      <circle cx="38" cy="28" r="2.2" fill="#b06410" />
    </svg>
  );
}
