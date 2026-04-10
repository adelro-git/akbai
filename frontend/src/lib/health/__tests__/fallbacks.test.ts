/**
 * Fallback Messages Tests — Verify dependency error identification and message selection
 * Feature: Dependency Health Checks (Gap D4)
 *
 * Tests: getDependencyFallback, identifyDependencyError
 */

import { describe, it, expect } from 'vitest';
import {
  getDependencyFallback,
  identifyDependencyError,
  DEPENDENCY_FALLBACK_MESSAGES,
} from '../fallbacks';
import type { DependencyErrorType } from '../types';

// ============================================================
// getDependencyFallback Tests
// ============================================================

describe('getDependencyFallback', () => {
  it('returns Supabase-specific message for supabase_down', () => {
    const msg = getDependencyFallback('supabase_down');
    expect(msg).toBe(DEPENDENCY_FALLBACK_MESSAGES.supabase_down);
    expect(msg).toContain('connection');
  });

  it('returns Anthropic-specific message for anthropic_down', () => {
    const msg = getDependencyFallback('anthropic_down');
    expect(msg).toBe(DEPENDENCY_FALLBACK_MESSAGES.anthropic_down);
    expect(msg).toContain('Kai');
  });

  it('returns Xendit-specific message for xendit_down', () => {
    const msg = getDependencyFallback('xendit_down');
    expect(msg).toBe(DEPENDENCY_FALLBACK_MESSAGES.xendit_down);
    expect(msg).toContain('payment');
  });

  it('returns general message for general_error', () => {
    const msg = getDependencyFallback('general_error');
    expect(msg).toBe(DEPENDENCY_FALLBACK_MESSAGES.general_error);
  });

  it('all messages are conversational Filipino (contain po/mo/natin)', () => {
    const errorTypes: DependencyErrorType[] = [
      'supabase_down',
      'anthropic_down',
      'xendit_down',
      'general_error',
    ];

    for (const type of errorTypes) {
      const msg = getDependencyFallback(type);
      const hasFilipino = /\b(po|mo|natin|namin|tayo)\b/.test(msg);
      expect(hasFilipino, `Message for ${type} should contain Filipino words`).toBe(true);
    }
  });
});

// ============================================================
// identifyDependencyError Tests
// ============================================================

describe('identifyDependencyError', () => {
  it('identifies Supabase errors from error message', () => {
    expect(identifyDependencyError(new Error('Supabase connection failed'))).toBe('supabase_down');
    expect(identifyDependencyError(new Error('PGRST301: JWT expired'))).toBe('supabase_down');
    expect(identifyDependencyError(new Error('database connection refused'))).toBe('supabase_down');
  });

  it('identifies Anthropic errors from error message', () => {
    expect(identifyDependencyError(new Error('Anthropic API returned 500'))).toBe('anthropic_down');
    expect(identifyDependencyError(new Error('Claude overloaded'))).toBe('anthropic_down');
    expect(identifyDependencyError(new Error('rate_limit exceeded'))).toBe('anthropic_down');
  });

  it('identifies Xendit errors from error message', () => {
    expect(identifyDependencyError(new Error('Xendit API timeout'))).toBe('xendit_down');
    expect(identifyDependencyError(new Error('payment processing failed'))).toBe('xendit_down');
  });

  it('returns general_error for non-Error values', () => {
    expect(identifyDependencyError('string error')).toBe('general_error');
    expect(identifyDependencyError(null)).toBe('general_error');
    expect(identifyDependencyError(undefined)).toBe('general_error');
  });

  it('returns general_error for unrecognized errors', () => {
    expect(identifyDependencyError(new Error('something unexpected'))).toBe('general_error');
  });
});
