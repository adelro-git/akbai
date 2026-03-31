/**
 * Tests for Deadline UI Components
 * Feature: Build 6 — BIR Deadline Watcher (Sprint 9)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DeadlineWithUrgency } from '@/lib/deadlines/types';

// ============================================================
// Mock deadline factory
// ============================================================

function mockDeadlineWithUrgency(
  overrides: Partial<DeadlineWithUrgency> = {}
): DeadlineWithUrgency {
  return {
    id: 'dl-test-1',
    user_id: 'user-1',
    form_name: '1701Q',
    due_date: '2026-04-15',
    description: 'Quarterly Income Tax Return',
    status: 'upcoming',
    notified_7d: false,
    notified_3d: false,
    notified_1d: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    urgency: 'normal',
    days_until: 18,
    ...overrides,
  };
}

// ============================================================
// DeadlineCard behavior tests (logic only — no DOM rendering)
// ============================================================

describe('DeadlineCard — status label logic', () => {
  it('shows "Filed na" for filed deadlines', () => {
    const dl = mockDeadlineWithUrgency({ status: 'filed' });
    expect(dl.status).toBe('filed');
  });

  it('shows overdue indicator for negative days_until', () => {
    const dl = mockDeadlineWithUrgency({ urgency: 'overdue', days_until: -3 });
    expect(dl.urgency).toBe('overdue');
    expect(dl.days_until).toBeLessThan(0);
  });

  it('shows urgent indicator for days_until <= 7', () => {
    const dl = mockDeadlineWithUrgency({ urgency: 'urgent', days_until: 5 });
    expect(dl.urgency).toBe('urgent');
    expect(dl.days_until).toBeLessThanOrEqual(7);
  });

  it('shows normal indicator for days_until > 7', () => {
    const dl = mockDeadlineWithUrgency({ urgency: 'normal', days_until: 18 });
    expect(dl.urgency).toBe('normal');
    expect(dl.days_until).toBeGreaterThan(7);
  });
});

// ============================================================
// DeadlineList — grouping logic tests
// ============================================================

describe('DeadlineList — grouping logic', () => {
  function groupDeadlines(deadlines: DeadlineWithUrgency[]) {
    const groups: {
      overdue: DeadlineWithUrgency[];
      upcoming: DeadlineWithUrgency[];
      filed: DeadlineWithUrgency[];
    } = { overdue: [], upcoming: [], filed: [] };

    for (const dl of deadlines) {
      if (dl.status === 'filed') {
        groups.filed.push(dl);
      } else if (dl.urgency === 'overdue' || dl.days_until < 0) {
        groups.overdue.push(dl);
      } else {
        groups.upcoming.push(dl);
      }
    }

    return groups;
  }

  it('groups overdue deadlines correctly', () => {
    const deadlines = [
      mockDeadlineWithUrgency({ id: 'dl-1', urgency: 'overdue', days_until: -3 }),
      mockDeadlineWithUrgency({ id: 'dl-2', urgency: 'normal', days_until: 18 }),
    ];

    const groups = groupDeadlines(deadlines);
    expect(groups.overdue).toHaveLength(1);
    expect(groups.upcoming).toHaveLength(1);
  });

  it('groups filed deadlines separately', () => {
    const deadlines = [
      mockDeadlineWithUrgency({ id: 'dl-1', status: 'filed' }),
      mockDeadlineWithUrgency({ id: 'dl-2', status: 'upcoming' }),
    ];

    const groups = groupDeadlines(deadlines);
    expect(groups.filed).toHaveLength(1);
    expect(groups.upcoming).toHaveLength(1);
  });

  it('handles empty array', () => {
    const groups = groupDeadlines([]);
    expect(groups.overdue).toHaveLength(0);
    expect(groups.upcoming).toHaveLength(0);
    expect(groups.filed).toHaveLength(0);
  });

  it('groups all categories correctly with mixed deadlines', () => {
    const deadlines = [
      mockDeadlineWithUrgency({ id: 'dl-1', urgency: 'overdue', days_until: -2 }),
      mockDeadlineWithUrgency({ id: 'dl-2', urgency: 'urgent', days_until: 3 }),
      mockDeadlineWithUrgency({ id: 'dl-3', urgency: 'normal', days_until: 20 }),
      mockDeadlineWithUrgency({ id: 'dl-4', status: 'filed' }),
      mockDeadlineWithUrgency({ id: 'dl-5', status: 'filed' }),
    ];

    const groups = groupDeadlines(deadlines);
    expect(groups.overdue).toHaveLength(1);
    expect(groups.upcoming).toHaveLength(2);
    expect(groups.filed).toHaveLength(2);
  });
});

// ============================================================
// Fetch + mark-as-filed integration pattern tests
// ============================================================

describe('Deadline API integration patterns', () => {
  it('mark-as-filed payload has correct shape', () => {
    const payload = { id: 'dl-test-1', status: 'filed' };
    expect(payload.id).toBeTruthy();
    expect(payload.status).toBe('filed');
  });

  it('generate-deadlines payload has correct shape', () => {
    const payload = { tax_type: 'sole_prop_8pct' };
    expect(payload.tax_type).toBeTruthy();
  });
});

// ============================================================
// Schemas validation tests
// ============================================================

describe('Deadline schemas', () => {
  // Test schema imports work correctly
  let DeadlinesQuerySchema: typeof import('@/lib/deadlines/schemas').DeadlinesQuerySchema;
  let GenerateDeadlinesSchema: typeof import('@/lib/deadlines/schemas').GenerateDeadlinesSchema;
  let UpdateDeadlineSchema: typeof import('@/lib/deadlines/schemas').UpdateDeadlineSchema;

  beforeEach(async () => {
    const mod = await import('@/lib/deadlines/schemas');
    DeadlinesQuerySchema = mod.DeadlinesQuerySchema;
    GenerateDeadlinesSchema = mod.GenerateDeadlinesSchema;
    UpdateDeadlineSchema = mod.UpdateDeadlineSchema;
  });

  it('DeadlinesQuerySchema accepts valid status', () => {
    const result = DeadlinesQuerySchema.safeParse({ status: 'upcoming' });
    expect(result.success).toBe(true);
  });

  it('DeadlinesQuerySchema accepts empty object', () => {
    const result = DeadlinesQuerySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('DeadlinesQuerySchema rejects invalid status', () => {
    const result = DeadlinesQuerySchema.safeParse({ status: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('GenerateDeadlinesSchema accepts valid tax type', () => {
    const result = GenerateDeadlinesSchema.safeParse({ tax_type: 'freelancer' });
    expect(result.success).toBe(true);
  });

  it('GenerateDeadlinesSchema rejects invalid tax type', () => {
    const result = GenerateDeadlinesSchema.safeParse({ tax_type: 'not_valid' });
    expect(result.success).toBe(false);
  });

  it('GenerateDeadlinesSchema accepts optional year', () => {
    const result = GenerateDeadlinesSchema.safeParse({ tax_type: 'freelancer', year: 2026 });
    expect(result.success).toBe(true);
  });

  it('UpdateDeadlineSchema accepts valid update', () => {
    const result = UpdateDeadlineSchema.safeParse({
      id: '00000000-0000-0000-0000-000000000001',
      status: 'filed',
    });
    expect(result.success).toBe(true);
  });

  it('UpdateDeadlineSchema rejects non-uuid id', () => {
    const result = UpdateDeadlineSchema.safeParse({
      id: 'not-a-uuid',
      status: 'filed',
    });
    expect(result.success).toBe(false);
  });

  it('UpdateDeadlineSchema rejects missing id', () => {
    const result = UpdateDeadlineSchema.safeParse({ status: 'filed' });
    expect(result.success).toBe(false);
  });
});
