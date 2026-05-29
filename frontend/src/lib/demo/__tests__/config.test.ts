/**
 * Demo config helpers — logic tests.
 * Feature: Reviewer demo bypass (Sprint 18, Gap §11 P0).
 *
 * Coverage:
 *   - isDemoModeEnabled / isDemoButtonVisible: only 'true' (exact) enables;
 *     unset, '', 'false', 'TRUE', '1' all → false (fail-closed).
 *   - constantTimeEquals: equality + inequality (length + content).
 *   - isDemoEmail: exact match (case/whitespace-normalised) accepted; any
 *     other email rejected.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  DEMO_EMAIL,
  isDemoModeEnabled,
  isDemoButtonVisible,
  constantTimeEquals,
  isDemoEmail,
} from '@/lib/demo/config';

const originalEnv = { ...process.env };

beforeEach(() => {
  delete process.env.DEMO_MODE_ENABLED;
  delete process.env.NEXT_PUBLIC_DEMO_MODE;
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('isDemoModeEnabled — fail-closed', () => {
  it('false when unset', () => {
    expect(isDemoModeEnabled()).toBe(false);
  });

  it('true ONLY for the exact string "true"', () => {
    process.env.DEMO_MODE_ENABLED = 'true';
    expect(isDemoModeEnabled()).toBe(true);
  });

  it.each(['', 'false', 'TRUE', 'True', '1', 'yes', ' true '])(
    'false for non-exact value %j',
    (val) => {
      process.env.DEMO_MODE_ENABLED = val;
      expect(isDemoModeEnabled()).toBe(false);
    },
  );
});

describe('isDemoButtonVisible — fail-closed', () => {
  it('false when unset', () => {
    expect(isDemoButtonVisible()).toBe(false);
  });

  it('true ONLY for the exact string "true"', () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = 'true';
    expect(isDemoButtonVisible()).toBe(true);
  });

  it.each(['', 'false', 'TRUE', '1'])('false for %j', (val) => {
    process.env.NEXT_PUBLIC_DEMO_MODE = val;
    expect(isDemoButtonVisible()).toBe(false);
  });
});

describe('constantTimeEquals', () => {
  it('true for identical strings', () => {
    expect(constantTimeEquals('demo@akbai.app', 'demo@akbai.app')).toBe(true);
  });

  it('false for different content of same length', () => {
    expect(constantTimeEquals('demo@akbai.app', 'demo@akbai.aXp')).toBe(false);
  });

  it('false for different lengths', () => {
    expect(constantTimeEquals('demo@akbai.app', 'demo@akbai.app2')).toBe(false);
  });

  it('true for two empty strings', () => {
    expect(constantTimeEquals('', '')).toBe(true);
  });
});

describe('isDemoEmail — only the demo identity', () => {
  it('accepts the exact demo email', () => {
    expect(isDemoEmail(DEMO_EMAIL)).toBe(true);
  });

  it('accepts case/whitespace variants (normalised before compare)', () => {
    expect(isDemoEmail('  DEMO@AKBAI.APP  ')).toBe(true);
    expect(isDemoEmail('Demo@Akbai.App')).toBe(true);
  });

  it('rejects any other email', () => {
    expect(isDemoEmail('attacker@evil.com')).toBe(false);
    expect(isDemoEmail('demo@akbai.com')).toBe(false);
    expect(isDemoEmail('demo+1@akbai.app')).toBe(false);
    expect(isDemoEmail('')).toBe(false);
  });
});
