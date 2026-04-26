// ============================================================
// IconCheckin — Phase 4 brand icon (Daily Check-in modal trigger)
// Source: design_handoff_akbai_redesign/synthesis/repos/icons.html (B4 approved)
// Coffee cup with steam + heart on cup + handle. Steam strokes are animation-ready.
// ============================================================
import { useId } from 'react';
import type { IconProps } from './IconResibo';

export function IconCheckin({ size = 24, className, color, ...rest }: IconProps) {
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
        <radialGradient id={gradId} cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fff8ea" />
          <stop offset="100%" stopColor="#f0d99a" />
        </radialGradient>
      </defs>
      <path
        d="M26 12 Q24 10 26 7 Q28 5 26 2"
        stroke="#d6c8a8"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
      <path
        d="M32 12 Q30 10 32 7 Q34 5 32 2"
        stroke="#d6c8a8"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
      <ellipse cx="30" cy="54" rx="15" ry="2" fill="#c89a3e" opacity="0.22" />
      <path
        d="M14 20 L46 20 L44 46 Q44 50 40 50 L20 50 Q16 50 16 46 Z"
        fill={`url(#${gradId})`}
        stroke={color ?? '#b06410'}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <ellipse cx="30" cy="22" rx="15" ry="3" fill="#8a4e0a" />
      <ellipse cx="30" cy="21" rx="12" ry="2" fill="#b06410" opacity="0.6" />
      <path
        d="M46 26 Q54 28 54 34 Q54 40 46 40"
        stroke={color ?? '#b06410'}
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M28 36 Q26 34 24 36 Q22 38 25 40 L28 43 L31 40 Q34 38 32 36 Q30 34 28 36 Z"
        fill="#c87b14"
        opacity="0.7"
      />
    </svg>
  );
}
