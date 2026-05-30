/* global React, Kai, PesoNum, Tag, PERSONAS, WEEK_DATA, genExpenses */
const { useState: useChatState, useRef: useChatRef, useEffect: useChatEffect } = React;

function ChatScreen({ persona, lang }) {
  const p = PERSONAS[persona];
  const week = WEEK_DATA[persona];
  const wkRev = week.reduce((a, d) => a + d.rev, 0);
  const wkProfit = wkRev - week.reduce((a, d) => a + d.exp, 0);
  const exp = genExpenses(persona);
  const top = exp.slice().sort((a, b) => b.amount - a.amount)[0];
  const catName = (c) => ({
    fil: { supplies: 'Paninda', utilities: 'Kuryente/Tubig', transport: 'Pamasahe', rent: 'Upa', marketing: 'Ads', misc: 'Iba pa' },
    en:  { supplies: 'Supplies', utilities: 'Utilities', transport: 'Transport', rent: 'Rent', marketing: 'Ads', misc: 'Other' },
  }[lang][c] || c);

  const now = () => new Date().toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });

  const t = lang === 'fil' ? {
    status: 'Nandito ako para sa\u2019yo',
    hello: `Kumusta, ${p.name.split(' ')[0]}! Ano\u2019ng gusto mong malaman? Pwede mo akong tanungin kung saan napunta ang pera mo.`,
    chips: ['Saan napunta ang pera ko?', 'Magkano kita ko this week?', 'Kailan ang susunod na deadline?'],
    placeholder: 'Magtanong kay Kai\u2026',
    rWhere: `Pinakamalaki ngayong buwan: ${catName(top.cat)}. Tingnan mo \u2014 mga ${Math.round(top.pct)}% ng gastos mo dito napunta.`,
    rWhereConfirm: 'Gusto mo bang i-breakdown ko pa?',
    rIncome: `Ngayong linggo, kumita ka ng halagang ito. Ang tubo mo: maganda \u2014 tuloy lang!`,
    rDeadline: '3 araw na lang bago ang 2551Q mo. Wag kang mag-alala \u2014 i-prepare natin ngayon ang numero mo.',
    rFallback: 'Naiintindihan ko. Hayaan mong tingnan ko ang numero mo\u2026 nandito lang ako kung may iba ka pang tanong.',
  } : {
    status: 'I\u2019m here for you',
    hello: `Hi ${p.name.split(' ')[0]}! What would you like to know? You can ask me where your money went.`,
    chips: ['Where did my money go?', 'How much did I earn this week?', 'When\u2019s my next deadline?'],
    placeholder: 'Ask Kai\u2026',
    rWhere: `Biggest this month: ${catName(top.cat)}. See \u2014 about ${Math.round(top.pct)}% of your spending went here.`,
    rWhereConfirm: 'Want me to break it down further?',
    rIncome: 'This week you earned this much. Your profit looks healthy \u2014 keep going!',
    rDeadline: 'Just 3 days until your 2551Q. Don\u2019t worry \u2014 let\u2019s prep your numbers now.',
    rFallback: 'I understand. Let me look at your numbers\u2026 I\u2019m right here if you have other questions.',
  };

  const [msgs, setMsgs] = useChatState([{ who: 'kai', text: t.hello, tone: 'warm', time: now() }]);
  const [typing, setTyping] = useChatState(false);
  const [draft, setDraft] = useChatState('');
  const [showChips, setShowChips] = useChatState(true);
  const scrollRef = useChatRef(null);

  useChatEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, typing]);

  function reply(text) {
    const q = text.toLowerCase();
    if (/saan|napunta|where|money go|spend/.test(q)) {
      return { text: t.rWhere, card: { type: 'where' }, follow: t.rWhereConfirm };
    }
    if (/kita|earn|income|magkano.*(kita|this week)|how much/.test(q)) {
      return { text: t.rIncome, card: { type: 'income' } };
    }
    if (/deadline|2551|bir|kailan|when/.test(q)) {
      return { text: t.rDeadline, tone: 'concern' };
    }
    return { text: t.rFallback };
  }

  function send(text) {
    const v = (text ?? draft).trim();
    if (!v) return;
    setShowChips(false);
    setMsgs(m => [...m, { who: 'me', text: v, time: now() }]);
    setDraft('');
    setTyping(true);
    setTimeout(() => {
      const r = reply(v);
      setTyping(false);
      setMsgs(m => [...m, { who: 'kai', text: r.text, tone: r.tone, card: r.card, time: now() }]);
      if (r.follow) {
        setTimeout(() => setMsgs(m => [...m, { who: 'kai', text: r.follow, time: now() }]), 700);
      }
    }, 950);
  }

  return (
    <div className="app-scroll" style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div className="chat-topbar">
        <span style={{ display: 'inline-flex', width: 40, height: 40, borderRadius: '50%', background: 'var(--secondary)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Kai size={32} expression="happy" animated={false} />
        </span>
        <div>
          <div className="h3" style={{ fontSize: 17 }}>Kai</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--teal)', fontWeight: 600 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--teal)' }} />{t.status}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-scroll" ref={scrollRef} style={{ flex: 1, overflowY: 'auto' }}>
        {msgs.map((m, i) => m.who === 'me' ? (
          <div className="chat-row me" key={i}>
            <div>
              <div className="bubble-me">{m.text}</div>
              <div className="chat-time me">{m.time}</div>
            </div>
          </div>
        ) : (
          <div className="chat-row" key={i}>
            <span style={{ flexShrink: 0 }}><Kai size={30} expression={m.tone === 'concern' ? 'concerned' : 'happy'} animated={false} /></span>
            <div>
              <div className={`bubble-kai${m.tone === 'warm' ? ' warm' : ''}`}>{m.text}</div>
              {m.card && <ChatCard card={m.card} lang={lang} catName={catName} exp={exp} top={top} wkRev={wkRev} wkProfit={wkProfit} />}
              <div className="chat-time">{m.time}</div>
            </div>
          </div>
        ))}
        {typing && (
          <div className="chat-row">
            <span style={{ flexShrink: 0 }}><Kai size={30} expression="thinking" animated={false} /></span>
            <div className="bubble-kai"><span className="typing"><i /><i /><i /></span></div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="chat-composer">
        {showChips && (
          <div className="chip-scroll">
            {t.chips.map((c, i) => (
              <button key={i} className="chip chip-suggest" onClick={() => send(c)}>{c}</button>
            ))}
          </div>
        )}
        <div className="composer-row">
          <textarea className="composer-input" rows={1} value={draft} placeholder={t.placeholder}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
          <button className="send-btn" disabled={!draft.trim()} onClick={() => send()} aria-label="Send">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 12 L20 5 L13 20 L11 13 Z" fill="#fff" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatCard({ card, lang, catName, exp, top, wkRev, wkProfit }) {
  const colors = { supplies: '#d97706', utilities: '#006b54', transport: '#855300', rent: '#9a4a2e', marketing: '#c0392b', misc: '#8a7558' };
  if (card.type === 'where') {
    const sorted = exp.slice().sort((a, b) => b.amount - a.amount).slice(0, 4);
    return (
      <div className="card-float" style={{ marginTop: 8, padding: 14, maxWidth: 280 }}>
        <div className="label" style={{ marginBottom: 8 }}>{lang === 'fil' ? 'Saan napunta' : 'Where it went'}</div>
        {sorted.map((c, i) => (
          <div className="cat-row" key={i}>
            <span className="cat-dot" style={{ background: colors[c.cat] }} />
            <span className="cat-name">{catName(c.cat)}</span>
            <PesoNum value={c.amount} size="sm" short countUp={false} />
          </div>
        ))}
      </div>
    );
  }
  if (card.type === 'income') {
    return (
      <div className="card-float" style={{ marginTop: 8, padding: '14px 16px', maxWidth: 240 }}>
        <div className="label" style={{ marginBottom: 6 }}>{lang === 'fil' ? 'Ngayong linggo' : 'This week'}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <span className="body-variant">{lang === 'fil' ? 'Kita' : 'Income'}</span><PesoNum value={wkRev} size="md" short countUp={false} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span className="body-variant">{lang === 'fil' ? 'Tubo' : 'Profit'}</span><PesoNum value={wkProfit} size="md" short countUp={false} />
        </div>
      </div>
    );
  }
  return null;
}

window.ChatScreen = ChatScreen;
