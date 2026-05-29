/**
 * Constant-time secret comparison — logic tests.
 * Feature: Sprint 18 cleanup — shared constant-time Bearer/secret compare.
 *
 * Coverage:
 *   - constantTimeEquals: equality, content inequality (same length),
 *     length inequality, empty-string edge.
 *   - verifyBearer: fail-closed on unset/empty secret; null/missing header;
 *     malformed (non-"Bearer ") header; correct token; wrong token; the
 *     literal "Bearer " with an empty token vs an empty secret.
 */

import { describe, it, expect } from 'vitest';
import { constantTimeEquals, verifyBearer } from '@/lib/security/constant-time';

describe('constantTimeEquals', () => {
  it('true for identical strings', () => {
    expect(constantTimeEquals('s3cr3t-token', 's3cr3t-token')).toBe(true);
  });

  it('false for different content of same length', () => {
    expect(constantTimeEquals('s3cr3t-token', 's3cr3t-tokeX')).toBe(false);
  });

  it('false for different lengths', () => {
    expect(constantTimeEquals('s3cr3t-token', 's3cr3t-token2')).toBe(false);
    expect(constantTimeEquals('abc', 'ab')).toBe(false);
  });

  it('true for two empty strings', () => {
    expect(constantTimeEquals('', '')).toBe(true);
  });

  it('false when only one side is empty', () => {
    expect(constantTimeEquals('', 'x')).toBe(false);
    expect(constantTimeEquals('x', '')).toBe(false);
  });
});

describe('verifyBearer — fail-closed', () => {
  it('false when secret is undefined', () => {
    expect(verifyBearer('Bearer anything', undefined)).toBe(false);
  });

  it('false when secret is empty', () => {
    expect(verifyBearer('Bearer ', '')).toBe(false);
  });

  it('false when header is null', () => {
    expect(verifyBearer(null, 's3cr3t')).toBe(false);
  });

  it.each(['', 's3cr3t', 'Bearer', 'Bearerx s3cr3t', 'Basic s3cr3t', 'bearer s3cr3t'])(
    'false for malformed header %j',
    (header) => {
      expect(verifyBearer(header, 's3cr3t')).toBe(false);
    },
  );

  it('true when the Bearer token matches the secret exactly', () => {
    expect(verifyBearer('Bearer s3cr3t', 's3cr3t')).toBe(true);
  });

  it('false when the Bearer token does not match', () => {
    expect(verifyBearer('Bearer wrong', 's3cr3t')).toBe(false);
    expect(verifyBearer('Bearer s3cr3tX', 's3cr3t')).toBe(false);
  });

  it('false for an empty token even against a non-empty secret', () => {
    expect(verifyBearer('Bearer ', 's3cr3t')).toBe(false);
  });
});
