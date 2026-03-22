import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  MANILA_TZ,
  getManilaToday,
  formatManilaDate,
  getManilaTimestamp,
  toManilaSQL,
  toManila,
} from '@/lib/timezone';

describe('timezone utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('MANILA_TZ', () => {
    it('should be Asia/Manila', () => {
      expect(MANILA_TZ).toBe('Asia/Manila');
    });
  });

  describe('getManilaToday', () => {
    it('returns a valid YYYY-MM-DD string', () => {
      vi.setSystemTime(new Date('2026-06-15T10:00:00Z'));
      const result = getManilaToday();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('returns Manila date at timezone boundary (11pm UTC = next day in Manila)', () => {
      // 2026-06-15 23:00 UTC = 2026-06-16 07:00 Manila (UTC+8)
      vi.setSystemTime(new Date('2026-06-15T23:00:00Z'));
      const result = getManilaToday();
      expect(result).toBe('2026-06-16');
    });

    it('returns same day when UTC time is early morning (before Manila crosses midnight)', () => {
      // 2026-06-15 14:00 UTC = 2026-06-15 22:00 Manila (still same day)
      vi.setSystemTime(new Date('2026-06-15T14:00:00Z'));
      const result = getManilaToday();
      expect(result).toBe('2026-06-15');
    });
  });

  describe('formatManilaDate', () => {
    it('returns YYYY-MM-DD with default format', () => {
      vi.setSystemTime(new Date('2026-03-22T10:30:00Z'));
      const result = formatManilaDate();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('formats with custom format string', () => {
      // 2026-03-22 10:30 UTC = 2026-03-22 18:30 Manila
      vi.setSystemTime(new Date('2026-03-22T10:30:00Z'));
      const result = formatManilaDate(undefined, 'MMM dd, yyyy');
      expect(result).toBe('Mar 22, 2026');
    });

    it('correctly converts timezone for a specific date', () => {
      const date = new Date('2026-12-31T17:00:00Z'); // Jan 1 01:00 in Manila
      const result = formatManilaDate(date, 'yyyy-MM-dd');
      expect(result).toBe('2027-01-01');
    });
  });

  describe('toManila', () => {
    it('converts a UTC date to Manila time in UTC fields', () => {
      // 2026-06-15 16:00 UTC = 2026-06-16 00:00 Manila
      const date = new Date('2026-06-15T16:00:00Z');
      const manila = toManila(date);
      expect(manila.getUTCHours()).toBe(0);
      expect(manila.getUTCDate()).toBe(16);
    });
  });

  describe('getManilaTimestamp', () => {
    it('returns a valid ISO-like string with +08:00 offset', () => {
      vi.setSystemTime(new Date('2026-03-22T10:30:45Z'));
      const result = getManilaTimestamp();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+08:00$/);
    });

    it('contains the correct Manila time', () => {
      // 2026-03-22 10:30:45 UTC = 2026-03-22 18:30:45 Manila
      vi.setSystemTime(new Date('2026-03-22T10:30:45Z'));
      const result = getManilaTimestamp();
      expect(result).toBe('2026-03-22T18:30:45+08:00');
    });
  });

  describe('toManilaSQL', () => {
    it('returns correct SQL fragment for a column', () => {
      expect(toManilaSQL('created_at')).toBe("created_at AT TIME ZONE 'Asia/Manila'");
    });

    it('works with qualified column names', () => {
      expect(toManilaSQL('t.updated_at')).toBe("t.updated_at AT TIME ZONE 'Asia/Manila'");
    });
  });
});
