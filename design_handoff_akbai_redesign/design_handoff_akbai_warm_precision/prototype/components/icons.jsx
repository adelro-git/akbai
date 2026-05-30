/* global React */
// AKBai custom icons — drawn in the illustration vocabulary:
// rounded shapes, honey/cream, soft outlines, some with faces.

const IconResibo = ({ size = 44 }) => (
  <svg width={size} height={size} viewBox="0 0 60 60" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="ir-paper" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fffbf0"/>
        <stop offset="100%" stopColor="#fde8c0"/>
      </linearGradient>
    </defs>
    {/* warm soft shadow */}
    <ellipse cx="30" cy="54" rx="16" ry="2" fill="#c89a3e" opacity="0.22"/>
    {/* receipt paper with zigzag bottom */}
    <path d="M16 10 Q16 8 18 8 L42 8 Q44 8 44 10 L44 46
             L41 44 L38 46 L35 44 L32 46 L29 44 L26 46 L23 44 L20 46 L17 44 Q16 43 16 42 Z"
      fill="url(#ir-paper)" stroke="#b06410" strokeWidth="1.6" strokeLinejoin="round"/>
    {/* small face - friendly */}
    <path d="M23 22 Q25 20 27 22" stroke="#6d3a08" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    <path d="M33 22 Q35 20 37 22" stroke="#6d3a08" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    <path d="M26 28 Q30 31 34 28" stroke="#b0391a" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    {/* lines */}
    <line x1="22" y1="36" x2="38" y2="36" stroke="#c89a3e" strokeWidth="1.3" strokeLinecap="round" opacity="0.6"/>
    <line x1="22" y1="40" x2="34" y2="40" stroke="#c89a3e" strokeWidth="1.3" strokeLinecap="round" opacity="0.6"/>
    {/* peso mark */}
    <text x="37" y="16" fontSize="6" fontWeight="800" fill="#b06410" opacity="0.7">₱</text>
  </svg>
);

const IconUsap = ({ size = 44 }) => (
  <svg width={size} height={size} viewBox="0 0 60 60" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="iu-bubble" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef3d9"/>
        <stop offset="100%" stopColor="#fad88f"/>
      </linearGradient>
    </defs>
    <ellipse cx="30" cy="54" rx="15" ry="2" fill="#c89a3e" opacity="0.2"/>
    {/* speech bubble with tail */}
    <path d="M12 22 Q12 14 20 14 L40 14 Q48 14 48 22 L48 34 Q48 42 40 42 L28 42 L20 50 L22 42 Q12 42 12 34 Z"
      fill="url(#iu-bubble)" stroke="#b06410" strokeWidth="1.6" strokeLinejoin="round"/>
    {/* 3 dots */}
    <circle cx="22" cy="28" r="2.2" fill="#b06410"/>
    <circle cx="30" cy="28" r="2.2" fill="#b06410"/>
    <circle cx="38" cy="28" r="2.2" fill="#b06410"/>
  </svg>
);

const IconPera = ({ size = 44 }) => (
  <svg width={size} height={size} viewBox="0 0 60 60" fill="none" aria-hidden="true">
    <defs>
      <radialGradient id="ip-coin" cx="40%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#ffd97a"/>
        <stop offset="100%" stopColor="#c87b14"/>
      </radialGradient>
    </defs>
    <ellipse cx="30" cy="54" rx="18" ry="2.2" fill="#c89a3e" opacity="0.25"/>
    {/* back coin */}
    <circle cx="38" cy="32" r="14" fill="url(#ip-coin)" stroke="#8a4e0a" strokeWidth="1.5"/>
    <text x="38" y="37" textAnchor="middle" fontSize="13" fontWeight="900" fill="#fff8ea">₱</text>
    {/* front coin with face */}
    <circle cx="22" cy="28" r="13" fill="url(#ip-coin)" stroke="#8a4e0a" strokeWidth="1.5"/>
    <path d="M17 26 Q19 24 21 26" stroke="#6d3a08" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
    <path d="M23 26 Q25 24 27 26" stroke="#6d3a08" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
    <path d="M19 30 Q22 33 25 30" stroke="#b0391a" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
  </svg>
);

