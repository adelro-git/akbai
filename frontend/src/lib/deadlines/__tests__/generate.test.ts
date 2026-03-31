/**
 * Tests for BIR Deadline Generation Logic
 * Feature: Build 6 — BIR Deadline Watcher (Sprint 9)
 */

import { describe, it, expect } from 'vitest';
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
