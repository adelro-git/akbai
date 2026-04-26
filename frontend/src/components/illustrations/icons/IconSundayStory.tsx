// ============================================================
// IconSundayStory — Phase 4 brand icon (Linggong Kuwento)
// Source: design_handoff_akbai_redesign/synthesis/repos/icons.html (B4 approved)
// Open book with sun on right page. Storytelling metaphor.
// ============================================================
import { useId } from 'react';
import type { IconProps } from './IconResibo';

export function IconSundayStory({ size = 24, className, color, ...rest }: IconProps) {
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
          <stop offset="0%" stopColor="#fff8ea" />
          <stop offset="100%" stopColor="#fde8c0" />
        </linearGradient>
      </defs>
      <ellipse cx="30" cy="54" rx="16" ry="2" fill="#c89a3e" opacity="0.22" />
      <path
        d="M10 18 Q18 14 30 16 Q42 14 50 18 L50 46 Q42 42 30 44 Q18 42 10 46 Z"
        fill={`url(#${gradId})`}
        stroke={color ?? '#b06410'}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <line x1="30" y1="16" x2="30" y2="44" stroke={color ?? '#b06410'} strokeWidth="1.2" />
      <line x1="15" y1="24" x2="26" y2="23" stroke="#c89a3e" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      <line x1="15" y1="28" x2="26" y2="27" stroke="#c89a3e" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      <line x1="15" y1="32" x2="26" y2="31" stroke="#c89a3e" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      <circle cx="38" cy="28" r="5" fill="#f5b347" />
      <g stroke="#e89b2f" strokeWidth="1.2" strokeLinecap="round">
        <line x1="38" y1="20" x2="38" y2="22" />
        <line x1="46" y1="28" x2="44" y2="28" />
        <line x1="32" y1="23" x2="33" y2="25" />
        <line x1="43" y1="23" x2="42" y2="25" />
      </g>
    </svg>
  );
}
