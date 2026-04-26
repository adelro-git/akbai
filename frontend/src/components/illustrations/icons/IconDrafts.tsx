// ============================================================
// IconDrafts — Phase 4 brand icon (Mga Draft / drafts list)
// Source: design_handoff_akbai_redesign/synthesis/repos/icons.html (B4 approved)
// Paper + diagonal pencil. Verify pencil legibility at 24px (may shrink to a smudge).
// ============================================================
import { useId } from 'react';
import type { IconProps } from './IconResibo';

export function IconDrafts({ size = 24, className, color, ...rest }: IconProps) {
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
      <rect
        x="14"
        y="14"
        width="30"
        height="36"
        rx="3"
        fill={`url(#${gradId})`}
        stroke={color ?? '#b06410'}
        strokeWidth="1.6"
      />
      <line x1="20" y1="24" x2="38" y2="24" stroke="#c89a3e" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
      <line x1="20" y1="30" x2="36" y2="30" stroke="#c89a3e" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
      <line x1="20" y1="36" x2="32" y2="36" stroke="#c89a3e" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
      <g transform="rotate(-25 42 32)">
        <rect x="40" y="28" width="18" height="5" rx="1" fill="#e89b2f" stroke="#8a4e0a" strokeWidth="1.2" />
        <path d="M58 30.5 L62 30.5 L60 28 Z M58 30.5 L62 30.5 L60 33 Z" fill="#2b2317" />
        <rect x="36" y="28" width="4" height="5" fill="#e57b5f" stroke="#8a4e0a" strokeWidth="1.2" />
      </g>
    </svg>
  );
}
