/* global React, Kai, KaiBubble, UserBubble, TypingBubble, Card, Chip, SectionLabel, PERSONAS, COPY, formatPeso, pesoShort */
const { useState: useStateChat, useEffect: useEffectChat, useRef: useRefChat } = React;

// ═══════════════ CHAT WITH KAI ═══════════════
function ChatScreen({ persona, copy, lang, onKaiState, onBack }) {
  const p = PERSONAS[persona];
  const c = COPY[lang];

  const seedMessages = lang === 'fil' ? [
    { from: 'kai', text: <>Kumusta {p.name.split(' ')[0]}! 🌅 Ako si Kai, katuwang mo sa negosyo. Ano'ng maitutulong ko ngayong araw?</>, time: '7:42 AM' },
    { from: 'kai', text: <>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>Quick heads-up:</div>
      Nakita ko sa ledger mo na mababa ang <b>margin mo sa t-shirts</b> ngayong linggo — baka kailangan natin i-review. Gusto mo bang tingnan natin?
    </>, time: '7:43 AM' },
  ] : [
    { from: 'kai', text: <>Hey {p.name.split(' ')[0]}! 🌅 I'm Kai, your business partner. What can I help you with today?</>, time: '7:42 AM' },
    { from: 'kai', text: <><div style={{ fontWeight: 700, marginBottom: 4 }}>Heads up:</div>Your <b>t-shirt margin</b> dropped this week — want to look at it together?</>, time: '7:43 AM' },
  ];

  const [messages, setMessages] = useStateChat(seedMessages);
  const [input, setInput] = useStateChat('');
  const [typing, setTyping] = useStateChat(false);
  const scrollRef = useRefChat(null);

  useEffectChat(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing]);

  // Reset when persona/lang changes
  useEffectChat(() => { setMessages(seedMessages); }, [persona, lang]);

  async function send() {
    const txt = input.trim();
    if (!txt) return;
    const now = new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    setMessages(m => [...m, { from: 'user', text: txt, time: now }]);
    setInput('');
    setTyping(true);
    onKaiState && onKaiState('thinking');

    try {
      const systemPrompt = `You are Kai, a warm, supportive AI business partner for Filipino MSMEs (micro, small, medium enterprises). You are the AI assistant inside the AKBai app. The user is ${p.name}, who runs ${p.biz} (${p.bizType}) in ${p.location}. Their monthly revenue is ₱${p.stats.revenue.toLocaleString()}, expenses ₱${p.stats.expenses.toLocaleString()}, profit ₱${p.stats.profit.toLocaleString()} (${p.stats.margin}% margin).

Respond in ${lang === 'fil' ? 'warm conversational Taglish/Filipino (mostly Tagalog with natural English loanwords that Filipinos use)' : 'warm conversational English'}. Keep replies SHORT — 2-3 sentences max. Be practical, encouraging, and specific. You know about BIR taxes (2551Q, 1701Q), cash flow, pricing, customer service. Never be robotic — you are a ka-partner, not a chatbot. Use "ka" and "mo" (informal) ${lang === 'fil' ? 'in Filipino' : ''}. Never use emoji unless the user does first.`;

      const reply = await window.claude.complete({
        messages: [
          { role: 'user', content: `[System context: ${systemPrompt}]\n\nUser says: ${txt}` },
        ],
      });

      setTyping(false);
      onKaiState && onKaiState('idle');
      setMessages(m => [...m, {
        from: 'kai',
        text: reply || (lang === 'fil' ? 'Teka lang, nagpo-proseso pa ako.' : 'Let me think on that.'),
        time: new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
      }]);
    } catch (e) {
      setTyping(false);
      onKaiState && onKaiState('idle');
      setMessages(m => [...m, {
        from: 'kai',
        text: lang === 'fil' ? 'Ay, may problema sa koneksyon. Subukan ulit?' : 'Connection hiccup. Try again?',
        time: new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
      }]);
    }
  }

  const quickActions = lang === 'fil'
    ? ['Saan napunta ang pera ko?', 'Kailan yung BIR deadline?', 'Magkano dapat presyo ng t-shirt?', 'I-record: ₱450 pagkain']
    : ['Where did my money go?', 'When is the BIR deadline?', 'How much to price a t-shirt?', 'Log ₱450 for food'];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fdf9f2', position: 'relative' }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px 12px',
        background: 'linear-gradient(180deg, #fef3c7 0%, #fdf9f2 100%)',
        borderBottom: '1px solid rgba(245,158,11,0.1)',
        display: 'flex', alignItems: 'center', gap: 10,
        position: 'relative',
      }}>
        <button onClick={onBack} style={{
          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="#534434" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={{ position: 'relative' }}>
          <Kai size={40} expression={typing ? 'thinking' : 'happy'} glow animated/>
        </div>
        <div style={{ flex: 1 }}>
          <div className="serif" style={{ fontSize: 17, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em' }}>Kai</div>
          <div style={{ fontSize: 11, color: '#006b54', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1ec89f' }}/>
            {lang === 'fil' ? 'Nandito ako para sa\'yo' : 'Here for you'}
          </div>
        </div>
        <button style={{ padding: 8, borderRadius: 999, background: 'rgba(255,255,255,0.6)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="5" r="1.5" fill="#534434"/>
            <circle cx="12" cy="12" r="1.5" fill="#534434"/>
            <circle cx="12" cy="19" r="1.5" fill="#534434"/>
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="scroll" style={{
        flex: 1, overflow: 'auto', padding: '16px 14px 10px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {messages.map((m, i) => m.from === 'kai'
          ? <div key={i} className="slide-up"><KaiBubble time={m.time}>{m.text}</KaiBubble></div>
          : <div key={i} className="slide-up"><UserBubble time={m.time}>{m.text}</UserBubble></div>
        )}
        {typing && <div className="slide-up"><TypingBubble/></div>}
      </div>

      {/* Quick actions */}
      {messages.length <= 3 && (
        <div style={{ padding: '0 14px 8px' }}>
          <div className="scroll" style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
            {quickActions.map((qa, i) => (
              <button key={i} onClick={() => setInput(qa)} style={{
                flexShrink: 0, padding: '8px 14px', borderRadius: 999,
                background: 'white', border: '1px solid rgba(245,158,11,0.25)',
                fontSize: 12, fontWeight: 600, color: 'var(--honey-deep)',
                boxShadow: '0 2px 4px rgba(245,158,11,0.08)',
              }}>{qa}</button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div style={{
        padding: '10px 12px 12px',
        background: 'white', borderTop: '1px solid rgba(245,158,11,0.1)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <button style={{
          width: 38, height: 38, borderRadius: '50%',
          background: '#f7f3ec', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>📷</button>
        <div style={{ flex: 1, background: '#f7f3ec', borderRadius: 999, padding: '2px 4px 2px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send(); }}
            placeholder={c.askKai}
            style={{
              flex: 1, background: 'transparent', border: 'none',
              fontSize: 14, padding: '10px 0', color: 'var(--ink)',
            }}
          />
          <button onClick={send} style={{
            width: 34, height: 34, borderRadius: '50%',
            background: input.trim() ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#e8e1d6',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: input.trim() ? '0 4px 12px rgba(245,158,11,0.4)' : 'none',
            transition: 'all 0.2s',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M4 12l16-8-6 16-2-6-8-2z" fill="white" stroke="white" strokeWidth="1" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ChatScreen });
