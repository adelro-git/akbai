// ============================================================
// IconKalendaryo — Phase 4 brand icon (BIR Deadlines / Calendar)
// Source: design_handoff_akbai_redesign/synthesis/repos/icons.html (B4 approved)
// Calendar with orange header band + sun rays around date circle.
// Note: source hardcodes "25" — kept as default and exposed via `day` prop.
// ============================================================
import { useId } from 'react';

export type IconKalendaryoProps = {
  size?: number;
  className?: string;
  color?: string;
  /** Numeric date displayed on the page (1-31). Defaults to 25 (matches source repo). */
  day?: number;
  'aria-label'?: string;
};

export function IconKalendaryo({
  size = 24,
  className,
  color,
  day = 25,
  ...rest
}: IconKalendaryoProps) {
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
      <rect
        x="12"
        y="14"
        width="36"
        height="34"
        rx="5"
        fill={`url(#${gradId})`}
        stroke={color ?? '#b06410'}
        strokeWidth="1.6"
      />
      <path d="M12 19 Q12 14 17 14 L43 14 Q48 14 48 19 L48 22 L12 22 Z" fill="#e89b2f" />
      <rect x="18" y="10" width="3" height="8" rx="1.5" fill="#8a4e0a" />
      <rect x="39" y="10" width="3" height="8" rx="1.5" fill="#8a4e0a" />
      <circle cx="30" cy="35" r="9" fill="#fef3d9" stroke="#e89b2f" strokeWidth="1.4" />
      <g stroke="#e89b2f" strokeWidth="1.2" strokeLinecap="round">
        <line x1="30" y1="23" x2="30" y2="25" />
        <line x1="42" y1="35" x2="40" y2="35" />
        <line x1="20" y1="35" x2="18" y2="35" />
        <line x1="32" y1="23" x2="33" y2="25" />
        <line x1="43" y1="23" x2="42" y2="25" />
      </g>
      <text x="30" y="38" textAnchor="middle" fontSize="10" fontWeight="800" fill="#8a3d0a">
        {day}
      </text>
    </svg>
  );
}
