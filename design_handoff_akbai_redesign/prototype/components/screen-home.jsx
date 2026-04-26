/* global React, Kai, KaiHero, PERSONAS, COPY, formatPeso, pesoShort, WEEK_DATA,
   IconResibo, IconUsap, IconPera, IconKalendaryo, IconPrecio, IconInvoice,
   Sampaguita, CapizPattern, SwayingLeaf */
// Inclusive woven divider — replaces sampaguita garland (was too feminine).
// Uses banig-weave dashes, a neutral textile motif anyone connects with.
function WovenDivider() {
  return (
    <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 0', opacity: 0.55 }}>
      <svg width="100%" height="10" viewBox="0 0 400 10" preserveAspectRatio="none">
        <g stroke="#b06410" strokeWidth="1.2" strokeLinecap="round" opacity="0.55">
          {Array.from({ length: 32 }).map((_, i) => {
            const x = 6 + i * 12.3;
            const up = i % 2 === 0;
            return <line key={i} x1={x} y1={up ? 2 : 8} x2={x + 7} y2={up ? 8 : 2}/>;
          })}
        </g>
      </svg>
    </div>
  );
}
const { useMemo: useMemoHome } = React;

// ═══════════════════════════════════════════════════════════
//   KAI MARK — the actual brand logo PNG
//   (faithful: orange swoosh + grey crescent encircling smiling face)
// ═══════════════════════════════════════════════════════════
function KaiSitting({ size = 160 }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      overflow: 'hidden',
      filter: 'drop-shadow(0 4px 14px rgba(168,120,40,0.22))',
    }}>
      <img
        src="assets/kai-mark.png"
        alt="Kai"
        width={size}
        height={size}
        style={{
          display: 'block',
          width: size,
          height: size,
          objectFit: 'contain',
        }}
      />
    </div>
  );
}

// Sunburst rays — slow rotation behind Kai
function Sunburst({ size = 320 }) {
  const rays = Array.from({ length: 24 });
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" className="sun-slow"
         style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <g stroke="#f5b347" strokeWidth="2.2" strokeLinecap="round" opacity="0.45">
        {rays.map((_, i) => {
          const a = (i / rays.length) * Math.PI * 2;
          const r1 = 65, r2 = i % 2 === 0 ? 88 : 78;
          const x1 = 100 + Math.cos(a) * r1, y1 = 100 + Math.sin(a) * r1;
          const x2 = 100 + Math.cos(a) * r2, y2 = 100 + Math.sin(a) * r2;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}/>;
        })}
      </g>
      {/* Sparkle decorations around */}
      <path d="M170 40 l1.5 4 l4 1.5 l-4 1.5 l-1.5 4 l-1.5 -4 l-4 -1.5 l4 -1.5 z" fill="#e89b2f" opacity="0.7"/>
      <path d="M30 150 l1 3 l3 1 l-3 1 l-1 3 l-1 -3 l-3 -1 l3 -1 z" fill="#e89b2f" opacity="0.7"/>
      <circle cx="36" cy="42" r="2" fill="#e89b2f" opacity="0.7"/>
      <circle cx="172" cy="158" r="1.6" fill="#e89b2f" opacity="0.7"/>
    </svg>
  );
}

// Hand-drawn squiggly underline (replaces a CSS bottom border)
function Squiggle({ width = 80, color = '#e89b2f', strokeWidth = 2.2 }) {
  return (
    <svg width={width} height="8" viewBox="0 0 80 8" style={{ display: 'block' }}>
      <path d="M2 5 Q12 1 22 5 T42 5 T62 5 T78 5"
            stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round"/>
    </svg>
  );
}

