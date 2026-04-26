// ============================================================
// IconInvoice — Phase 4 brand icon (Mga Invoice — utang collection)
// Source: design_handoff_akbai_redesign/synthesis/repos/icons.html (B4 approved)
// Page with folded corner + 3 lines + tiny accent dot.
// ============================================================
import { useId } from 'react';
import type { IconProps } from './IconResibo';

export function IconInvoice({ size = 24, className, color, ...rest }: IconProps) {
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
      <ellipse cx="30" cy="54" rx="15" ry="2" fill="#c89a3e" opacity="0.22" />
      <path
        d="M14 10 L38 10 L46 18 L46 48 Q46 50 44 50 L16 50 Q14 50 14 48 Z"
        fill={`url(#${gradId})`}
        stroke={color ?? '#b06410'}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M38 10 L38 18 L46 18"
        stroke={color ?? '#b06410'}
        strokeWidth="1.6"
        fill="#fde8c0"
        strokeLinejoin="round"
      />
      <line x1="20" y1="28" x2="36" y2="28" stroke="#c89a3e" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20" y1="34" x2="40" y2="34" stroke="#c89a3e" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20" y1="40" x2="32" y2="40" stroke="#c89a3e" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="38" cy="44" r="2" fill="#e89b2f" opacity="0.8" />
    </svg>
  );
}
