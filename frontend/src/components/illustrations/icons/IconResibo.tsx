// ============================================================
// IconResibo — Phase 4 brand icon (Receipt scanner / expense capture)
// Source: design_handoff_akbai_redesign/synthesis/repos/icons.html (B4 approved)
// "Has-face" receipt with cream-to-honey gradient, peso accent, soft drop ellipse.
// useId() prevents gradient-id collisions when multiple instances mount on a page.
// ============================================================
import { useId } from 'react';

export type IconProps = {
  size?: number;
  className?: string;
  color?: string;
  'aria-label'?: string;
};

export function IconResibo({ size = 24, className, color, ...rest }: IconProps) {
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
        <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fffbf0" />
          <stop offset="100%" stopColor="#fde8c0" />
        </linearGradient>
      </defs>
      <ellipse cx="30" cy="54" rx="16" ry="2" fill="#c89a3e" opacity="0.22" />
      <path
        d="M16 10 Q16 8 18 8 L42 8 Q44 8 44 10 L44 46 L41 44 L38 46 L35 44 L32 46 L29 44 L26 46 L23 44 L20 46 L17 44 Q16 43 16 42 Z"
        fill={`url(#${gradId})`}
        stroke={color ?? '#b06410'}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M23 22 Q25 20 27 22" stroke="#6d3a08" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M33 22 Q35 20 37 22" stroke="#6d3a08" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M26 28 Q30 31 34 28" stroke="#b0391a" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <line x1="22" y1="36" x2="38" y2="36" stroke="#c89a3e" strokeWidth="1.3" strokeLinecap="round" opacity="0.6" />
      <line x1="22" y1="40" x2="34" y2="40" stroke="#c89a3e" strokeWidth="1.3" strokeLinecap="round" opacity="0.6" />
      <text x="37" y="16" fontSize="6" fontWeight="800" fill="#b06410" opacity="0.7">
        ₱
      </text>
    </svg>
  );
}