// Doodle arrow — for "← look at this"
function DoodleArrow({ rotate = 0, size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 50 50"
         style={{ transform: `rotate(${rotate}deg)`, display: 'block' }}>
      <path d="M5 25 Q15 8 38 18" stroke="#a1620e" strokeWidth="2" fill="none"
            strokeLinecap="round" strokeDasharray="0 0"/>
      <path d="M30 12 L40 18 L34 28" stroke="#a1620e" strokeWidth="2" fill="none"
            strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════
//   FEATURE-TILE MOTIFS — each unique, illustrated corner art
// ═══════════════════════════════════════════════════════════

// Receipt fluttering down (Scan)
function MotifReceipt() {
  return (
    <svg width="90" height="90" viewBox="0 0 80 80"
         style={{ position: 'absolute', top: -10, right: -10, opacity: 1 }}
         aria-hidden="true">
      <g transform="rotate(15 40 40)">
        <path d="M22 14 L52 14 L52 56 L48 60 L44 56 L40 60 L36 56 L32 60 L28 56 L24 60 L22 56 Z"
              fill="#fffbf0" stroke="#b06410" strokeWidth="1.4"/>
        <line x1="28" y1="22" x2="46" y2="22" stroke="#b06410" strokeWidth="1.2" opacity="0.5"/>
        <line x1="28" y1="28" x2="44" y2="28" stroke="#b06410" strokeWidth="1.2" opacity="0.5"/>
        <line x1="28" y1="34" x2="46" y2="34" stroke="#b06410" strokeWidth="1.2" opacity="0.5"/>
        <line x1="28" y1="40" x2="40" y2="40" stroke="#b06410" strokeWidth="1.2" opacity="0.5"/>
      </g>
    </svg>
  );
}

// Chat bubbles drifting up (Kausap)
function MotifChat() {
  return (
    <svg width="90" height="90" viewBox="0 0 80 80"
         style={{ position: 'absolute', top: -8, right: -8, opacity: 1 }}
         aria-hidden="true">
      <ellipse cx="58" cy="22" rx="14" ry="10" fill="#fef3d9" stroke="#b06410" strokeWidth="1.4"/>
      <path d="M52 30 L48 36 L54 32 Z" fill="#fef3d9" stroke="#b06410" strokeWidth="1.4"/>
      <circle cx="52" cy="22" r="1.6" fill="#b06410"/>
      <circle cx="58" cy="22" r="1.6" fill="#b06410"/>
      <circle cx="64" cy="22" r="1.6" fill="#b06410"/>
      <ellipse cx="34" cy="46" rx="10" ry="7" fill="#fff" stroke="#b06410" strokeWidth="1.2" opacity="0.7"/>
    </svg>
  );
}

// Calendar leaf flipping (BIR)
function MotifCalendar() {
  return (
    <svg width="90" height="90" viewBox="0 0 80 80"
         style={{ position: 'absolute', top: -6, right: -6, opacity: 1 }}
         aria-hidden="true">
      <rect x="34" y="20" width="32" height="32" rx="4" fill="#fffbf0" stroke="#b06410" strokeWidth="1.4"/>
      <rect x="34" y="20" width="32" height="9" rx="4" fill="#e89b2f"/>
      <line x1="42" y1="16" x2="42" y2="26" stroke="#b06410" strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="58" y1="16" x2="58" y2="26" stroke="#b06410" strokeWidth="1.6" strokeLinecap="round"/>
      <text x="50" y="46" textAnchor="middle" fontSize="12" fontWeight="800" fill="#b06410" fontFamily="Fraunces, serif">25</text>
      {/* peeling page corner */}
      <path d="M62 48 L66 48 L66 52 Z" fill="#fef3d9" stroke="#b06410" strokeWidth="1"/>
    </svg>
  );
}

// Stacked coins (Pricing)
function MotifCoins() {
  return (
    <svg width="90" height="90" viewBox="0 0 80 80"
         style={{ position: 'absolute', top: -4, right: -8, opacity: 1 }}
         aria-hidden="true">
      <ellipse cx="50" cy="48" rx="18" ry="5" fill="#c87b14" opacity="0.3"/>
      <g>
        <ellipse cx="50" cy="44" rx="18" ry="5.5" fill="#f5b347" stroke="#b06410" strokeWidth="1.2"/>
        <ellipse cx="50" cy="44" rx="18" ry="5.5" fill="none" stroke="#b06410" strokeWidth="0.8" opacity="0.4" transform="translate(0,-2)"/>
      </g>
      <g>
        <ellipse cx="48" cy="35" rx="17" ry="5" fill="#fbd672" stroke="#b06410" strokeWidth="1.2"/>
        <text x="48" y="38" textAnchor="middle" fontSize="9" fontWeight="800" fill="#b06410">₱</text>
      </g>
      <g>
        <ellipse cx="52" cy="26" rx="14" ry="4" fill="#f5b347" stroke="#b06410" strokeWidth="1.2"/>
      </g>
    </svg>
  );
}

// Stack of papers (Invoices)
function MotifPapers() {
  return (
    <svg width="90" height="90" viewBox="0 0 80 80"
         style={{ position: 'absolute', top: -6, right: -6, opacity: 1 }}
         aria-hidden="true">
      <rect x="28" y="32" width="30" height="22" rx="2" fill="#fff" stroke="#b06410" strokeWidth="1.2" transform="rotate(-6 43 43)"/>
      <rect x="32" y="26" width="30" height="22" rx="2" fill="#fffbf0" stroke="#b06410" strokeWidth="1.2" transform="rotate(4 47 37)"/>
      <rect x="34" y="20" width="30" height="22" rx="2" fill="#fef3d9" stroke="#b06410" strokeWidth="1.4"/>
      <line x1="38" y1="26" x2="58" y2="26" stroke="#b06410" strokeWidth="1" opacity="0.5"/>
      <line x1="38" y1="30" x2="56" y2="30" stroke="#b06410" strokeWidth="1" opacity="0.5"/>
      <line x1="38" y1="34" x2="50" y2="34" stroke="#b06410" strokeWidth="1" opacity="0.5"/>
    </svg>
  );
}

// Tape strip (for paper-note look on cards)
function TapeStrip({ rotate = -2, top = -8, left = '50%' }) {
  return (
    <div style={{
      position: 'absolute', top, left, transform: `translateX(-50%) rotate(${rotate}deg)`,
      width: 64, height: 18,
      background: 'linear-gradient(180deg, rgba(245,179,71,0.45), rgba(245,179,71,0.25))',
      borderTop: '1px solid rgba(232,155,47,0.5)',
      borderBottom: '1px solid rgba(232,155,47,0.4)',
      boxShadow: '0 1px 3px rgba(168,120,40,0.15)',
      pointerEvents: 'none',
      zIndex: 2,
    }}/>
  );
}

// Sampaguita garland — horizontal divider replacement
function SampaguitaGarland() {
  const flowers = Array.from({ length: 9 });
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 12, padding: '4px 0', opacity: 0.7,
    }} aria-hidden="true">
      <svg width="100%" height="20" viewBox="0 0 400 20" preserveAspectRatio="none">
        <path d="M0 10 Q100 4 200 10 T400 10" stroke="#97b39d" strokeWidth="1.2" fill="none" opacity="0.6"/>
        {flowers.map((_, i) => {
          const x = 20 + (i * 360) / 8;
          const y = 10 + (i % 2 === 0 ? -2 : 2);
          return (
            <g key={i} transform={`translate(${x} ${y})`}>
              {[0, 72, 144, 216, 288].map(deg => (
                <circle key={deg} cx={0} cy={0} r="2.2" fill="#fff" stroke="#e89b2f" strokeWidth="0.6"
                  transform={`rotate(${deg}) translate(0 -2.4)`}/>
              ))}
              <circle cx="0" cy="0" r="1.2" fill="#fbd672"/>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Floating sampaguita petals — drift down occasionally
function FloatingPetals() {
  const petals = useMemoHome(() => Array.from({ length: 6 }, (_, i) => ({
    id: i,
    left: 8 + Math.random() * 84,
    delay: i * 4 + Math.random() * 3,
    dur: 14 + Math.random() * 8,
    size: 6 + Math.random() * 4,
    rot: Math.random() * 360,
  })), []);
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {petals.map(p => (
        <span key={p.id} style={{
          position: 'absolute', left: `${p.left}%`, top: '-20px',
          width: p.size, height: p.size, borderRadius: '50% 50% 50% 0',
          background: 'radial-gradient(circle at 30% 30%, #fff, #fdf0d4)',
          border: '0.5px solid rgba(232,155,47,0.3)',
          transform: `rotate(${p.rot}deg)`,
          animation: `petal-drift ${p.dur}s linear ${p.delay}s infinite`,
        }}/>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//   HOME SCREEN
// ═══════════════════════════════════════════════════════════
function HomeScreen({ persona, lang, onOpenScreen }) {
  const p = PERSONAS[persona];
  const c = COPY[lang];
  const now = new Date();
  const hours = now.getHours();
  const isMorning = hours < 11;

  const tod = (() => {
    if (hours < 11)  return { fil: 'Magandang umaga', en: 'Good morning' };
    if (hours < 14)  return { fil: 'Kumusta na, tanghali na', en: 'How\'s the day going' };
    if (hours < 17)  return { fil: 'Merienda break?', en: 'Afternoon check-in' };
    if (hours < 20)  return { fil: 'Magandang hapon', en: 'Good evening' };
    return              { fil: 'Magandang gabi', en: 'Good evening' };
  })();

  const firstName = p.name.split(' ')[0];
  const greeting = tod[lang === 'fil' ? 'fil' : 'en'];
  const streak = 12;

  // Streamlined to 5 main features with unique illustrated motifs
  const features = lang === 'fil' ? [
    { id: 'scan',      Icon: IconResibo,     Motif: MotifReceipt,  title: 'Scan resibo',     sub: 'Kuhanan ng litrato',       to: 'scan',      tint: '#fef3d9' },
    { id: 'usap',      Icon: IconUsap,       Motif: MotifChat,     title: 'Kausapin si Kai', sub: 'Magtanong tungkol sa pera', to: 'chat',      tint: '#fde9d4' },
    { id: 'deadlines', Icon: IconKalendaryo, Motif: MotifCalendar, title: 'BIR paalala',     sub: '2 deadline sa linggo',      to: 'deadlines', tint: '#fceadd' },
    { id: 'precio',    Icon: IconPrecio,     Motif: MotifCoins,    title: 'Tamang presyo',   sub: 'I-check ang pricing',       to: 'costing',   tint: '#fef3d9' },
    { id: 'invoice',   Icon: IconInvoice,    Motif: MotifPapers,   title: 'Mga invoice',     sub: '3 pending, 1 overdue',      to: 'invoices',  tint: '#f4ecdb' },
  ] : [
    { id: 'scan',      Icon: IconResibo,     Motif: MotifReceipt,  title: 'Scan a receipt',  sub: 'Snap a photo',              to: 'scan',      tint: '#fef3d9' },
    { id: 'usap',      Icon: IconUsap,       Motif: MotifChat,     title: 'Talk with Kai',   sub: 'Ask about your money',      to: 'chat',      tint: '#fde9d4' },
    { id: 'deadlines', Icon: IconKalendaryo, Motif: MotifCalendar, title: 'BIR reminders',   sub: '2 deadlines this week',     to: 'deadlines', tint: '#fceadd' },
    { id: 'precio',    Icon: IconPrecio,     Motif: MotifCoins,    title: 'Right pricing',   sub: 'Check your pricing',        to: 'costing',   tint: '#fef3d9' },
    { id: 'invoice',   Icon: IconInvoice,    Motif: MotifPapers,   title: 'Invoices',        sub: '3 pending, 1 overdue',      to: 'invoices',  tint: '#f4ecdb' },
  ];

  // Mini dashboard data — banig-textured stacked blocks
  const week = WEEK_DATA[persona] || WEEK_DATA.ana || [];
  const weekData = week.length ? week.slice(0,7) : Array.from({length:7}, () => ({ rev: 30+Math.random()*50 }));
  const maxVal = Math.max(...weekData.map(d => d.rev || 0), 1);
  const dayLabels = ['M','T','W','Th','F','Sa','Su'];

  return (
    <div className="scroll fade-in" style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
      <FloatingPetals/>

      <div style={{
        padding: '24px 20px 48px', maxWidth: 760, margin: '0 auto',
        display: 'flex', flexDirection: 'column', gap: 18,
        position: 'relative',
      }}>

        {/* ═══ KUMUSTAHAN — illustrated scene with full Kai ═══ */}
        <div className="kumustahan slide-up" style={{ position: 'relative', minHeight: 200 }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.18, pointerEvents: 'none' }}>
            <CapizPattern/>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            position: 'relative', flexWrap: 'wrap',
          }}>
            {/* Brand-faithful Kai mark */}
            <div style={{ position: 'relative', width: 168, height: 168, flexShrink: 0, marginTop: -4, marginLeft: -8 }}
                 className="kai-bob">
              <KaiSitting size={168}/>
            </div>

            {/* Greeting copy */}
            <div style={{ flex: 1, minWidth: 240, paddingTop: 12 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 11, color: 'var(--honey-deep)', fontWeight: 800,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                background: 'rgba(255,255,255,0.55)', padding: '4px 10px', borderRadius: 999,
                whiteSpace: 'nowrap',
              }}>
                <Sampaguita size={11} color="#e89b2f"/>
                <span>{greeting}</span>
              </div>
              <div className="serif" style={{
                fontSize: 30, fontWeight: 500, color: 'var(--ink)',
                lineHeight: 1.1, letterSpacing: '-0.02em', marginTop: 8,
              }}>
                {firstName},
              </div>
              <div className="serif" style={{
                fontSize: 26, fontWeight: 500, lineHeight: 1.15, marginTop: 2,
                position: 'relative', display: 'inline-block',
              }}>
                <span style={{ color: 'var(--honey-deep)', fontStyle: 'italic' }}>
                  {lang === 'fil' ? 'kumusta ka?' : 'how are you?'}
                </span>
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: -6 }}>
                  <Squiggle width={lang === 'fil' ? 120 : 130}/>
                </div>
              </div>

              {/* Kai's offered paper-note check-in card */}
              <button onClick={() => onOpenScreen('checkin')}
                aria-label="Open daily check-in"
                style={{
                  marginTop: 22, position: 'relative',
                  background: '#fffdf5',
                  border: '1.5px solid rgba(232, 155, 47, 0.35)',
                  borderRadius: '4px 12px 4px 12px',
                  padding: '14px 16px 12px',
                  cursor: 'pointer', width: '100%', maxWidth: 360, textAlign: 'left',
                  transform: 'rotate(-1.2deg)',
                  boxShadow: '0 6px 14px -4px rgba(168,120,40,0.18), 0 1px 0 rgba(232,220,192,0.6)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = 'rotate(-0.4deg) translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 22px -4px rgba(168,120,40,0.25), 0 1px 0 rgba(232,220,192,0.6)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'rotate(-1.2deg)';
                  e.currentTarget.style.boxShadow = '0 6px 14px -4px rgba(168,120,40,0.18), 0 1px 0 rgba(232,220,192,0.6)';
                }}>
                <TapeStrip rotate={-3} top={-9} left="30%"/>
                <div style={{
                  fontSize: 10, fontWeight: 800, color: 'var(--honey-deep)',
                  letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6,
                  whiteSpace: 'nowrap',
                }}>
                  {lang === 'fil' ? 'Mensahe ni Kai' : 'A note from Kai'}
                </div>
                <div className="serif" style={{
                  fontSize: 15, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.4,
                  fontStyle: 'italic',
                }}>
                  {lang === 'fil'
                    ? <>"Ready ka na bang mag-check-in? Pang-<b>{streak}</b> araw na natin 🌼"</>
                    : <>"Ready for today's check-in? Day <b>{streak}</b> together 🌼"</>}
                </div>
                <div style={{
                  marginTop: 8, fontSize: 11.5, fontWeight: 800,
                  color: 'var(--honey-deep)', display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {lang === 'fil' ? 'Buksan' : 'Open'} <span>→</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* ═══ Section header — hand-drawn ═══ */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 6, marginBottom: -4 }}>
          <div style={{ position: 'relative' }}>
            <div className="serif" style={{
              fontSize: 18, fontWeight: 600, color: 'var(--ink)',
              letterSpacing: '-0.01em', whiteSpace: 'nowrap',
            }}>
              {lang === 'fil' ? 'Anong gagawin natin?' : 'What would you like to do?'}
            </div>
          </div>
        </div>

        {/* ═══ Feature tiles with illustrated motifs ═══ */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 12, marginTop: 8,
        }}>
          {features.map((f, i) => {
            const Ic = f.Icon;
            return (
              <button key={f.id}
                className="feature-tile-illo slide-up squish-on-hover"
                style={{
                  animationDelay: `${60 + i * 40}ms`,
                  background: f.tint,
                }}
                onClick={() => onOpenScreen(f.to)}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <Ic size={42}/>
                </div>
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: 3,
                  position: 'relative', zIndex: 1, width: '100%',
                }}>
                  <div className="feature-tile-title">{f.title}</div>
                  <div className="feature-tile-sub">{f.sub}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Inclusive woven divider */}
        <div style={{ marginTop: 8 }}>
          <WovenDivider/>
        </div>

        {/* ═══ Kuwento ng Linggo — banig-textured chart, paper-note feel ═══ */}
        <div className="home-card slide-up"
             style={{ animationDelay: '300ms', padding: 22, overflow: 'hidden', cursor: 'pointer', position: 'relative' }}
             onClick={() => onOpenScreen('saan')}>

          {/* Top header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <IconPera size={28}/>
              <div>
                <div style={{
                  fontSize: 10.5, fontWeight: 800, color: 'var(--honey-deep)',
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                }}>
                  {lang === 'fil' ? 'Kuwento ng Linggo' : 'This Week\'s Story'}
                </div>
                <div className="serif" style={{
                  fontSize: 18, fontWeight: 600, color: 'var(--ink)',
                  letterSpacing: '-0.01em', marginTop: 2,
                }}>
                  {lang === 'fil' ? 'Saan napunta ang pera?' : 'Where did the money go?'}
                </div>
              </div>
            </div>
            <span className="pill pill-sage" style={{ fontSize: 11, fontWeight: 800 }}>↗ +12%</span>
          </div>

          {/* Narrative line */}
          <div className="serif" style={{
            fontSize: 19, fontWeight: 500, color: 'var(--ink-soft)',
            lineHeight: 1.4, letterSpacing: '-0.01em', maxWidth: 540,
            marginTop: 10, marginBottom: 18,
          }}>
            {lang === 'fil'
              ? <>Nakaipon ka ng <span style={{
                  color: 'var(--honey-deep)', fontWeight: 600, whiteSpace: 'nowrap',
                }}>{pesoShort(p.stats.profit)}</span> ngayong linggo.</>
              : <>You saved <span style={{
                  color: 'var(--honey-deep)', fontWeight: 600, whiteSpace: 'nowrap',
                }}>{pesoShort(p.stats.profit)}</span> this week.</>}
          </div>

          {/* 3 KPI tiles */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0,
            border: '1px solid rgba(232,220,192,0.7)',
            borderRadius: 14, overflow: 'hidden',
            background: 'rgba(255, 251, 240, 0.6)',
            marginBottom: 20,
          }}>
            {[
              { k: c.revenue,  v: pesoShort(p.stats.revenue) },
              { k: c.expenses, v: pesoShort(p.stats.expenses) },
              { k: c.profit,   v: pesoShort(p.stats.profit), hi: true },
            ].map((s, i) => (
              <div key={i} style={{
                padding: '12px 10px', textAlign: 'center',
                borderRight: i < 2 ? '1px solid rgba(232,220,192,0.7)' : 'none',
                background: s.hi ? 'linear-gradient(180deg, transparent, rgba(253,232,160,0.45))' : 'transparent',
              }}>
                <div style={{
                  fontSize: 9.5, color: 'var(--ink-faint)',
                  fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>{s.k}</div>
                <div className="serif" style={{
                  fontSize: s.hi ? 22 : 19, fontWeight: 600, marginTop: 4,
                  color: s.hi ? 'var(--honey-deep)' : 'var(--ink)',
                }}>{s.v}</div>
              </div>
            ))}
          </div>

          {/* Banig-weave bar chart — textural blocks */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--ink-faint)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {lang === 'fil' ? 'Pang-araw-araw na kita' : 'Daily revenue'}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--ink-faint)', fontWeight: 700 }}>
                {lang === 'fil' ? '7 araw' : '7 days'}
              </div>
            </div>
            <div style={{
              display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
              height: 96, gap: 6, padding: '0 2px',
              background: 'linear-gradient(180deg, transparent 0%, transparent 90%, rgba(168,120,40,0.12) 100%)',
            }}>
              {weekData.map((d, i) => {
                const val = d.rev || 0;
                const h = Math.max(14, (val / maxVal) * 86);
                const isPeak = val === maxVal;
                // Banig-weave block: stacked segments
                const segments = Math.max(2, Math.floor(h / 14));
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: '100%', height: h,
                      display: 'flex', flexDirection: 'column-reverse',
                      gap: 1.5,
                      filter: isPeak ? 'drop-shadow(0 2px 4px rgba(200,123,20,0.35))' : 'none',
                      position: 'relative',
                    }}>
                      {Array.from({ length: segments }).map((_, j) => {
                        const t = j / Math.max(1, segments - 1);
                        const baseColor = isPeak ? '#e89b2f' : '#f0c878';
                        const topColor = isPeak ? '#fbd672' : '#fde8c0';
                        // Mix base→top
                        return (
                          <div key={j} style={{
                            flex: 1, minHeight: 8,
                            background: `
                              linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%),
                              repeating-linear-gradient(45deg,
                                rgba(255,255,255,0.12) 0 2px,
                                transparent 2px 4px),
                              linear-gradient(180deg, ${j === segments - 1 ? topColor : baseColor}, ${baseColor})
                            `,
                            borderRadius: j === segments - 1 ? '5px 5px 0 0' : '0',
                            border: '1px solid rgba(168,120,40,0.18)',
                            borderBottom: j === 0 ? '1px solid rgba(168,120,40,0.18)' : 'none',
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)',
                          }}/>
                        );
                      })}
                      {isPeak && (
                        <div style={{
                          position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)',
                          fontSize: 16,
                        }}>
                          <Sampaguita size={10} color="#e89b2f"/>
                        </div>
                      )}
                    </div>
                    <div style={{
                      fontSize: 10.5, fontWeight: 800,
                      color: isPeak ? 'var(--honey-deep)' : 'var(--ink-faint)',
                      letterSpacing: '-0.01em',
                    }}>{dayLabels[i]}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Kai's takeaway — paper note with tape */}
          <div style={{
            marginTop: 22, padding: '14px 16px 12px',
            background: '#fffdf5',
            border: '1.5px solid rgba(232, 155, 47, 0.28)',
            borderRadius: '4px 12px 4px 12px',
            position: 'relative',
            transform: 'rotate(-0.6deg)',
            boxShadow: '0 4px 12px -4px rgba(168,120,40,0.15)',
          }}>
            <TapeStrip rotate={2} top={-9} left="22%"/>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ flexShrink: 0 }}>
                <Kai size={32} expression="happy" animated={false}/>
              </div>
              <div style={{ flex: 1, fontSize: 13, color: 'var(--ink-soft)',
                lineHeight: 1.5, fontStyle: 'italic',
                fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}>
                {lang === 'fil'
                  ? '"Miyerkules ang pinakamainit — 4pm na-spike ang benta. Pabalik na sana yan next week."'
                  : '"Wednesday was your peak — sales spiked at 4pm. Let\'s try to repeat that next week."'}
              </div>
            </div>
          </div>

          <div style={{
            marginTop: 14, fontSize: 12, fontWeight: 800,
            color: 'var(--honey-deep)', textAlign: 'right',
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4,
          }}>
            {lang === 'fil' ? 'Buksan ang detalye' : 'Open full details'} <span>→</span>
          </div>
        </div>

        {/* ═══ Closing warmth — handwritten signature feel ═══ */}
        <div style={{
          textAlign: 'center', padding: '20px 20px 0',
          color: 'var(--ink-faint)', fontSize: 13, fontWeight: 500,
          fontStyle: 'italic', fontFamily: "'Fraunces', Georgia, serif",
        }}>
          {lang === 'fil' ? '— Kai' : '— Kai'}
        </div>

      </div>
    </div>
  );
}

Object.assign(window, { HomeScreen });
