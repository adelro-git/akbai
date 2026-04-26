/* global React */
// Kai — AKBai mascot. Illustration-native: big round cream-white face,
// chunky honey swoosh hair, grey crescent moon behind, closed-arc smile eyes.

const KAI_COLORS = {
  face: '#fff8ea',
  faceDeep: '#fde3b8',
  hair: '#e89b2f',
  hairLight: '#f5b347',
  hairDark: '#b06410',
  grey: '#d0cac0',
  greyDark: '#a69f92',
  outline: '#8a4e0a',
  smile: '#6d3a08',
  cheek: '#f5a87a',
  sparkle: '#fbbf24',
  mouth: '#b0391a',
};

function Kai({ size = 64, expression = 'happy', glow = false, animated = true, style = {} }) {
  const s = size;
  const uid = React.useId ? React.useId() : Math.random().toString(36).slice(2, 8);
  return (
    <div style={{ position: 'relative', width: s, height: s, ...style }}>
      {glow && (
        <div style={{
          position: 'absolute', inset: -s * 0.35,
          background: `radial-gradient(circle, rgba(245,179,71,0.28) 0%, transparent 65%)`,
          pointerEvents: 'none', borderRadius: '50%',
        }} />
      )}
      <svg
        width={s} height={s} viewBox="0 0 120 120" fill="none"
        className={animated ? 'kai-breathe' : ''}
        style={{ position: 'relative', display: 'block', overflow: 'visible' }}
      >
        <defs>
          <radialGradient id={`kFace-${uid}`} cx="42%" cy="36%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor={KAI_COLORS.face} />
            <stop offset="100%" stopColor={KAI_COLORS.faceDeep} />
          </radialGradient>
          <linearGradient id={`kHair-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={KAI_COLORS.hairLight} />
            <stop offset="60%" stopColor={KAI_COLORS.hair} />
            <stop offset="100%" stopColor={KAI_COLORS.hairDark} />
          </linearGradient>
          <linearGradient id={`kGrey-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e0dbd1" />
            <stop offset="100%" stopColor={KAI_COLORS.greyDark} />
          </linearGradient>
        </defs>

        {/* Grey moon crescent — BEHIND, right side */}
        <path
          d="M72 22 Q104 28 104 62 Q104 96 72 102 Q92 92 92 62 Q92 32 72 22 Z"
          fill={`url(#kGrey-${uid})`}
        />

        {/* Honey swoosh — chunky C-shape wrapping around left */}
        <path
          d="M56 10 Q20 14 14 50 Q10 78 30 96 Q40 102 48 102
             Q32 96 26 78 Q20 58 30 38 Q40 22 58 20 Q72 20 78 30
             Q72 14 56 10 Z"
          fill={`url(#kHair-${uid})`}
        />

        {/* Face — big round cream blob, slightly offset left */}
        <ellipse
          cx="58" cy="62" rx="30" ry="30"
          fill={`url(#kFace-${uid})`}
          stroke={KAI_COLORS.outline}
          strokeWidth="1"
          strokeOpacity="0.25"
        />

        {/* Eyes — CLOSED-ARC SMILE like the illustrations (ᵕ‿ᵕ) */}
        {expression === 'sleepy' ? (
          <>
            <path d="M44 62 Q48 65 52 62" stroke={KAI_COLORS.smile} strokeWidth="2.6" strokeLinecap="round" fill="none"/>
            <path d="M62 62 Q66 65 70 62" stroke={KAI_COLORS.smile} strokeWidth="2.6" strokeLinecap="round" fill="none"/>
          </>
        ) : expression === 'thinking' ? (
          <>
            <circle cx="46" cy="60" r="2.4" fill={KAI_COLORS.smile}/>
            <path d="M60 60 Q66 56 70 60" stroke={KAI_COLORS.smile} strokeWidth="3" strokeLinecap="round" fill="none"/>
          </>
        ) : expression === 'wow' ? (
          <>
            <circle cx="46" cy="60" r="3.4" fill={KAI_COLORS.smile}/>
            <circle cx="68" cy="60" r="3.4" fill={KAI_COLORS.smile}/>
            <circle cx="47" cy="59" r="1.1" fill="white"/>
            <circle cx="69" cy="59" r="1.1" fill="white"/>
          </>
        ) : (
          // Default happy/celebrate — closed smile-arc eyes
          <>
            <path d="M40 60 Q46 53 52 60" stroke={KAI_COLORS.smile} strokeWidth="3" strokeLinecap="round" fill="none"/>
            <path d="M62 60 Q68 53 74 60" stroke={KAI_COLORS.smile} strokeWidth="3" strokeLinecap="round" fill="none"/>
          </>
        )}

        {/* Mouth — open smile with tongue (like illustration) */}
        {expression === 'celebrate' ? (
          <g>
            <path d="M46 72 Q58 84 70 72 Q66 78 58 78 Q50 78 46 72 Z" fill={KAI_COLORS.mouth}/>
            <ellipse cx="58" cy="78" rx="4" ry="2.2" fill="#e06a5a"/>
          </g>
        ) : expression === 'wow' ? (
          <ellipse cx="58" cy="76" rx="4.5" ry="4" fill={KAI_COLORS.mouth}/>
        ) : expression === 'thinking' ? (
          <path d="M52 74 L64 74" stroke={KAI_COLORS.smile} strokeWidth="2.6" strokeLinecap="round"/>
        ) : (
          // Happy — small mouth with tongue hint
          <g>
            <path d="M48 72 Q58 80 68 72 Q64 76 58 76 Q52 76 48 72 Z" fill={KAI_COLORS.mouth}/>
            <ellipse cx="58" cy="75" rx="3" ry="1.4" fill="#e57b5f" opacity="0.9"/>
          </g>
        )}

        {/* Cheek blush */}
        <circle cx="38" cy="70" r="4" fill={KAI_COLORS.cheek} opacity="0.45"/>
        <circle cx="78" cy="70" r="4" fill={KAI_COLORS.cheek} opacity="0.45"/>

        {/* Sparkles for celebrate */}
        {expression === 'celebrate' && (
          <>
            <path d="M98 20 L100 26 L106 28 L100 30 L98 36 L96 30 L90 28 L96 26 Z" fill={KAI_COLORS.sparkle}/>
            <circle cx="16" cy="30" r="2" fill={KAI_COLORS.sparkle}/>
            <path d="M108 72 L109 75 L112 76 L109 77 L108 80 L107 77 L104 76 L107 75 Z" fill="#fde68a"/>
            <circle cx="8" cy="86" r="1.6" fill={KAI_COLORS.sparkle}/>
          </>
        )}
      </svg>
    </div>
  );
}

// Kai hero — larger with sunburst halo
function KaiHero({ size = 170, expression = 'happy', sparkles = true }) {
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      {sparkles && (
        <svg width={size * 1.75} height={size * 1.75} viewBox="0 0 200 200" style={{
          position: 'absolute', top: -size * 0.375, left: -size * 0.375,
          pointerEvents: 'none',
        }}>
          <g stroke="#f5b347" strokeWidth="1.8" strokeLinecap="round" opacity="0.5">
            {Array.from({ length: 18 }).map((_, i) => {
              const a = (i / 18) * Math.PI * 2;
              const r1 = 72, r2 = 90;
              const x1 = 100 + Math.cos(a) * r1, y1 = 100 + Math.sin(a) * r1;
              const x2 = 100 + Math.cos(a) * r2, y2 = 100 + Math.sin(a) * r2;
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}/>;
            })}
          </g>
          <path d="M160 50 l1.3 3.5 l3.5 1.3 l-3.5 1.3 l-1.3 3.5 l-1.3 -3.5 l-3.5 -1.3 l3.5 -1.3 z" fill="#e89b2f" opacity="0.75"/>
          <circle cx="38" cy="60" r="1.8" fill="#e89b2f" opacity="0.7"/>
          <path d="M44 150 l0.8 2.3 l2.3 0.8 l-2.3 0.8 l-0.8 2.3 l-0.8 -2.3 l-2.3 -0.8 l2.3 -0.8 z" fill="#e89b2f" opacity="0.75"/>
          <circle cx="160" cy="148" r="1.4" fill="#e89b2f" opacity="0.7"/>
        </svg>
      )}
      <div className="kai-float" style={{ width: size, height: size }}>
        <Kai size={size} expression={expression} glow animated/>
      </div>
    </div>
  );
}

