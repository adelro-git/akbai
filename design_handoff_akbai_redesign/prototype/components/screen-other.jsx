/* global React, Kai, Card, Chip, SectionLabel, PERSONAS, COPY, formatPeso */
const { useState: useStateMisc } = React;

// ═══════════════ CHECK-IN Screen ═══════════════
function CheckinScreen({ lang, onBack }) {
  const [mood, setMood] = useStateMisc(null);
  const [energy, setEnergy] = useStateMisc(3);
  const [note, setNote] = useStateMisc('');
  const [saved, setSaved] = useStateMisc(false);

  const moods = lang === 'fil'
    ? [['😊', 'Masaya'], ['😐', 'Okay lang'], ['😓', 'Pagod'], ['😰', 'Stressed'], ['🤩', 'Excited']]
    : [['😊', 'Happy'], ['😐', 'Okay'], ['😓', 'Tired'], ['😰', 'Stressed'], ['🤩', 'Excited']];

  if (saved) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'linear-gradient(180deg, #fef3c7, #fdf9f2)' }}>
        <div className="pop-in" style={{ position: 'relative' }}>
          <Kai size={100} expression="celebrate" glow animated/>
        </div>
        <div className="serif pop-in" style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 20, textAlign: 'center', lineHeight: 1.2 }}>
          {lang === 'fil' ? 'Salamat sa pagbahagi.' : 'Thanks for sharing.'}
        </div>
        <div className="pop-in" style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginTop: 10, textAlign: 'center', maxWidth: 260 }}>
          {lang === 'fil'
            ? 'Nakikinig ako. Bawat araw, eto tayo. Kaya mo yan. 💛'
            : 'I\'m listening. Every day, we got this. 💛'}
        </div>
        <button onClick={onBack} style={{
          marginTop: 24, padding: '14px 28px', borderRadius: 999,
          background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white',
          fontWeight: 700, fontSize: 14,
          boxShadow: '0 8px 20px rgba(245,158,11,0.4)',
        }}>{lang === 'fil' ? 'Balik sa Home' : 'Back to Home'}</button>
      </div>
    );
  }

  return (
    <div className="scroll" style={{ flex: 1, overflow: 'auto', background: '#fdf9f2', padding: '18px 18px 80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onBack} style={{ fontSize: 22, color: 'var(--ink)' }}>←</button>
        <SectionLabel>💛 {lang === 'fil' ? 'DAILY CHECK-IN' : 'DAILY CHECK-IN'}</SectionLabel>
      </div>
      <div className="serif" style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 10, lineHeight: 1.15 }}>
        {lang === 'fil' ? 'Kamusta ang araw mo?' : 'How\'s your day?'}
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink-faint)', marginTop: 4 }}>
        {lang === 'fil' ? '30 segundo lang — para magkakilala tayo pang-mabuti.' : '30 seconds — helps me know you better.'}
      </div>

      {/* Mood */}
      <div style={{ marginTop: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)', marginBottom: 10 }}>
          {lang === 'fil' ? '1. Pakiramdam mo?' : '1. How do you feel?'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
          {moods.map(([emoji, label]) => (
            <button key={label} onClick={() => setMood(label)} style={{
              padding: '10px 4px', borderRadius: 14,
              background: mood === label ? 'linear-gradient(135deg, #fef3c7, #fbbf24)' : 'white',
              border: `1.5px solid ${mood === label ? '#f59e0b' : 'rgba(245,158,11,0.1)'}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              transition: 'all 0.15s',
            }}>
              <div style={{ fontSize: 28 }}>{emoji}</div>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: mood === label ? '#7c2d12' : 'var(--ink-faint)' }}>{label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Energy */}
      <div style={{ marginTop: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)', marginBottom: 10 }}>
          {lang === 'fil' ? '2. Energy mo ngayon?' : '2. Your energy?'}
        </div>
        <div style={{ background: 'white', borderRadius: 14, padding: 16, border: '1px solid rgba(245,158,11,0.1)' }}>
          <input type="range" min="1" max="5" value={energy} onChange={e => setEnergy(+e.target.value)} style={{ width: '100%', accentColor: '#f59e0b' }}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink-faint)', fontWeight: 600, marginTop: 6 }}>
            <span>{lang === 'fil' ? 'Pagod' : 'Tired'}</span>
            <span className="honey-text" style={{ fontWeight: 800 }}>{['', 'Pagod', 'Medyo pagod', 'Okay', 'Maganda', 'Sagad'][energy]}</span>
            <span>{lang === 'fil' ? 'Sagad' : 'Pumped'}</span>
          </div>
        </div>
      </div>

      {/* Note */}
      <div style={{ marginTop: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)', marginBottom: 10 }}>
          {lang === 'fil' ? '3. May gusto ka bang ikwento kay Kai? (optional)' : '3. Anything you want to share with Kai? (optional)'}
        </div>
        <textarea value={note} onChange={e => setNote(e.target.value)}
          placeholder={lang === 'fil' ? 'Halimbawa: "Mabagal ang benta kanina..."' : 'e.g. "Sales were slow today..."'}
          style={{
            width: '100%', minHeight: 80, padding: 14, borderRadius: 14,
            border: '1px solid rgba(245,158,11,0.15)', background: 'white',
            fontSize: 13, color: 'var(--ink)', resize: 'none',
          }}/>
      </div>

      <button onClick={() => setSaved(true)} disabled={!mood} style={{
        marginTop: 24, width: '100%', padding: '14px', borderRadius: 14,
        background: mood ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#e8e1d6',
        color: 'white', fontWeight: 800, fontSize: 14,
        boxShadow: mood ? '0 8px 20px rgba(245,158,11,0.35)' : 'none',
      }}>
        {lang === 'fil' ? 'Sabihin kay Kai' : 'Send to Kai'}
      </button>
    </div>
  );
}

// ═══════════════ SUNDAY STORY ═══════════════
function SundayStoryScreen({ persona, lang, onBack }) {
  const p = PERSONAS[persona];
  return (
    <div className="scroll" style={{ flex: 1, overflow: 'auto', background: 'linear-gradient(180deg, #1c1c18 0%, #3f3a2e 300px, #3f3a2e 100%)', color: 'white' }}>
      <div style={{ padding: '18px 18px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onBack} style={{ fontSize: 22, color: 'white' }}>←</button>
        <SectionLabel color="#fde68a">📖 {lang === 'fil' ? 'LINGGONG KUWENTO' : 'SUNDAY STORY'}</SectionLabel>
      </div>

      <div style={{ padding: '12px 22px 40px', position: 'relative' }}>
        <div style={{ fontSize: 11, color: '#fde68a', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {lang === 'fil' ? 'Linggo 46 · Nob 11 – Nob 17' : 'Week 46 · Nov 11 – Nov 17'}
        </div>
        <div className="serif" style={{ fontSize: 34, fontWeight: 500, letterSpacing: '-0.025em', lineHeight: 1.1, marginTop: 8 }}>
          {lang === 'fil' ? 'Isang linggo ng tubo at pag-asa.' : 'A week of profit and hope.'}
        </div>

        <div className="serif" style={{ fontSize: 16, fontWeight: 400, lineHeight: 1.6, marginTop: 22, color: 'rgba(255,255,255,0.88)' }}>
          {lang === 'fil' ? (
            <>
              <p>{p.name.split(' ')[0]}, ang linggo mo ay puno ng pangyayari. Simula Lunes, bumababa ang kita mo — pero dumaan ka pa rin sa kada araw.</p>
              <p style={{ marginTop: 14 }}>Nung Huwebes, nag-scan ka ng <b style={{ color: '#fbbf24' }}>8 resibo</b> mula sa Divisoria. Nakita kong bumili ka ng supplies na hindi pa gamit — tingnan natin 'to sa susunod.</p>
              <p style={{ marginTop: 14 }}>Pero ang pinakaganda? <b style={{ color: '#fbbf24' }}>Sabado at Linggo.</b> Dalawang araw na sumobra sa target mo. Tumaas ang kita ng <b>34%</b> kumpara nung nakaraang linggo.</p>
              <p style={{ marginTop: 14 }}>Ngayon, heto ka — sa unang pagkakataon ngayong taon — may tubo kang <b>{formatPeso(p.stats.profit)}</b>. Hindi ito tsamba. Pinaghirapan mo.</p>
              <p style={{ marginTop: 14, fontStyle: 'italic', color: '#fde68a' }}>Maganda ang simula ng bago mong linggo. Kaya mo 'to. 💛</p>
            </>
          ) : (
            <>
              <p>{p.name.split(' ')[0]}, your week was eventful. Monday sales dipped — but you showed up anyway.</p>
              <p style={{ marginTop: 14 }}>Thursday you scanned <b style={{ color: '#fbbf24' }}>8 receipts</b> from Divisoria. I noticed some supplies are still unused — let's review next week.</p>
              <p style={{ marginTop: 14 }}>But the best part? <b style={{ color: '#fbbf24' }}>Saturday and Sunday.</b> Two straight days exceeding target. Revenue up <b>34%</b> vs last week.</p>
              <p style={{ marginTop: 14 }}>And now, for the first time this year, you've made a <b>{formatPeso(p.stats.profit)}</b> profit. This wasn't luck. This was you.</p>
              <p style={{ marginTop: 14, fontStyle: 'italic', color: '#fde68a' }}>Great start to your new week. You got this. 💛</p>
            </>
          )}
        </div>

        {/* Number highlights */}
        <div style={{ marginTop: 30, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: lang === 'fil' ? 'Pinaka-mabentang araw' : 'Best day', value: 'Sabado', sub: formatPeso(14200) },
            { label: lang === 'fil' ? 'Resibo na-scan' : 'Receipts scanned', value: '18', sub: lang === 'fil' ? 'record mo ito' : 'new record' },
            { label: lang === 'fil' ? 'Na-save sa oras' : 'Time saved', value: '4.2 hrs', sub: lang === 'fil' ? 'vs. Excel' : 'vs. Excel' },
            { label: lang === 'fil' ? 'Araw na in tubo' : 'Profitable days', value: '6/7', sub: '+2 vs. last wk' },
          ].map((s, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)',
              borderRadius: 14, padding: 14, border: '1px solid rgba(251,191,36,0.15)',
            }}>
              <div style={{ fontSize: 10, color: '#fde68a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
              <div className="serif" style={{ fontSize: 22, fontWeight: 600, marginTop: 4, letterSpacing: '-0.02em' }}>{s.value}</div>
              <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <button style={{
          marginTop: 24, width: '100%', padding: '14px',
          borderRadius: 14, background: 'rgba(251,191,36,0.15)',
          color: '#fde68a', fontWeight: 700, fontSize: 13,
          border: '1px solid rgba(251,191,36,0.3)',
        }}>
          📤 {lang === 'fil' ? 'I-share sa family' : 'Share with family'}
        </button>
      </div>
    </div>
  );
}

// ═══════════════ COSTING ═══════════════
function CostingScreen({ lang }) {
  const [cost, setCost] = useStateMisc(85);
  const [markup, setMarkup] = useStateMisc(45);
  const price = Math.round(cost * (1 + markup / 100));
  const profit = price - cost;
  return (
    <div className="scroll" style={{ flex: 1, overflow: 'auto', background: '#fdf9f2', padding: '18px 18px 80px' }}>
      <SectionLabel>📐 {lang === 'fil' ? 'PRICING AT COSTING' : 'PRICING & COSTING'}</SectionLabel>
      <div className="serif" style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 6, lineHeight: 1.2 }}>
        {lang === 'fil' ? 'Magkano dapat ang presyo?' : 'What should you charge?'}
      </div>

      <Card style={{ marginTop: 18, padding: 18 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink-soft)' }}>{lang === 'fil' ? 'Produkto' : 'Product'}</div>
        <input type="text" defaultValue={lang === 'fil' ? 'Lomi (Medium)' : 'Lomi (Medium)'} style={{
          width: '100%', fontSize: 18, fontWeight: 700, color: 'var(--ink)',
          border: 'none', padding: '6px 0', background: 'transparent',
          borderBottom: '2px solid #f59e0b',
        }}/>

        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink-soft)' }}>{lang === 'fil' ? 'Kapalit (bawat isa)' : 'Cost per unit'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <span className="serif" style={{ fontSize: 22, fontWeight: 600, color: 'var(--ink-faint)' }}>₱</span>
            <input type="number" value={cost} onChange={e => setCost(+e.target.value || 0)} style={{
              flex: 1, fontSize: 24, fontWeight: 700, border: 'none',
              background: 'transparent', color: 'var(--ink)',
            }}/>
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontWeight: 700, color: 'var(--ink-soft)' }}>
            <span>{lang === 'fil' ? 'Markup %' : 'Markup %'}</span>
            <span className="honey-text" style={{ fontWeight: 800 }}>{markup}%</span>
          </div>
          <input type="range" min="10" max="150" value={markup} onChange={e => setMarkup(+e.target.value)} style={{ width: '100%', accentColor: '#f59e0b', marginTop: 8 }}/>
        </div>
      </Card>

      <Card style={{ marginTop: 14, padding: 18, background: 'linear-gradient(135deg, #fef3c7, #fbbf24 150%)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {lang === 'fil' ? 'Inirekomenda ni Kai' : 'Kai recommends'}
        </div>
        <div className="serif honey-text" style={{ fontSize: 46, fontWeight: 700, letterSpacing: '-0.03em', marginTop: 2 }}>
          ₱{price}
        </div>
        <div style={{ fontSize: 12.5, color: '#7c2d12', fontWeight: 600, marginTop: 4 }}>
          {lang === 'fil' ? `Kita bawat isa: ₱${profit}` : `Profit per unit: ₱${profit}`}
        </div>
        <div style={{
          marginTop: 14, padding: 12, borderRadius: 12,
          background: 'rgba(255,255,255,0.7)', fontSize: 12, color: '#7c2d12', lineHeight: 1.4,
        }}>
          💡 {lang === 'fil'
            ? `Ang karibal mo (Lomi Shop sa tabi) — ₱${price + 10}. Pwede mo pang taasan.`
            : `Competitor nearby charges ₱${price + 10}. Room to raise.`}
        </div>
      </Card>
    </div>
  );
}

// ═══════════════ INVOICES + DRAFTS (stubs for nav) ═══════════════
function InvoicesScreen({ lang }) {
  const invoices = [
    { num: 'INV-0047', client: 'Aling Nena\'s Bakery', amount: 12400, status: 'paid', date: 'Nob 14' },
    { num: 'INV-0048', client: 'Ride Manila Co.', amount: 8500, status: 'pending', date: 'Nob 16' },
    { num: 'INV-0049', client: 'Cebu Exports Ltd.', amount: 35000, status: 'overdue', date: 'Nob 10' },
    { num: 'INV-0050', client: 'Davao Digital', amount: 18200, status: 'pending', date: 'Nob 18' },
  ];
  const statusColor = { paid: ['#d1f5ea', '#006b54'], pending: ['#fef3c7', '#92400e'], overdue: ['#fee2e2', '#b91c1c'] };
  const statusLabel = lang === 'fil'
    ? { paid: 'Bayad na', pending: 'Hinihintay', overdue: 'Late na' }
    : { paid: 'Paid', pending: 'Pending', overdue: 'Overdue' };
  return (
    <div className="scroll" style={{ flex: 1, overflow: 'auto', background: '#fdf9f2', padding: '18px 18px 80px' }}>
      <SectionLabel>🧾 {lang === 'fil' ? 'MGA INVOICE' : 'INVOICES'}</SectionLabel>
      <div className="serif" style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 6 }}>
        {lang === 'fil' ? 'Sinong may utang pa sa\'yo?' : 'Who still owes you?'}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 14, marginBottom: 14 }}>
        {[
          { label: lang === 'fil' ? 'Hinihintay' : 'Expected', amount: 61700, color: '#92400e' },
          { label: lang === 'fil' ? 'Late na' : 'Overdue', amount: 35000, color: '#b91c1c' },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, background: 'white', borderRadius: 14, padding: 14, border: '1px solid rgba(245,158,11,0.08)' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: s.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            <div className="serif" style={{ fontSize: 22, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.02em', marginTop: 2 }}>{formatPeso(s.amount)}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {invoices.map((inv, i) => (
          <div key={i} style={{ background: 'white', borderRadius: 14, padding: 14, display: 'flex', alignItems: 'center', gap: 10, border: '1px solid rgba(245,158,11,0.06)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-faint)', fontWeight: 700 }}>{inv.num}</div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)', marginTop: 2 }}>{inv.client}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 2 }}>{inv.date}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="serif" style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>{formatPeso(inv.amount)}</div>
              <div style={{
                fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 999,
                background: statusColor[inv.status][0], color: statusColor[inv.status][1],
                marginTop: 4, display: 'inline-block',
              }}>{statusLabel[inv.status]}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DraftsScreen({ lang }) {
  const drafts = [
    {
      customer: 'Marites Santos', avatar: 'MS', color: '#ec4899',
      incoming: lang === 'fil' ? 'May stock pa ba yung t-shirt size L? Kailan pwede pick-up?'
                                : 'Still have t-shirt size L? When can I pick up?',
      draft: lang === 'fil'
        ? 'Hi Ms. Marites! May 3 pieces pa po kami ng L. Pwede po kayong mag-pickup bukas (Mon) 10AM–6PM sa address namin sa Cebu. Reserve ko na po?'
        : 'Hi Ms. Marites! We have 3 pieces of L left. You can pick up tomorrow (Mon) 10AM–6PM at our Cebu location. Should I reserve for you?',
    },
    {
      customer: 'Juan Dela Cruz', avatar: 'JD', color: '#1ec89f',
      incoming: lang === 'fil' ? 'Magkano po pag 10 pcs?' : 'How much for 10 pcs?',
      draft: lang === 'fil'
        ? 'Sir Juan, para sa 10 pcs, meron po kaming wholesale price na ₱3,500 total (kasama na ang free shipping). Interested po ba?'
        : 'Sir Juan, for 10 pcs we offer wholesale at ₱3,500 total (free shipping included). Interested?',
    },
  ];
  return (
    <div className="scroll" style={{ flex: 1, overflow: 'auto', background: '#fdf9f2', padding: '18px 18px 80px' }}>
      <SectionLabel>💬 {lang === 'fil' ? 'MGA DRAFT NA REPLY' : 'REPLY DRAFTS'}</SectionLabel>
      <div className="serif" style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 6, lineHeight: 1.2 }}>
        {lang === 'fil' ? 'Tinulungan kita sa mga reply.' : 'I drafted your replies.'}
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 4 }}>
        {lang === 'fil' ? 'Review mo lang, tapos send.' : 'Just review, then send.'}
      </div>

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {drafts.map((d, i) => (
          <div key={i} style={{ background: 'white', borderRadius: 16, padding: 14, border: '1px solid rgba(245,158,11,0.08)', boxShadow: '0 4px 12px -2px rgba(245,158,11,0.08)' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: d.color, color: 'white', fontWeight: 700, fontSize: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{d.avatar}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{d.customer}</div>
                <div style={{ fontSize: 10.5, color: 'var(--ink-faint)' }}>Messenger · 2 min ago</div>
              </div>
            </div>
            <div style={{
              background: '#f7f3ec', padding: 12, borderRadius: 12,
              fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.4,
            }}>{d.incoming}</div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 10 }}>
              <Kai size={24} expression="happy"/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10.5, color: 'var(--honey-deep)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  {lang === 'fil' ? 'DRAFT NI KAI' : 'KAI\'S DRAFT'}
                </div>
                <div style={{
                  background: 'linear-gradient(135deg, #fef3c7, #ffffff)',
                  padding: 12, borderRadius: 12,
                  fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.45,
                  border: '1px solid rgba(245,158,11,0.2)',
                }}>{d.draft}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button style={{ flex: 1, padding: '10px', borderRadius: 10, background: '#f7f3ec', color: 'var(--ink-soft)', fontWeight: 700, fontSize: 12 }}>
                ✏️ {lang === 'fil' ? 'Palitan' : 'Edit'}
              </button>
              <button style={{ flex: 2, padding: '10px', borderRadius: 10, background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', fontWeight: 700, fontSize: 12, boxShadow: '0 4px 10px rgba(245,158,11,0.3)' }}>
                ✓ {lang === 'fil' ? 'Approve at Send' : 'Approve & Send'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════ ONBOARDING — Kilala Kita ═══════════════
function OnboardingScreen({ lang, onDone }) {
  const [step, setStep] = useStateMisc(0);
  const steps = lang === 'fil' ? [
    { q: 'Kamusta! Ako si Kai.', sub: 'Magiging ka-partner mo ako sa negosyo. Pakilala muna tayo?', input: 'name', placeholder: 'Pangalan mo' },
    { q: 'Anong klase ng negosyo?', sub: 'Para alam ko kung paano kita tulungan.', input: 'choice', options: ['🏪 Sari-sari store', '👚 Online reseller', '🎨 Freelance', '🍜 Karinderya', '✨ Iba pa'] },
    { q: 'Magkano tantiya ng benta kada buwan?', sub: 'Okay lang kung approximate — i-refine natin mamaya.', input: 'choice', options: ['< ₱20K', '₱20K – ₱50K', '₱50K – ₱150K', '₱150K+'] },
    { q: 'Ano pinaka-hirap mo sa negosyo ngayon?', sub: 'Dito ko uumpisahan.', input: 'choice', options: ['😩 BIR / Taxes', '💰 Cash flow', '📊 Tracking ng gastos', '💬 Customer replies'] },
  ] : [
    { q: 'Hi! I\'m Kai.', sub: 'I\'ll be your business partner. Let\'s get to know each other?', input: 'name', placeholder: 'Your name' },
    { q: 'What kind of business?', sub: 'So I know how to help you.', input: 'choice', options: ['🏪 Sari-sari store', '👚 Online reseller', '🎨 Freelance', '🍜 Karinderya', '✨ Other'] },
    { q: 'Monthly sales estimate?', sub: 'Approximate is fine — we\'ll refine later.', input: 'choice', options: ['< ₱20K', '₱20K – ₱50K', '₱50K – ₱150K', '₱150K+'] },
    { q: 'Biggest business challenge?', sub: 'That\'s where I\'ll start.', input: 'choice', options: ['😩 BIR / Taxes', '💰 Cash flow', '📊 Expense tracking', '💬 Customer replies'] },
  ];

  const s = steps[step];
  return (
    <div style={{ flex: 1, background: 'linear-gradient(180deg, #fef3c7 0%, #fdf9f2 60%)', padding: '18px 20px', display: 'flex', flexDirection: 'column' }}>
      {/* progress */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {steps.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: i <= step ? 'linear-gradient(90deg, #f59e0b, #d97706)' : 'rgba(245,158,11,0.15)',
            transition: 'all 0.3s',
          }}/>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 12, marginBottom: 20, position: 'relative' }}>
        <div style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)' }}>
          <Sunburst size={160}/>
        </div>
        <div className="kai-float" style={{ position: 'relative' }}>
          <Kai size={90} expression={step === 0 ? 'happy' : step === 3 ? 'thinking' : 'happy'} glow animated/>
        </div>
      </div>

      <div className="serif" style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em', textAlign: 'center', lineHeight: 1.15 }}>
        {s.q}
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink-soft)', textAlign: 'center', marginTop: 8, maxWidth: 300, marginLeft: 'auto', marginRight: 'auto' }}>
        {s.sub}
      </div>

      <div style={{ marginTop: 26, flex: 1 }}>
        {s.input === 'name' ? (
          <input placeholder={s.placeholder} style={{
            width: '100%', padding: '16px', borderRadius: 14,
            border: '2px solid rgba(245,158,11,0.2)', background: 'white',
            fontSize: 16, fontWeight: 600, color: 'var(--ink)', textAlign: 'center',
          }}/>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {s.options.map(opt => (
              <button key={opt} onClick={() => step < steps.length - 1 ? setStep(step + 1) : onDone()} style={{
                padding: '14px 16px', borderRadius: 14,
                background: 'white', border: '1px solid rgba(245,158,11,0.15)',
                textAlign: 'left', fontSize: 14, fontWeight: 600, color: 'var(--ink)',
                transition: 'all 0.15s',
                boxShadow: '0 2px 6px rgba(245,158,11,0.05)',
              }}>{opt}</button>
            ))}
          </div>
        )}
      </div>

      <button onClick={() => step < steps.length - 1 ? setStep(step + 1) : onDone()} style={{
        padding: '14px', borderRadius: 14,
        background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white',
        fontWeight: 800, fontSize: 15,
        boxShadow: '0 8px 20px rgba(245,158,11,0.4)',
      }}>
        {step < steps.length - 1 ? (lang === 'fil' ? 'Susunod →' : 'Next →') : (lang === 'fil' ? 'Tara na!' : 'Let\'s go!')}
      </button>
    </div>
  );
}

Object.assign(window, { CheckinScreen, SundayStoryScreen, CostingScreen, InvoicesScreen, DraftsScreen, OnboardingScreen });
