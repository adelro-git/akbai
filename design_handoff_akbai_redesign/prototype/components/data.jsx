/* global React, Kai, KaiBubble, UserBubble, TypingBubble */
// Personas, data states, copy

const PERSONAS = {
  maria: {
    id: 'maria',
    name: 'Maria Santos',
    biz: 'Maria\'s Ukay-Ukay',
    bizType: 'Online reseller',
    location: 'Cebu City',
    emoji: '👚',
    initials: 'MS',
    avatarBg: '#fbbf24',
    tagline: 'Nag-a-ukay sa FB at Shopee',
    stats: { revenue: 186500, expenses: 142300, profit: 44200, margin: 23.7, scans: 47 },
  },
  jose: {
    id: 'jose',
    name: 'Jose Reyes',
    biz: 'Tindahan ni Kuya Jose',
    bizType: 'Sari-sari store',
    location: 'Bulacan',
    emoji: '🏪',
    initials: 'JR',
    avatarBg: '#fb923c',
    tagline: 'Nagtitinda ng pang-araw-araw',
    stats: { revenue: 98200, expenses: 81400, profit: 16800, margin: 17.1, scans: 23 },
  },
  ana: {
    id: 'ana',
    name: 'Ana Cruz',
    biz: 'Ana Designs',
    bizType: 'Freelance graphic designer',
    location: 'Manila',
    emoji: '🎨',
    initials: 'AC',
    avatarBg: '#1ec89f',
    tagline: 'Freelance design + 1099 client',
    stats: { revenue: 142000, expenses: 28400, profit: 113600, margin: 80.0, scans: 12 },
  },
  andoy: {
    id: 'andoy',
    name: 'Andoy Dela Peña',
    biz: 'Andoy\'s Lomi House',
    bizType: 'Karinderya',
    location: 'Batangas',
    emoji: '🍜',
    initials: 'AD',
    avatarBg: '#dc2626',
    tagline: 'Lomi at silog, simula umaga',
    stats: { revenue: 124700, expenses: 89300, profit: 35400, margin: 28.4, scans: 31 },
  },
};

// Copy in Filipino + English for voice toggle
const COPY = {
  fil: {
    goodMorning: 'Magandang umaga',
    morningGreeting: 'Ang Umaga Mo',
    youGotThis: 'Kaya mo \'yan!',
    todayPlan: 'Ito ang plano natin ngayon',
    deadlines: 'Mga Paalala',
    daysLeft: 'araw na lang',
    dueToday: 'Ngayong araw!',
    profit: 'Tubo',
    revenue: 'Kita',
    expenses: 'Gastos',
    margin: 'Margin',
    scanReceipt: 'Kuhanan ng Litrato',
    saanNapunta: 'Saan Napunta ang Pera?',
    thisMonth: 'Ngayong buwan',
    lastMonth: 'Nakaraang buwan',
    vsLastMonth: 'kaysa nakaraang buwan',
    up: 'taas',
    down: 'baba',
    kamusta: 'Kamusta ang araw mo?',
    dailyCheckin: 'Daily Check-In',
    sundayStory: 'Sunday Story',
    weeklyRecap: 'Linggong Pagbabalik-tanaw',
    drafts: 'Mga Draft na Reply',
    costing: 'Pricing at Costing',
    invoices: 'Mga Invoice',
    briefing: 'Briefing',
    askKai: 'Magtanong kay Kai...',
    send: 'Send',
    saveBtn: 'I-save',
    tapahu: 'Tap para makita',
    categories: {
      supplies: 'Paninda', utilities: 'Kuryente/Tubig', transport: 'Pamasahe',
      rent: 'Upa', food: 'Pagkain', misc: 'Iba pa', marketing: 'Ads',
    },
  },
  en: {
    goodMorning: 'Good morning',
    morningGreeting: 'Your Morning',
    youGotThis: 'You got this!',
    todayPlan: 'Here\'s today\'s plan',
    deadlines: 'Reminders',
    daysLeft: 'days left',
    dueToday: 'Due today!',
    profit: 'Profit',
    revenue: 'Revenue',
    expenses: 'Expenses',
    margin: 'Margin',
    scanReceipt: 'Scan receipt',
    saanNapunta: 'Where did the money go?',
    thisMonth: 'This month',
    lastMonth: 'Last month',
    vsLastMonth: 'vs. last month',
    up: 'up', down: 'down',
    kamusta: 'How\'s your day?',
    dailyCheckin: 'Daily Check-In',
    sundayStory: 'Sunday Story',
    weeklyRecap: 'Weekly Recap',
    drafts: 'Reply Drafts',
    costing: 'Pricing & Costing',
    invoices: 'Invoices',
    briefing: 'Briefing',
    askKai: 'Ask Kai...',
    send: 'Send',
    saveBtn: 'Save',
    tapahu: 'Tap to view',
    categories: {
      supplies: 'Supplies', utilities: 'Utilities', transport: 'Transport',
      rent: 'Rent', food: 'Food', misc: 'Other', marketing: 'Marketing',
    },
  },
};