// Kai message bubble
function KaiBubble({ children, time, tone = 'default' }) {
  const bg = tone === 'celebrate' ? '#fef3d9'
    : tone === 'concern' ? '#feeedd'
    : '#ffffff';
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', maxWidth: '88%' }}>
      <div style={{ flexShrink: 0, marginBottom: 2 }}>
        <Kai size={38} expression={tone === 'celebrate' ? 'celebrate' : 'happy'} animated={false}/>
      </div>
      <div style={{
        background: bg,
        padding: '12px 16px',
        borderRadius: '22px 22px 22px 6px',
        boxShadow: '0 1px 2px rgba(43,35,23,0.05)',
        border: '1.5px solid #efe3c8',
      }}>
        <div style={{ fontSize: 14.5, lineHeight: 1.5, color: 'var(--ink)' }}>
          {children}
        </div>
        {time && <div style={{ fontSize: 10.5, color: 'var(--ink-faint)', marginTop: 4 }}>{time}</div>}
      </div>
    </div>
  );
}

function UserBubble({ children, time }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
      <div style={{ maxWidth: '82%' }}>
        <div style={{
          background: '#f5b347',
          color: '#2a1c08',
          padding: '11px 15px',
          borderRadius: '22px 22px 6px 22px',
          fontSize: 14.5, lineHeight: 1.45, fontWeight: 600,
          boxShadow: '0 2px 0 #c87b14',
        }}>
          {children}
        </div>
        {time && <div style={{ fontSize: 10.5, color: 'var(--ink-faint)', marginTop: 3, textAlign: 'right' }}>{time}</div>}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
      <Kai size={38} expression="thinking" animated={false}/>
      <div style={{
        background: '#ffffff',
        padding: '14px 18px',
        borderRadius: '22px 22px 22px 6px',
        border: '1.5px solid #efe3c8',
      }}>
        <span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/>
      </div>
    </div>
  );
}

// AmbientKai — small floating Kai button that pops a thought
function AmbientKai({ state = 'idle', thought, onTap }) {
  return (
    <button onClick={onTap} style={{
      position: 'fixed', right: 20, bottom: 20, zIndex: 50,
      display: 'flex', alignItems: 'flex-end', gap: 8,
      background: 'transparent', padding: 0,
    }}>
      {thought && (
        <div className="pop-in" style={{
          background: 'white', border: '1.5px solid #efe3c8',
          padding: '8px 12px', borderRadius: '14px 14px 6px 14px',
          fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)',
          maxWidth: 220, boxShadow: '0 4px 12px rgba(168,120,40,0.15)',
        }}>
          {thought}
        </div>
      )}
      <div style={{
        background: 'white', borderRadius: '50%',
        padding: 4, boxShadow: '0 6px 16px rgba(168,120,40,0.25)',
        border: '2px solid #fef3d9',
      }}>
        <Kai size={48} expression={state === 'thinking' ? 'thinking' : 'happy'} animated/>
      </div>
    </button>
  );
}

Object.assign(window, { Kai, KaiHero, KaiBubble, UserBubble, TypingBubble, AmbientKai, KAI_COLORS });
