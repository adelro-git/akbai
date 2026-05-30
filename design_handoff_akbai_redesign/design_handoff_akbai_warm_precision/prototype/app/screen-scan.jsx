/* global React, Kai, PesoNum, Tag */
const { useState: useScanState } = React;

function ScanScreen({ lang, onClose, onSaved }) {
  const [phase, setPhase] = useScanState('aim'); // aim | parsing | result
  const [amount, setAmount] = useScanState(3240);
  const [cat, setCat] = useScanState('supplies');

  const t = lang === 'fil' ? {
    aim: 'I-frame ang resibo sa loob ng linya',
    parsing: 'Sandali lang, binabasa ko ang resibo mo\u2026',
    gallery: 'Galeria', flash: 'Flash',
    scanned: 'Na-scan ko na', scannedBody: (v) => `${v} sa Divisoria. I-check mo kung tama bago natin i-save.`,
    vendor: 'Divisoria Fabrics', date: 'Nob 18, 2025',
    amountL: 'Halaga', catL: 'Kategorya',
    edit: 'I-edit', save: 'Tama na, i-save',
    cats: { supplies: 'Paninda', utilities: 'Kuryente', transport: 'Pamasahe', marketing: 'Ads', misc: 'Iba pa' },
    savedToast: 'Na-save ko na ang gastos mo!',
  } : {
    aim: 'Frame the receipt inside the lines',
    parsing: 'One sec, reading your receipt\u2026',
    gallery: 'Gallery', flash: 'Flash',
    scanned: 'Scanned it', scannedBody: (v) => `${v} at Divisoria. Check it\u2019s right before we save.`,
    vendor: 'Divisoria Fabrics', date: 'Nov 18, 2025',
    amountL: 'Amount', catL: 'Category',
    edit: 'Edit', save: 'Looks right, save',
    cats: { supplies: 'Supplies', utilities: 'Utilities', transport: 'Transport', marketing: 'Ads', misc: 'Other' },
    savedToast: 'Saved your expense!',
  };

  function shoot() {
    setPhase('parsing');
    setTimeout(() => setPhase('result'), 1900);
  }

  return (
    <div className="scan">
      {/* top bar */}
      <div className="scan-topbar">
        <button className="scan-close" onClick={onClose} aria-label="Close">✕</button>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.02em' }}>Scan resibo</div>
        <div style={{ width: 36 }} />
      </div>

      {/* camera frame */}
      <div className="scan-frame">
        <div className="scan-receipt-placeholder" />
        <div className="scan-bracket tl" /><div className="scan-bracket tr" />
        <div className="scan-bracket bl" /><div className="scan-bracket br" />
        {phase === 'aim' && <div className="scan-line" />}
        {phase === 'aim' && <div className="scan-hint">{t.aim}</div>}
      </div>

      {/* control bar */}
      <div className="scan-bar">
        <div className="scan-glass" />
        <div className="scan-side"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="14" rx="3" stroke="#fff" strokeWidth="1.8" /><circle cx="12" cy="13" r="3.4" stroke="#fff" strokeWidth="1.8" /><rect x="8" y="4" width="8" height="3" rx="1.5" fill="#fff" /></svg>{t.gallery}</div>
        <button className="shutter" onClick={shoot} aria-label="Capture"><div className="shutter-inner" /></button>
        <div className="scan-side"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M13 2 L5 13 h6 l-2 9 8-12 h-6 z" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" fill="none" /></svg>{t.flash}</div>
      </div>

      {/* parsing overlay */}
      {phase === 'parsing' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,15,8,0.78)', backdropFilter: 'blur(6px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, zIndex: 5 }}>
          <div className="kai-bob"><Kai size={96} expression="working" animated={false} /></div>
          <div style={{ color: '#fff', fontSize: 15, fontWeight: 600, maxWidth: 220, textAlign: 'center' }}>{t.parsing}</div>
        </div>
      )}

      {/* result — editable expense card sheet */}
      {phase === 'result' && (
        <div className="sheet-scrim" style={{ background: 'rgba(10,15,8,0.55)' }}>
          <div className="sheet">
            <div className="sheet-grip" />
            {/* Kai confirm bubble */}
            <div className="chat-row" style={{ marginBottom: 16 }}>
              <span style={{ flexShrink: 0 }}><Kai size={30} expression="happy" animated={false} /></span>
              <div><div className="bubble-kai warm">{t.scanned} — {t.scannedBody('')}<PesoNum value={amount} size="sm" countUp={false} />{lang === 'fil' ? '' : ''}</div></div>
            </div>

            {/* Expense card */}
            <div className="card" style={{ background: 'var(--c-low)' }}>
              <div className="card-header">
                <span className="at-icon" style={{ width: 36, height: 36 }}><IconResibo size={36} /></span>
                <div className="ch-title">
                  <div className="h3" style={{ fontSize: 16 }}>{t.vendor}</div>
                  <div className="label" style={{ fontWeight: 600, textTransform: 'none', letterSpacing: '0.02em' }}>{t.date}</div>
                </div>
                <Tag kind="pending">{lang === 'fil' ? 'Bago' : 'New'}</Tag>
              </div>

              <div className="field" style={{ marginTop: 4 }}>
                <span className="label">{t.amountL}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="num num-lg" style={{ flexShrink: 0 }}>₱</span>
                  <input className="input" style={{ flex: 1, fontSize: 24, fontWeight: 700, color: 'var(--teal)', height: 48 }}
                    value={amount} inputMode="numeric"
                    onChange={e => setAmount(Number(e.target.value.replace(/\D/g, '')) || 0)} />
                </div>
              </div>

              <div className="field" style={{ marginTop: 14 }}>
                <span className="label">{t.catL}</span>
                <div className="chip-scroll" style={{ flexWrap: 'wrap', overflow: 'visible' }}>
                  {Object.keys(t.cats).map(k => (
                    <button key={k} className={`chip${cat === k ? ' chip-active' : ''}`} onClick={() => setCat(k)}>{t.cats[k]}</button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>{t.edit}</button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => { onSaved && onSaved(t.savedToast); }}>{t.save}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.ScanScreen = ScanScreen;