// Generate rich expense data for power user
function genExpenses(persona) {
  const base = PERSONAS[persona].stats.expenses;
  const allocations = {
    maria: { supplies: 0.62, marketing: 0.14, transport: 0.11, utilities: 0.06, misc: 0.07 },
    jose: { supplies: 0.78, utilities: 0.09, transport: 0.05, rent: 0.06, misc: 0.02 },
    ana: { marketing: 0.42, utilities: 0.18, supplies: 0.22, transport: 0.10, misc: 0.08 },
    andoy: { supplies: 0.58, utilities: 0.14, rent: 0.13, transport: 0.08, misc: 0.07 },
  }[persona];
  return Object.entries(allocations).map(([cat, pct]) => ({
    cat, amount: Math.round(base * pct), pct: pct * 100,
  }));
}

// Receipt samples
const SAMPLE_RECEIPTS = [
  { vendor: 'Divisoria Fabrics', amount: 3240, date: 'Nob 18', cat: 'supplies', items: 12 },
  { vendor: 'Meralco', amount: 2180, date: 'Nob 17', cat: 'utilities', items: 1 },
  { vendor: 'Grab - Delivery', amount: 185, date: 'Nob 17', cat: 'transport', items: 1 },
  { vendor: 'FB Ads', amount: 1500, date: 'Nob 16', cat: 'marketing', items: 1 },
  { vendor: 'Palengke - Pasig', amount: 890, date: 'Nob 16', cat: 'supplies', items: 8 },
  { vendor: 'Shopee Packaging', amount: 450, date: 'Nob 15', cat: 'supplies', items: 3 },
];

// Weekly data for charts (power user Day 30)
const WEEK_DATA = {
  maria: [
    { day: 'L', rev: 8200, exp: 5100 }, { day: 'M', rev: 9400, exp: 6200 },
    { day: 'M', rev: 7200, exp: 4800 }, { day: 'H', rev: 11200, exp: 7300 },
    { day: 'B', rev: 12800, exp: 7900 }, { day: 'S', rev: 14200, exp: 8400 },
    { day: 'L', rev: 9600, exp: 5800 },
  ],
  jose: [
    { day: 'L', rev: 3200, exp: 2600 }, { day: 'M', rev: 3400, exp: 2800 },
    { day: 'M', rev: 3100, exp: 2500 }, { day: 'H', rev: 3600, exp: 2900 },
    { day: 'B', rev: 4200, exp: 3400 }, { day: 'S', rev: 5100, exp: 4100 },
    { day: 'L', rev: 4800, exp: 3900 },
  ],
  ana: [
    { day: 'L', rev: 0, exp: 200 }, { day: 'M', rev: 18000, exp: 400 },
    { day: 'M', rev: 0, exp: 180 }, { day: 'H', rev: 0, exp: 320 },
    { day: 'B', rev: 35000, exp: 680 }, { day: 'S', rev: 0, exp: 0 },
    { day: 'L', rev: 0, exp: 0 },
  ],
  andoy: [
    { day: 'L', rev: 4200, exp: 2800 }, { day: 'M', rev: 4600, exp: 3100 },
    { day: 'M', rev: 4100, exp: 2700 }, { day: 'H', rev: 5200, exp: 3400 },
    { day: 'B', rev: 6800, exp: 4200 }, { day: 'S', rev: 7400, exp: 4600 },
    { day: 'L', rev: 6200, exp: 3900 },
  ],
};

function formatPeso(n) {
  return '₱' + Math.round(n).toLocaleString('en-PH');
}

function pesoShort(n) {
  if (n >= 1000000) return '₱' + (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return '₱' + (n / 1000).toFixed(1) + 'K';
  return '₱' + Math.round(n);
}

Object.assign(window, { PERSONAS, COPY, genExpenses, SAMPLE_RECEIPTS, WEEK_DATA, formatPeso, pesoShort });
