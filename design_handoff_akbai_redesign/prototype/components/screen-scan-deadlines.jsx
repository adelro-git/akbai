/* global React, Kai, Card, Chip, SectionLabel, PERSONAS, COPY, formatPeso */
const { useState: useStateOther, useEffect: useEffectOther } = React;

// ═══════════════ SCAN Screen ═══════════════
function ScanScreen({ persona, copy, lang, onBack }) {
  const [phase, setPhase] = useStateOther('aim'); // aim -> scanning -> result
  const [saved, setSaved] = useStateOther(false);

  useEffectOther(() => {
    if (phase === 'scanning') {
      const t = setTimeout(() => setPhase('result'), 1800);
      return () => clearTimeout(t);
    }
  }, [phase]);

  return (
    <div style={{ flex: 1, background: '#1c1c18', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {phase !== 'result' ? (
        <>
          {/* Camera viewfinder */}
          <div style={{
            flex: 1, position: 'relative',
            background: 'radial-gradient(ellipse at center, #3f3a2e 0%, #1c1c18 70%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {/* Faux receipt in viewfinder */}
            <div className={phase === 'scanning' ? 'shimmer' : ''} style={{
              width: 220, height: 300,
              background: 'linear-gradient(180deg, #fffbf4 0%, #fdf6e8 100%)',
              borderRadius: '4px 4px 0 0',
              boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
              transform: 'rotate(-3deg) perspective(800px) rotateX(4deg)',
              padding: '20px 18px',
              position: 'relative',
            }}>
              <div style={{ fontSize: 10, textAlign: 'center', fontWeight: 700, color: '#534434', letterSpacing: '0.08em' }}>
                DIVISORIA FABRICS
              </div>
              <div style={{ fontSize: 8, textAlign: 'center', color: '#867461', marginTop: 2 }}>168 Divisoria St., Binondo</div>
              <div style={{ borderTop: '1px dashed #867461', margin: '10px 0 8px' }}/>
              {['Katsa — 5yds', 'Kambray — 3yds', 'Buttons 24pc', 'Thread asst.'].map((l, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: '#534434', padding: '3px 0' }}>
                  <span>{l}</span><span className="mono">₱{[840, 620, 180, 220][i]}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px dashed #867461', margin: '8px 0' }}/>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 800, color: '#1c1c18' }}>
                <span>TOTAL</span><span className="mono">₱3,240</span>
              </div>
              <div style={{ fontSize: 8, color: '#867461', marginTop: 12, textAlign: 'center' }}>Nob 18, 2025 · 2:34 PM</div>
            </div>

            {/* Viewfinder corners */}
            {['tl', 'tr', 'bl', 'br'].map((corner, i) => {
              const pos = { tl: { top: 60, left: 30 }, tr: { top: 60, right: 30 }, bl: { bottom: 60, left: 30 }, br: { bottom: 60, right: 30 } }[corner];
              const rot = [0, 90, 270, 180][i];
              return (
                <div key={corner} style={{
                  position: 'absolute', ...pos, width: 32, height: 32,
                  borderTop: '3px solid #fbbf24', borderLeft: '3px solid #fbbf24',
                  transform: `rotate(${rot}deg)`,
                  borderTopLeftRadius: 4,
                }}/>
              );
            })}
          </div>

          {/* Controls */}
          <div style={{
            padding: '20px 24px 30px',
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <button onClick={onBack} style={{ color: 'white', fontSize: 14, fontWeight: 600, padding: 8 }}>
              {lang === 'fil' ? 'Cancel' : 'Cancel'}
            </button>
            <button onClick={() => setPhase('scanning')} style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'white', border: '4px solid rgba(255,255,255,0.3)',
              boxShadow: '0 4px 20px rgba(245,158,11,0.4)',
            }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'linear-gradient(135deg, #fbbf24, #d97706)' }}/>
            </button>
            <button style={{ color: 'white', fontSize: 12, fontWeight: 600, padding: 8 }}>
              🖼️ {lang === 'fil' ? 'Album' : 'Gallery'}
            </button>
          </div>
          {phase === 'scanning' && (
            <div style={{
              position: 'absolute', top: '50%', left: 0, right: 0,
              textAlign: 'center', color: 'white', fontSize: 13, fontWeight: 600,
              padding: 12, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)',
              transform: 'translateY(-50%)',
            }}>
              ✨ {lang === 'fil' ? 'Binabasa ni Kai...' : 'Kai is reading...'}
            </div>
          )}
        </>
      ) : (
        // Result view
        <div className="scroll" style={{ flex: 1, background: '#fdf9f2', overflow: 'auto', color: 'var(--ink)' }}>
          <div style={{ padding: '18px 18px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={onBack} style={{ fontSize: 20, color: 'var(--ink)' }}>←</button>
            <SectionLabel>✨ {lang === 'fil' ? 'NA-SCAN' : 'SCANNED'}</SectionLabel>
          </div>

          <div style={{ padding: '0 18px 100px' }}>
            <div className="serif" style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.15, marginBottom: 14 }}>
              {lang === 'fil' ? 'Eto ang nabasa ko. Tama ba?' : 'Here\'s what I read. Look right?'}
            </div>

            {/* Receipt preview card */}
            <div className="receipt-paper pop-in" style={{
              padding: '18px 18px 26px', borderRadius: '6px 6px 0 0',
              position: 'relative',
            }}>
              <div className="dog-ear"/>
              <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 800, letterSpacing: '0.05em' }}>DIVISORIA FABRICS</div>
              <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--ink-faint)', marginTop: 2 }}>168 Divisoria St., Binondo</div>
              <div style={{ borderTop: '1px dashed rgba(134,116,97,0.5)', margin: '12px 0 8px' }}/>
              {[['Katsa — 5yds', 840], ['Kambray — 3yds', 620], ['Buttons 24pc', 180], ['Thread asst.', 220], ['Others', 1380]].map(([l, v], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0' }}>
                  <span>{l}</span><span className="mono">{formatPeso(v)}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px dashed rgba(134,116,97,0.5)', margin: '8px 0' }}/>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800 }}>
                <span>TOTAL</span><span className="mono">₱3,240</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--ink-faint)', marginTop: 10, textAlign: 'center' }}>Nob 18, 2025 · 2:34 PM</div>
            </div>

            {/* Kai interpretation */}
            <div style={{
              background: 'white', borderRadius: 16, padding: 16, marginTop: 16,
              boxShadow: '0 4px 12px -2px rgba(245,158,11,0.12)',
              border: '1px solid rgba(245,158,11,0.1)',
            }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <Kai size={32} expression="happy" glow/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--ink)' }}>
                    {lang === 'fil' ? (
                      <>I-ta-tag ko ito bilang <b style={{ color: '#006b54' }}>Paninda · Tela</b>. Sigurado?</>
                    ) : (
                      <>I'll tag this as <b style={{ color: '#006b54' }}>Supplies · Fabrics</b>. Confirm?</>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                    <Chip color="teal" active>📦 {lang === 'fil' ? 'Paninda' : 'Supplies'}</Chip>
                    <Chip>🏷️ Tela</Chip>
                    <Chip>📅 Nob 18</Chip>
                  </div>
                </div>
              </div>

              {!saved ? (
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <button style={{
                    flex: 1, padding: '12px', borderRadius: 12,
                    background: '#f7f3ec', color: 'var(--ink-soft)', fontWeight: 700, fontSize: 13,
                  }}>{lang === 'fil' ? 'Palitan' : 'Edit'}</button>
                  <button onClick={() => setSaved(true)} style={{
                    flex: 2, padding: '12px', borderRadius: 12,
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white',
                    fontWeight: 700, fontSize: 13,
                    boxShadow: '0 4px 12px rgba(245,158,11,0.35)',
                  }}>✓ {lang === 'fil' ? 'I-save' : 'Save'}</button>
                </div>
              ) : (
                <div className="pop-in" style={{
                  marginTop: 14, padding: '12px', borderRadius: 12,
                  background: 'linear-gradient(135deg, #d1f5ea, #a7f3d0)',
                  color: '#065f46', fontWeight: 700, fontSize: 13,
                  textAlign: 'center',
                }}>
                  ✓ {lang === 'fil' ? 'Na-save! Tagumpay.' : 'Saved! Nice work.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════ DEADLINES Screen ═══════════════
function DeadlinesScreen({ lang }) {
  const items = [
    { date: 'Nob 25', form: '2551Q', name: 'Quarterly Percentage Tax', days: 5, urgent: true, desc: lang === 'fil' ? 'Para sa Oct–Dec quarter' : 'For Oct–Dec quarter' },
    { date: 'Dis 2', form: '1701Q', name: 'Income Tax Return (Quarterly)', days: 12, urgent: false, desc: lang === 'fil' ? 'Q3 income tax' : 'Q3 income tax' },
    { date: 'Dis 15', form: '1601-C', name: 'Withholding Tax (Compensation)', days: 25, urgent: false, desc: lang === 'fil' ? 'Kung may empleyado' : 'If you have employees' },
    { date: 'Ene 31', form: '1604-E', name: 'Annual Info Return', days: 72, urgent: false, desc: lang === 'fil' ? 'Taunang ulat' : 'Annual report' },
    { date: 'Abr 15', form: '1701', name: 'Annual Income Tax Return', days: 147, urgent: false, desc: lang === 'fil' ? 'Ang pinakamalaki ng lahat' : 'The big one' },
  ];
  return (
    <div className="scroll" style={{ flex: 1, overflow: 'auto', background: '#fdf9f2', padding: '18px 18px 120px' }}>
      <SectionLabel>📅 {lang === 'fil' ? 'BIR DEADLINES' : 'BIR DEADLINES'}</SectionLabel>
      <div className="serif" style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 6, lineHeight: 1.15 }}>
        {lang === 'fil' ? 'Hindi ka mahuhuli kay Kai.' : 'You won\'t miss a deadline.'}
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 4 }}>
        {lang === 'fil' ? 'Automatic na paalala bago ang due date.' : 'Automatic reminders before each due date.'}
      </div>

      {/* Kai reassurance */}
      <div style={{
        display: 'flex', gap: 10, alignItems: 'flex-start',
        background: 'linear-gradient(135deg, #d1f5ea, #ffffff)',
        padding: 14, borderRadius: 16, marginTop: 16,
        border: '1px solid rgba(30,200,159,0.15)',
      }}>
        <Kai size={32} expression="happy" glow/>
        <div style={{ fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.4 }}>
          {lang === 'fil' ? <>Paparating na ang <b>2551Q</b> sa Nov 25. Nandiyan pa ang 5 araw — I-prepare ko na ang numero mo?</>
            : <>Your <b>2551Q</b> is due Nov 25. You've got 5 days — want me to prep your numbers?</>}
        </div>
      </div>

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((it, i) => (
          <div key={i} style={{
            background: 'white', borderRadius: 16, padding: 14,
            display: 'flex', gap: 12, alignItems: 'center',
            boxShadow: '0 2px 8px -2px rgba(245,158,11,0.08)',
            border: `1px solid ${it.urgent ? '#fbbf24' : 'rgba(245,158,11,0.08)'}`,
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 12,
              background: it.urgent ? 'linear-gradient(135deg, #fef3c7, #fbbf24)' : '#f7f3ec',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: it.urgent ? '#92400e' : 'var(--ink-faint)', textTransform: 'uppercase' }}>
                {it.date.split(' ')[0]}
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: it.urgent ? '#7c2d12' : 'var(--ink)', lineHeight: 1 }}>
                {it.date.split(' ')[1]}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="mono" style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--honey-deep)', background: '#fef3c7', padding: '2px 6px', borderRadius: 4 }}>{it.form}</span>
                {it.urgent && <span style={{ fontSize: 10, fontWeight: 800, color: '#b91c1c' }}>⚠ {it.days} {lang === 'fil' ? 'araw' : 'days'}</span>}
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)', marginTop: 4 }}>{it.name}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 2 }}>{it.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { ScanScreen, DeadlinesScreen });
