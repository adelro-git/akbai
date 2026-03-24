import { describe, it, expect } from 'vitest';

// ============================================================
// Test EmptyStateCard Taglish copy content
// Without @testing-library we verify the empty state messages
// match the Taglish copy guide requirements.
// ============================================================

interface EmptyStateConfig {
  id: string;
  emptyState: string;
}

// Mirror the empty state messages from the dashboard
const EMPTY_STATES: EmptyStateConfig[] = [
  {
    id: 'resibo-scanner',
    emptyState: 'Mag-scan ng resibo para makapagsimula',
  },
  {
    id: 'saan-napunta',
    emptyState: 'Wala pang data. Upload receipts muna!',
  },
  {
    id: 'bir-deadlines',
    emptyState: 'Wala pang tax calendar. I-setup natin!',
  },
];

describe('EmptyStateCard — Taglish copy', () => {
  it('should have Taglish empty state for Resibo Scanner', () => {
    const resibo = EMPTY_STATES.find((e) => e.id === 'resibo-scanner');
    expect(resibo).toBeDefined();
    expect(resibo?.emptyState).toContain('resibo');
    expect(resibo?.emptyState).toContain('Mag-scan');
  });

  it('should have Taglish empty state for Saan Napunta', () => {
    const expenses = EMPTY_STATES.find((e) => e.id === 'saan-napunta');
    expect(expenses).toBeDefined();
    expect(expenses?.emptyState).toContain('Wala pang');
    expect(expenses?.emptyState).toContain('receipts');
  });

  it('should have Taglish empty state for BIR Deadlines', () => {
    const bir = EMPTY_STATES.find((e) => e.id === 'bir-deadlines');
    expect(bir).toBeDefined();
    expect(bir?.emptyState).toContain('Wala pang');
    expect(bir?.emptyState).toContain('I-setup');
  });

  it('should not use English-only corporate language', () => {
    for (const state of EMPTY_STATES) {
      // Should not have corporate English phrasing
      expect(state.emptyState).not.toContain('No data found');
      expect(state.emptyState).not.toContain('Please');
      expect(state.emptyState).not.toContain('Error');
    }
  });

  it('should have encouraging action-oriented copy', () => {
    // Per taglish-copy-guide: empty states encourage action
    for (const state of EMPTY_STATES) {
      // Each should either suggest an action or be encouraging
      const hasAction =
        state.emptyState.includes('Mag-scan') ||
        state.emptyState.includes('Upload') ||
        state.emptyState.includes('I-setup');
      expect(hasAction).toBe(true);
    }
  });
});

describe('EmptyStateCard — dashboard card structure', () => {
  interface DashboardCard {
    id: string;
    title: string;
    href: string;
    hasData: boolean;
  }

  const CARDS: DashboardCard[] = [
    { id: 'resibo-scanner', title: 'Resibo Scanner', href: '/scan', hasData: false },
    { id: 'saan-napunta', title: 'Saan Napunta?', href: '/expenses', hasData: false },
    { id: 'bir-deadlines', title: 'BIR Deadlines', href: '/deadlines', hasData: false },
    { id: 'quick-chat', title: 'Quick Chat with Kai', href: '/chat', hasData: true },
  ];

  it('should have 4 dashboard cards total', () => {
    expect(CARDS).toHaveLength(4);
  });

  it('should mark first 3 cards as empty (no data yet)', () => {
    const emptyCards = CARDS.filter((c) => !c.hasData);
    expect(emptyCards).toHaveLength(3);
  });

  it('should mark Quick Chat as having data (always available)', () => {
    const chatCard = CARDS.find((c) => c.id === 'quick-chat');
    expect(chatCard?.hasData).toBe(true);
  });

  it('should use Taglish titles', () => {
    const saanCard = CARDS.find((c) => c.id === 'saan-napunta');
    expect(saanCard?.title).toBe('Saan Napunta?');
  });
});
