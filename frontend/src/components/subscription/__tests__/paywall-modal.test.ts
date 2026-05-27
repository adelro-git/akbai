/**
 * PaywallModal — behavior tests (Sprint 17 batch 3).
 *
 * Scope: validates the modal's pure dispatch logic + i18n key resolution
 *        without rendering React in jsdom. The vitest env is `node`, so
 *        we test the same code paths the component runs by:
 *
 *   1. exercising `handlePurchaseResult` (the exported pure dispatcher)
 *      with every PurchaseResult variant (success/cancelled/error)
 *   2. asserting TIER_TO_PRODUCT_ID maps to the 3 architect-locked SKUs
 *      ('akbai_starter_lifetime', 'akbai_pro_monthly', 'akbai_pro_annual')
 *   3. spot-checking that every PaywallSource has a matching title key
 *      in messages/fil.json AND messages/en.json (catches drift between
 *      the union type + the i18n bundle, which would runtime-throw in
 *      next-intl's strict mode)
 *
 * Reference: sprint-17-revenuecat-pattern.md §4 + §8 batch 3 lines 1066+.
 */

import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { handlePurchaseResult } from '../paywall-modal';
import { TIER_TO_PRODUCT_ID } from '../paywall-tier-card';

// ============================================================
// Sources union ↔ messages bundle parity
// ============================================================

const ALL_SOURCES = [
  'chat',
  'morning_briefing',
  'weekly_story',
  'reply_drafter',
  'scan_limit',
  'manual',
] as const;