const IconKalendaryo = ({ size = 44 }) => (
  <svg width={size} height={size} viewBox="0 0 60 60" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="ik-paper" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fff8ea"/>
        <stop offset="100%" stopColor="#fde8c0"/>
      </linearGradient>
    </defs>
    <ellipse cx="30" cy="54" rx="16" ry="2" fill="#c89a3e" opacity="0.22"/>
    {/* calendar body */}
    <rect x="12" y="14" width="36" height="34" rx="5" fill="url(#ik-paper)" stroke="#b06410" strokeWidth="1.6"/>
    {/* header band */}
    <path d="M12 19 Q12 14 17 14 L43 14 Q48 14 48 19 L48 22 L12 22 Z" fill="#e89b2f"/>
    {/* rings */}
    <rect x="18" y="10" width="3" height="8" rx="1.5" fill="#8a4e0a"/>
    <rect x="39" y="10" width="3" height="8" rx="1.5" fill="#8a4e0a"/>
    {/* date circle with sun peeking */}
    <circle cx="30" cy="35" r="9" fill="#fef3d9" stroke="#e89b2f" strokeWidth="1.4"/>
    {/* sun rays */}
    <g stroke="#e89b2f" strokeWidth="1.2" strokeLinecap="round">
      <line x1="30" y1="23" x2="30" y2="25"/>
      <line x1="42" y1="35" x2="40" y2="35"/>
      <line x1="20" y1="35" x2="18" y2="35"/>
    </g>
    <text x="30" y="38" textAnchor="middle" fontSize="10" fontWeight="800" fill="#8a3d0a">25</text>
  </svg>
);

const IconPrecio = ({ size = 44 }) => (
  <svg width={size} height={size} viewBox="0 0 60 60" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="ipr-tag" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f5b347"/>
        <stop offset="100%" stopColor="#c87b14"/>
      </linearGradient>
    </defs>
    <ellipse cx="30" cy="54" rx="15" ry="2" fill="#c89a3e" opacity="0.22"/>
    {/* price tag */}
    <path d="M14 18 L34 14 Q38 13 41 16 L48 23 Q51 26 50 30 L46 50 Q45 54 41 54 Q37 55 34 52 L17 35 Q14 32 14 28 Z"
      fill="url(#ipr-tag)" stroke="#8a4e0a" strokeWidth="1.6" strokeLinejoin="round"/>
    {/* hole */}
    <circle cx="22" cy="25" r="3" fill="#fef3d9" stroke="#8a4e0a" strokeWidth="1.4"/>
    {/* peso mark */}
    <text x="36" y="36" textAnchor="middle" fontSize="14" fontWeight="900" fill="white">₱</text>
  </svg>
);

const IconInvoice = ({ size = 44 }) => (
  <svg width={size} height={size} viewBox="0 0 60 60" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="ii-paper" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fffbf0"/>
        <stop offset="100%" stopColor="#fde8c0"/>
      </linearGradient>
    </defs>
    <ellipse cx="30" cy="54" rx="15" ry="2" fill="#c89a3e" opacity="0.22"/>
    {/* page with folded corner */}
    <path d="M14 10 L38 10 L46 18 L46 48 Q46 50 44 50 L16 50 Q14 50 14 48 Z"
      fill="url(#ii-paper)" stroke="#b06410" strokeWidth="1.6" strokeLinejoin="round"/>
    <path d="M38 10 L38 18 L46 18" stroke="#b06410" strokeWidth="1.6" fill="#fde8c0" strokeLinejoin="round"/>
    {/* lines */}
    <line x1="20" y1="28" x2="36" y2="28" stroke="#c89a3e" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="20" y1="34" x2="40" y2="34" stroke="#c89a3e" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="20" y1="40" x2="32" y2="40" stroke="#c89a3e" strokeWidth="1.5" strokeLinecap="round"/>
    {/* sampaguita flourish */}
    <circle cx="38" cy="44" r="2" fill="#e89b2f" opacity="0.8"/>
  </svg>
);

const IconCheckin = ({ size = 44 }) => (
  <svg width={size} height={size} viewBox="0 0 60 60" fill="none" aria-hidden="true">
    <defs>
      <radialGradient id="ic-cup" cx="40%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#fff8ea"/>
        <stop offset="100%" stopColor="#f0d99a"/>
      </radialGradient>
    </defs>
    {/* steam */}
    <path d="M26 12 Q24 10 26 7 Q28 5 26 2" stroke="#d6c8a8" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.7" className="steam-1"/>
    <path d="M32 12 Q30 10 32 7 Q34 5 32 2" stroke="#d6c8a8" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.7" className="steam-2"/>
    <ellipse cx="30" cy="54" rx="15" ry="2" fill="#c89a3e" opacity="0.22"/>
    {/* cup body */}
    <path d="M14 20 L46 20 L44 46 Q44 50 40 50 L20 50 Q16 50 16 46 Z"
      fill="url(#ic-cup)" stroke="#b06410" strokeWidth="1.6" strokeLinejoin="round"/>
    {/* coffee surface */}
    <ellipse cx="30" cy="22" rx="15" ry="3" fill="#8a4e0a"/>
    <ellipse cx="30" cy="21" rx="12" ry="2" fill="#b06410" opacity="0.6"/>
    {/* handle */}
    <path d="M46 26 Q54 28 54 34 Q54 40 46 40" stroke="#b06410" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
    {/* heart on cup */}
    <path d="M28 36 Q26 34 24 36 Q22 38 25 40 L28 43 L31 40 Q34 38 32 36 Q30 34 28 36 Z" fill="#c87b14" opacity="0.7"/>
  </svg>
);

