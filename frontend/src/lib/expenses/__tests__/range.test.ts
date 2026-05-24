import { describe, it, expect } from 'vitest';
import { resolveRange } from '../range';

describe('resolveRange', () => {
  describe('linggo (trailing 7 days)', () => {
    it('returns today and 6 days prior (inclusive)', () => {
      const r = resolveRange('linggo', '2026-05-24');
      expect(r.to).toBe('2026-05-24');
      expect(r.from).toBe('2026-05-18');
    });

    it('crosses month boundary', () => {
      const r = resolveRange('linggo', '2026-06-03');
      expect(r.from).toBe('2026-05-28');
      expect(r.to).toBe('2026-06-03');
    });

    it('crosses year boundary', () => {
      const r = resolveRange('linggo', '2026-01-03');
      expect(r.from).toBe('2025-12-28');
      expect(r.to).toBe('2026-01-03');
    });
  });

  describe('buwan (current Manila month)', () => {
    it('returns first → last day of the current month', () => {
      const r = resolveRange('buwan', '2026-05-24');
      expect(r.from).toBe('2026-05-01');
      expect(r.to).toBe('2026-05-31');
    });

    it('handles February in a non-leap year', () => {
      const r = resolveRange('buwan', '2026-02-15');
      expect(r.from).toBe('2026-02-01');
      expect(r.to).toBe('2026-02-28');
    });

    it('handles February in a leap year', () => {
      const r = resolveRange('buwan', '2028-02-15');
      expect(r.from).toBe('2028-02-01');
      expect(r.to).toBe('2028-02-29');
    });

    it('handles December (last day = 31)', () => {
      const r = resolveRange('buwan', '2026-12-09');
      expect(r.from).toBe('2026-12-01');
      expect(r.to).toBe('2026-12-31');
    });
  });

  describe('taon (current Manila year)', () => {
    it('returns Jan 1 → today', () => {
      const r = resolveRange('taon', '2026-05-24');
      expect(r.from).toBe('2026-01-01');
      expect(r.to).toBe('2026-05-24');
    });

    it('returns Jan 1 → Jan 1 on first day of year', () => {
      const r = resolveRange('taon', '2026-01-01');
      expect(r.from).toBe('2026-01-01');
      expect(r.to).toBe('2026-01-01');
    });

    it('returns Jan 1 → Dec 31 on last day of year', () => {
      const r = resolveRange('taon', '2026-12-31');
      expect(r.from).toBe('2026-01-01');
      expect(r.to).toBe('2026-12-31');
    });
  });
});
