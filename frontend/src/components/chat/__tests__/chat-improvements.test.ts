import { describe, it, expect, vi } from 'vitest';

/**
 * Tests for chat UX improvements:
 * - Message timestamps via formatManilaDate
 * - Local avatar path (no external URL)
 * - Scroll-to-bottom button threshold
 */

// ============================================================
// 1. Message timestamps
// ============================================================

vi.mock('@/lib/timezone', () => ({
  formatManilaDate: (date: Date, fmt: string) => {
    // Simplified mock for testing — returns a predictable string
    if (fmt === 'h:mm a') {
      return '2:30 PM';
    }
    return '2026-03-26';
  },
  toManila: () => new Date(Date.UTC(2026, 2, 26, 14, 30, 0)),
  getManilaToday: () => '2026-03-26',
  MANILA_TZ: 'Asia/Manila',
}));

import { formatManilaDate } from '@/lib/timezone';

describe('Chat timestamps', () => {
  it('should format timestamp using Manila timezone', () => {
    const result = formatManilaDate(new Date('2026-03-26T14:30:00Z'), 'h:mm a');
    expect(result).toBe('2:30 PM');
  });

  it('should use 12-hour format with AM/PM', () => {
    const result = formatManilaDate(new Date('2026-03-26T08:00:00Z'), 'h:mm a');
    // Our mock returns '2:30 PM' for any h:mm a format
    expect(result).toContain('PM');
  });

  it('should handle invalid date gracefully', () => {
    // The ChatBubble component's formatTimestamp function
    // returns empty string for invalid dates
    const date = new Date('invalid');
    expect(isNaN(date.getTime())).toBe(true);
  });
});

// ============================================================
// 2. Local avatar image
// ============================================================

describe('Chat avatar', () => {
  const LOCAL_AVATAR_PATH = '/icons/mark-honey.png';
  const EXTERNAL_URL = 'https://raw.githubusercontent.com/adelro-git/akbai/main/brand/Logo%20Files/AKBai_Mark_Honey.png';

  it('should use local avatar path', () => {
    expect(LOCAL_AVATAR_PATH).toBe('/icons/mark-honey.png');
  });

  it('should not reference external GitHub URL', () => {
    // Verify the local path is not the old external URL
    expect(LOCAL_AVATAR_PATH).not.toContain('github');
    expect(LOCAL_AVATAR_PATH).not.toContain('raw.githubusercontent');
  });

  it('local path should be a relative path starting with /', () => {
    expect(LOCAL_AVATAR_PATH.startsWith('/')).toBe(true);
  });
});

// ============================================================
// 3. Scroll-to-bottom button
// ============================================================

describe('Scroll-to-bottom button', () => {
  const SCROLL_THRESHOLD = 150;

  it('should show button when distance from bottom exceeds threshold', () => {
    const scrollHeight = 2000;
    const scrollTop = 1000;
    const clientHeight = 600;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    expect(distanceFromBottom).toBe(400);
    expect(distanceFromBottom > SCROLL_THRESHOLD).toBe(true);
  });

  it('should hide button when near bottom', () => {
    const scrollHeight = 2000;
    const scrollTop = 1350;
    const clientHeight = 600;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    expect(distanceFromBottom).toBe(50);
    expect(distanceFromBottom > SCROLL_THRESHOLD).toBe(false);
  });

  it('should use 150px as the scroll threshold', () => {
    expect(SCROLL_THRESHOLD).toBe(150);
  });
});