const IconSundayStory = ({ size = 44 }) => (
  <svg width={size} height={size} viewBox="0 0 60 60" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="is-book" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fff8ea"/>
        <stop offset="100%" stopColor="#fde8c0"/>
      </linearGradient>
    </defs>
    <ellipse cx="30" cy="54" rx="16" ry="2" fill="#c89a3e" opacity="0.22"/>
    {/* book open */}
    <path d="M10 18 Q18 14 30 16 Q42 14 50 18 L50 46 Q42 42 30 44 Q18 42 10 46 Z"
      fill="url(#is-book)" stroke="#b06410" strokeWidth="1.6" strokeLinejoin="round"/>
    {/* spine */}
    <line x1="30" y1="16" x2="30" y2="44" stroke="#b06410" strokeWidth="1.2"/>
    {/* page lines left */}
    <line x1="15" y1="24" x2="26" y2="23" stroke="#c89a3e" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/>
    <line x1="15" y1="28" x2="26" y2="27" stroke="#c89a3e" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/>
    <line x1="15" y1="32" x2="26" y2="31" stroke="#c89a3e" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/>
    {/* sun on right */}
    <circle cx="38" cy="28" r="5" fill="#f5b347"/>
    <g stroke="#e89b2f" strokeWidth="1.2" strokeLinecap="round">
      <line x1="38" y1="20" x2="38" y2="22"/>
      <line x1="46" y1="28" x2="44" y2="28"/>
      <line x1="32" y1="23" x2="33" y2="25"/>
      <line x1="43" y1="23" x2="42" y2="25"/>
    </g>
  </svg>
);

const IconDrafts = ({ size = 44 }) => (
  <svg width={size} height={size} viewBox="0 0 60 60" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="id-paper" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fffbf0"/>
        <stop offset="100%" stopColor="#fde8c0"/>
      </linearGradient>
    </defs>
    <ellipse cx="30" cy="54" rx="16" ry="2" fill="#c89a3e" opacity="0.22"/>
    <rect x="14" y="14" width="30" height="36" rx="3" fill="url(#id-paper)" stroke="#b06410" strokeWidth="1.6"/>
    <line x1="20" y1="24" x2="38" y2="24" stroke="#c89a3e" strokeWidth="1.4" strokeLinecap="round" opacity="0.6"/>
    <line x1="20" y1="30" x2="36" y2="30" stroke="#c89a3e" strokeWidth="1.4" strokeLinecap="round" opacity="0.6"/>
    <line x1="20" y1="36" x2="32" y2="36" stroke="#c89a3e" strokeWidth="1.4" strokeLinecap="round" opacity="0.6"/>
    {/* pencil on top */}
    <g transform="rotate(-25 42 32)">
      <rect x="40" y="28" width="18" height="5" rx="1" fill="#e89b2f" stroke="#8a4e0a" strokeWidth="1.2"/>
      <path d="M58 30.5 L62 30.5 L60 28 Z M58 30.5 L62 30.5 L60 33 Z" fill="#2b2317"/>
      <rect x="36" y="28" width="4" height="5" fill="#e57b5f" stroke="#8a4e0a" strokeWidth="1.2"/>
    </g>
  </svg>
);

// ───── Compact nav icons — match illustration style but smaller ─────
const NavIconHome = ({ active }) => (
  <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
    <path d="M5 13 L14 5 L23 13 L23 22 Q23 23 22 23 L17 23 L17 17 L11 17 L11 23 L6 23 Q5 23 5 22 Z"
      fill={active ? '#f5b347' : '#fef3d9'}
      stroke={active ? '#8a3d0a' : '#b06410'} strokeWidth="1.6" strokeLinejoin="round"/>
    <circle cx="14" cy="10" r="1.2" fill={active ? '#8a3d0a' : '#b06410'} opacity="0.6"/>
  </svg>
);

const NavIconChat = ({ active }) => (
  <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
    <path d="M5 10 Q5 5 10 5 L18 5 Q23 5 23 10 L23 16 Q23 21 18 21 L13 21 L9 24 L10 21 Q5 21 5 16 Z"
      fill={active ? '#f5b347' : '#fef3d9'}
      stroke={active ? '#8a3d0a' : '#b06410'} strokeWidth="1.6" strokeLinejoin="round"/>
    <circle cx="10" cy="13" r="1.3" fill={active ? '#8a3d0a' : '#b06410'}/>
    <circle cx="14" cy="13" r="1.3" fill={active ? '#8a3d0a' : '#b06410'}/>
    <circle cx="18" cy="13" r="1.3" fill={active ? '#8a3d0a' : '#b06410'}/>
  </svg>
);

