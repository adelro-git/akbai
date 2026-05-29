/**
 * Tests for BIR Deadline Generation Logic
 * Feature: Build 6 — BIR Deadline Watcher (Sprint 9)
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { generateDeadlines } from '../generate';
import type { BirTaxType } from '../types';

// ============================================================
// Sole Prop (Graduated + OSD) — 1701Q, 1701A, 2551Q
// ============================================================

describe('generateDeadlines — sole_prop_graduated_osd', () => {
  const deadlines = generateDeadlines('sole_prop_graduated_osd', 2026);

  it('generates correct number of deadlines', () => {
    // 1701Q: 3 (Apr, Aug, Nov) + 1701A: 1 (Apr) + 2551Q: 4 (Jan, Apr, Jul, Oct) = 8
    expect(deadlines).toHaveLength(8);
  });

  it('includes all required form names', () => {
    const formNames = [...new Set(deadlines.map((d) => d.form_name))];
    expect(formNames).toContain('1701Q');
    expect(formNames).toContain('1701A');
    expect(formNames).toContain('2551Q');
  });

  it('has correct 1701Q due dates', () => {
    const q = deadlines.filter((d) => d.form_name === '1701Q');
    expect(q.map((d) => d.due_date)).toEqual(['2026-04-15', '2026-08-15', '2026-11-15']);
  });

  it('has correct 2551Q due dates', () => {
    const q = deadlines.filter((d) => d.form_name === '2551Q');
    expect(q.map((d) => d.due_date)).toEqual(['2026-01-25', '2026-04-25', '2026-07-25', '2026-10-25']);
  });

  it('returns deadlines sorted by due_date ascending', () => {
    for (let i = 1; i < deadlines.length; i++) {
      expect(deadlines[i].due_date >= deadlines[i - 1].due_date).toBe(true);
    }
  });
});

// ============================================================
// Sole Prop (8% Flat Tax) — 1701Q, 1701A only (no 2551Q)
// ============================================================

describe('generateDeadlines — sole_prop_8pct', () => {
  const deadlines = generateDeadlines('sole_prop_8pct', 2026);

  it('generates correct number of deadlines', () => {
    // 1701Q: 3 + 1701A: 1 = 4
    expect(deadlines).toHaveLength(4);
  });

  it('does NOT include 2551Q', () => {
    const has2551Q = deadlines.some((d) => d.form_name === '2551Q');
    expect(has2551Q).toBe(false);
  });

  it('includes 1701Q and 1701A only', () => {
    const formNames = [...new Set(deadlines.map((d) => d.form_name))];
    expect(formNames).toEqual(expect.arrayContaining(['1701Q', '1701A']));
    expect(formNames).toHaveLength(2);
  });
});

// ============================================================
// Sole Prop (VAT) — 1701Q, 1701A, 2550Q, 2550M
// ============================================================

describe('generateDeadlines — sole_prop_vat', () => {
  const deadlines = generateDeadlines('sole_prop_vat', 2026);

  it('generates correct number of deadlines', () => {
    // 1701Q: 3 + 1701A: 1 + 2550Q: 4 + 2550M: 12 = 20
    expect(deadlines).toHaveLength(20);
  });

  it('includes VAT forms', () => {
    const formNames = [...new Set(deadlines.map((d) => d.form_name))];
    expect(formNames).toContain('2550Q');
    expect(formNames).toContain('2550M');
  });

  it('has 12 monthly VAT deadlines', () => {
    const monthly = deadlines.filter((d) => d.form_name === '2550M');
    expect(monthly).toHaveLength(12);
  });

  it('2550M deadlines fall on 20th of each month', () => {
    const monthly = deadlines.filter((d) => d.form_name === '2550M');
    monthly.forEach((d) => {
      expect(d.due_date.endsWith('-20')).toBe(true);
    });
  });
});

// ============================================================
// Freelancer — 1701Q, 1701A, 2551Q
// ============================================================

describe('generateDeadlines — freelancer', () => {
  const deadlines = generateDeadlines('freelancer', 2026);

  it('generates same forms as sole_prop_graduated_osd', () => {
    const formNames = [...new Set(deadlines.map((d) => d.form_name))];
    expect(formNames).toEqual(expect.arrayContaining(['1701Q', '1701A', '2551Q']));
    expect(deadlines).toHaveLength(8);
  });
});

// ============================================================
// Online Seller — 1701Q, 1701A, 2551Q
// ============================================================

describe('generateDeadlines — online_seller', () => {
  const deadlines = generateDeadlines('online_seller', 2026);

  it('generates correct forms', () => {
    const formNames = [...new Set(deadlines.map((d) => d.form_name))];
    expect(formNames).toEqual(expect.arrayContaining(['1701Q', '1701A', '2551Q']));
    expect(deadlines).toHaveLength(8);
  });
});

// ============================================================
// Edge cases
// ============================================================

describe('generateDeadlines — edge cases', () => {
  it('defaults to current year if not specified', () => {
    const deadlines = generateDeadlines('sole_prop_8pct');
    const currentYear = new Date().getFullYear();
    deadlines.forEach((d) => {
      expect(d.due_date.startsWith(String(currentYear))).toBe(true);
    });
  });

  it('returns empty array for unknown tax type', () => {
    // TypeScript wouldn't allow this normally, but testing runtime safety
    const deadlines = generateDeadlines('unknown_type' as BirTaxType);
    expect(deadlines).toEqual([]);
  });

  it('all deadlines have descriptions', () => {
    const deadlines = generateDeadlines('sole_prop_vat', 2026);
    deadlines.forEach((d) => {
      expect(d.description).toBeTruthy();
    });
  });

  it('all deadlines have valid date format', () => {
    const deadlines = generateDeadlines('sole_prop_graduated_osd', 2026);
    deadlines.forEach((d) => {
      expect(d.due_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});

// ============================================================
// Tax-year rollover (Sprint 18 §11 — "BIR deadline calendar switches to
// 2027 after Jan 1")
//
// generateDeadlines() defaults the target year to new Date().getFullYear()
// when no `year` arg is supplied (the production call path on the deadlines
// page). Freeze the system clock just past the Manila New Year boundary and
// assert the default-year path rolls the whole calendar to 2027.
// ============================================================

describe('generateDeadlines — tax-year rollover', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('generates 2027 deadlines when the clock has rolled into 2027 (default year)', () => {
    vi.useFakeTimers();
    // 2027-01-01 00:30 Manila (UTC+8) — just past midnight on New Year's Day.
    vi.setSystemTime(new Date('2027-01-01T00:30:00+08:00'));

    const deadlines = generateDeadlines('sole_prop_graduated_osd');

    expect(deadlines.length).toBeGreaterThan(0);
    // Every generated deadline must belong to the new tax year.
    deadlines.forEach((d) => {
      expect(d.due_date.startsWith('2027-')).toBe(true);
    });
    // Spot-check the quarterly income-tax dates rolled to 2027.
    const q1701 = deadlines.filter((d) => d.form_name === '1701Q');
    expect(q1701.map((d) => d.due_date)).toEqual([
      '2027-04-15',
      '2027-08-15',
      '2027-11-15',
    ]);
  });

  it('still honours an explicit year arg even when the clock has rolled (no implicit override)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2027-01-01T00:30:00+08:00'));

    // Explicit 2026 must NOT be overridden by the 2027 clock.
    const deadlines = generateDeadlines('sole_prop_graduated_osd', 2026);
    deadlines.forEach((d) => {
      expect(d.due_date.startsWith('2026-')).toBe(true);
    });
  });

  it('rolls the default year using the Manila clock even when UTC is still 2026', () => {
    vi.useFakeTimers();
    // 2026-12-31 23:00 UTC = 2027-01-01 07:00 Manila. The UTC year is still
    // 2026, but the deadline calendar must follow Manila (UTC+8) and roll to
    // 2027. This is the exact boundary the spec calls out and the reason
    // generate.ts derives its default year from getManilaToday(), not the
    // runtime clock — so this passes on a UTC CI runner too.
    vi.setSystemTime(new Date('2026-12-31T23:00:00Z'));

    const deadlines = generateDeadlines('freelancer');
    expect(deadlines.length).toBeGreaterThan(0);
    deadlines.forEach((d) => {
      expect(d.due_date.startsWith('2027-')).toBe(true);
    });
  });
});