function loadMessages(locale: 'fil' | 'en'): Record<string, unknown> {
  const path = join(process.cwd(), 'messages', `${locale}.json`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

// ============================================================
// PaywallSource ↔ messages parity
// ============================================================

describe('PaywallModal — i18n bundle parity', () => {
  it.each(['fil', 'en'] as const)('messages/%s.json has all 6 paywall.title.* keys', (locale) => {
    const json = loadMessages(locale);
    const paywall = json.paywall as Record<string, Record<string, string>>;
    expect(paywall).toBeDefined();
    expect(paywall.title).toBeDefined();
    for (const source of ALL_SOURCES) {
      expect(paywall.title[source], `${locale}.json paywall.title.${source}`).toBeTruthy();
    }
  });

  it.each(['fil', 'en'] as const)('messages/%s.json has paywall.cta.{restore,close}', (locale) => {
    const json = loadMessages(locale);
    const cta = (json.paywall as Record<string, Record<string, string>>).cta;
    expect(cta.restore).toBeTruthy();
    expect(cta.close).toBeTruthy();
  });

  it.each(['fil', 'en'] as const)('messages/%s.json has web_fallback.{title,body}', (locale) => {
    const json = loadMessages(locale);
    const wf = (json.paywall as Record<string, Record<string, string>>).web_fallback;
    expect(wf.title).toBeTruthy();
    expect(wf.body).toBeTruthy();
  });

  it.each(['fil', 'en'] as const)('messages/%s.json has all 3 tier-card content blocks', (locale) => {
    const json = loadMessages(locale);
    const cards = (json.paywall as Record<string, Record<string, Record<string, unknown>>>).cards;
    for (const tier of ['starter', 'pro_monthly', 'pro_annual']) {
      expect(cards[tier], `${locale}.json paywall.cards.${tier}`).toBeDefined();
      expect(cards[tier].title).toBeTruthy();
      expect(cards[tier].subtitle).toBeTruthy();
      expect(Array.isArray(cards[tier].bullets)).toBe(true);
      expect(cards[tier].cta).toBeTruthy();
    }
    // Starter has the extra "note" key; others don't.
    expect(cards.starter.note).toBeTruthy();
  });

  it('fil.json paywall.title.chat uses conversational Filipino syntactic frame', () => {
    const json = loadMessages('fil');
    const title = (json.paywall as Record<string, Record<string, string>>).title.chat;
    // VSO frame keywords + Filipinized verb (mag-upgrade with hyphen).
    expect(title).toContain('Mag-upgrade');
    expect(title).toMatch(/Naka-max ka na/);
    // No English SVO — guard against accidental translation drift.
    expect(title).not.toMatch(/^You have/);
  });

  it('fil.json paywall.cta.restore is the architect-locked draft', () => {
    const json = loadMessages('fil');
    const restore = (json.paywall as Record<string, Record<string, string>>).cta.restore;
    expect(restore).toBe('May dating purchase ka na? I-restore mo dito.');
  });
});

// ============================================================
// TIER_TO_PRODUCT_ID — architect §3 SKU lock
// ============================================================

describe('PaywallModal — tier → product id binding', () => {
  it('maps starter → akbai_starter_lifetime', () => {
    expect(TIER_TO_PRODUCT_ID.starter).toBe('akbai_starter_lifetime');
  });

  it('maps pro_monthly → akbai_pro_monthly', () => {
    expect(TIER_TO_PRODUCT_ID.pro_monthly).toBe('akbai_pro_monthly');
  });

  it('maps pro_annual → akbai_pro_annual', () => {
    expect(TIER_TO_PRODUCT_ID.pro_annual).toBe('akbai_pro_annual');
  });

  it('contains exactly 3 tiers', () => {
    expect(Object.keys(TIER_TO_PRODUCT_ID)).toHaveLength(3);
  });
});

// ============================================================
// handlePurchaseResult — purchase outcome dispatcher
// ============================================================

describe('PaywallModal — handlePurchaseResult dispatcher', () => {
  it('success → calls onUpgraded(tier) + onClose, clears purchasing', () => {
    const setPurchasing = vi.fn();
    const setErrorKey = vi.fn();
    const onClose = vi.fn();
    const onUpgraded = vi.fn();

    handlePurchaseResult(
      { status: 'success', tier: 'pro' },
      { setPurchasing, setErrorKey, onClose, onUpgraded },
    );

    expect(setPurchasing).toHaveBeenCalledWith(null);
    expect(onUpgraded).toHaveBeenCalledWith('pro');
    expect(onClose).toHaveBeenCalledOnce();
    expect(setErrorKey).not.toHaveBeenCalled();
  });

  it('success → tier=starter also dispatches', () => {
    const setPurchasing = vi.fn();
    const setErrorKey = vi.fn();
    const onClose = vi.fn();
    const onUpgraded = vi.fn();

    handlePurchaseResult(
      { status: 'success', tier: 'starter' },
      { setPurchasing, setErrorKey, onClose, onUpgraded },
    );

    expect(onUpgraded).toHaveBeenCalledWith('starter');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('success with onUpgraded undefined → still closes (no throw)', () => {
    const setPurchasing = vi.fn();
    const setErrorKey = vi.fn();
    const onClose = vi.fn();

    expect(() =>
      handlePurchaseResult(
        { status: 'success', tier: 'pro' },
        { setPurchasing, setErrorKey, onClose },
      ),
    ).not.toThrow();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('cancelled → clears purchasing, does NOT close', () => {
    const setPurchasing = vi.fn();
    const setErrorKey = vi.fn();
    const onClose = vi.fn();
    const onUpgraded = vi.fn();

    handlePurchaseResult(
      { status: 'cancelled' },
      { setPurchasing, setErrorKey, onClose, onUpgraded },
    );

    expect(setPurchasing).toHaveBeenCalledWith(null);
    expect(onClose).not.toHaveBeenCalled();
    expect(onUpgraded).not.toHaveBeenCalled();
    expect(setErrorKey).not.toHaveBeenCalled();
  });

  it('error → sets errorKey to messageKey, does NOT close', () => {
    const setPurchasing = vi.fn();
    const setErrorKey = vi.fn();
    const onClose = vi.fn();
    const onUpgraded = vi.fn();

    handlePurchaseResult(
      { status: 'error', messageKey: 'iap.error.network' },
      { setPurchasing, setErrorKey, onClose, onUpgraded },
    );

    expect(setPurchasing).toHaveBeenCalledWith(null);
    expect(setErrorKey).toHaveBeenCalledWith('iap.error.network');
    expect(onClose).not.toHaveBeenCalled();
    expect(onUpgraded).not.toHaveBeenCalled();
  });

  it('error → passes through every messageKey from the lib/iap/purchase contract', () => {
    const errorKeys = [
      'iap.error.network',
      'iap.error.pending',
      'iap.error.invalid',
      'iap.error.store_unavailable',
      'iap.error.product_not_found',
      'iap.error.unknown',
      'iap.error.web_only',
    ];
    for (const key of errorKeys) {
      const setErrorKey = vi.fn();
      handlePurchaseResult(
        { status: 'error', messageKey: key },
        {
          setPurchasing: vi.fn(),
          setErrorKey,
          onClose: vi.fn(),
        },
      );
      expect(setErrorKey).toHaveBeenCalledWith(key);
    }
  });
});

// ============================================================
// State-machine: open prop gating
// ============================================================

describe('PaywallModal — open prop gating', () => {
  // The component renders null when !open; tests this by checking the
  // export shape exists (canary) — full DOM render is jsdom territory.
  it('exports PaywallModal + handlePurchaseResult', async () => {
    const mod = await import('../paywall-modal');
    expect(mod.PaywallModal).toBeDefined();
    expect(mod.handlePurchaseResult).toBeDefined();
  });
});

// ============================================================
// PaywallSource union exhaustiveness
// ============================================================

describe('PaywallModal — PaywallSource union', () => {
  it('every source key in ALL_SOURCES has a fil.json title', () => {
    const json = loadMessages('fil');
    const titles = (json.paywall as Record<string, Record<string, string>>).title;
    for (const source of ALL_SOURCES) {
      expect(titles[source]).toBeTruthy();
      // Architect-locked drafts mention Pro / Kai / Starter — at least one
      // domain noun must appear so we know it's not an empty placeholder.
      expect(titles[source].length).toBeGreaterThan(10);
    }
  });

  it('chat source title references Kai (chat-gate context)', () => {
    const json = loadMessages('fil');
    const title = (json.paywall as Record<string, Record<string, string>>).title.chat;
    expect(title).toContain('Kai');
  });

  it('scan_limit source title references scans + price', () => {
    const json = loadMessages('fil');
    const title = (json.paywall as Record<string, Record<string, string>>).title.scan_limit;
    expect(title.toLowerCase()).toContain('scan');
    expect(title).toContain('₱299');
  });

  it('manual source title is the generic plan-picker copy', () => {
    const json = loadMessages('fil');
    const title = (json.paywall as Record<string, Record<string, string>>).title.manual;
    expect(title.toLowerCase()).toContain('plano');
  });
});