const NavIconScan = ({ active }) => (
  <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
    <path d="M8 5 Q8 4 9 4 L19 4 Q20 4 20 5 L20 22 L18.5 21 L17 22 L15.5 21 L14 22 L12.5 21 L11 22 L9.5 21 L8 22 Z"
      fill={active ? '#f5b347' : '#fef3d9'}
      stroke={active ? '#8a3d0a' : '#b06410'} strokeWidth="1.6" strokeLinejoin="round"/>
    <line x1="11" y1="11" x2="17" y2="11" stroke={active ? '#8a3d0a' : '#b06410'} strokeWidth="1.3" strokeLinecap="round" opacity="0.7"/>
    <line x1="11" y1="14" x2="15" y2="14" stroke={active ? '#8a3d0a' : '#b06410'} strokeWidth="1.3" strokeLinecap="round" opacity="0.7"/>
  </svg>
);

const NavIconMoney = ({ active }) => (
  <svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden="true">
    <circle cx="18" cy="15" r="8" fill={active ? '#c87b14' : '#fde8c0'} stroke={active ? '#8a3d0a' : '#b06410'} strokeWidth="1.5"/>
    <circle cx="10" cy="13" r="7.5" fill={active ? '#f5b347' : '#fef3d9'} stroke={active ? '#8a3d0a' : '#b06410'} strokeWidth="1.5"/>
    {/* peso-like glyph drawn as path (no <text> — avoids leaking to innerText) */}
    <path d="M7 10 L7 16 M7 10 L11 10 Q13 10 13 12 Q13 14 11 14 L7 14 M5.5 12 L12 12"
      stroke={active ? '#fff' : '#8a3d0a'} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
  </svg>
);

const NavIconMore = ({ active }) => (
  <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
    <circle cx="8" cy="14" r="2.2" fill={active ? '#f5b347' : '#fef3d9'} stroke={active ? '#8a3d0a' : '#b06410'} strokeWidth="1.5"/>
    <circle cx="14" cy="14" r="2.2" fill={active ? '#f5b347' : '#fef3d9'} stroke={active ? '#8a3d0a' : '#b06410'} strokeWidth="1.5"/>
    <circle cx="20" cy="14" r="2.2" fill={active ? '#f5b347' : '#fef3d9'} stroke={active ? '#8a3d0a' : '#b06410'} strokeWidth="1.5"/>
  </svg>
);

// Sampaguita decoration — tiny five-petal flower
const Sampaguita = ({ size = 16, color = '#ffffff' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    {[0, 72, 144, 216, 288].map(deg => (
      <ellipse key={deg} cx="10" cy="5" rx="2.8" ry="4" fill={color}
        transform={`rotate(${deg} 10 10)`}/>
    ))}
    <circle cx="10" cy="10" r="1.6" fill="#f5b347"/>
  </svg>
);

// Capiz window pattern — background SVG
const CapizPattern = () => (
  <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.35 }}>
    <defs>
      <pattern id="capiz" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
        <rect width="60" height="60" fill="transparent"/>
        <rect x="6" y="6" width="22" height="22" rx="3" fill="#fef3d9" stroke="#f0be6a" strokeWidth="0.8" opacity="0.6"/>
        <rect x="32" y="6" width="22" height="22" rx="3" fill="#fdf5e2" stroke="#f0be6a" strokeWidth="0.8" opacity="0.5"/>
        <rect x="6" y="32" width="22" height="22" rx="3" fill="#fdf5e2" stroke="#f0be6a" strokeWidth="0.8" opacity="0.5"/>
        <rect x="32" y="32" width="22" height="22" rx="3" fill="#fef3d9" stroke="#f0be6a" strokeWidth="0.8" opacity="0.6"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#capiz)"/>
  </svg>
);

// Swaying leaf decoration
const SwayingLeaf = ({ style = {} }) => (
  <svg width="60" height="80" viewBox="0 0 60 80" className="leaf-sway" style={style}>
    <path d="M30 78 Q30 50 30 30" stroke="#5a7d62" strokeWidth="2" strokeLinecap="round"/>
    <path d="M30 50 Q18 42 16 30 Q28 36 30 45 Z" fill="#97b39d"/>
    <path d="M30 42 Q42 34 44 22 Q32 28 30 37 Z" fill="#b7c9ba"/>
    <path d="M30 34 Q20 26 18 16 Q28 22 30 30 Z" fill="#97b39d" opacity="0.85"/>
  </svg>
);

Object.assign(window, {
  IconResibo, IconUsap, IconPera, IconKalendaryo, IconPrecio,
  IconInvoice, IconCheckin, IconSundayStory, IconDrafts,
  NavIconHome, NavIconChat, NavIconScan, NavIconMoney, NavIconMore,
  Sampaguita, CapizPattern, SwayingLeaf,
});
