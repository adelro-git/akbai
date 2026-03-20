// AKBai Build 0 — Model routing (Haiku vs Sonnet) + token limits
// Source: prompt-library.md model annotations

import type { ClaudeModelId, KAFeature, UserTier } from './types';

/** Features that use Sonnet for paid tiers (reasoning-heavy). */
const SONNET_FEATURES: Set<KAFeature> = new Set([
  'general_chat',
  'morning_briefing',
  'reply_drafter',
]);

/**
 * Select the Claude model based on user tier and feature.
 * - Free tier → always Haiku (cost control)
 * - Pro/Business + reasoning features → Sonnet
 * - Pro/Business + extraction/classification → Haiku
 */
export function selectModel(tier: UserTier, feature: KAFeature): ClaudeModelId {
  if (tier === 'free') return 'claude-haiku-4-5-20251001';
  return SONNET_FEATURES.has(feature)
    ? 'claude-sonnet-4-6'
    : 'claude-haiku-4-5-20251001';
}

/**
 * Max output tokens per feature.
 * Briefings and scans need more room; chat and classification are brief.
 */
export function getMaxTokens(feature: KAFeature): number {
  if (feature === 'morning_briefing') return 1024;
  if (feature === 'resibo_scanner') return 1024;
  return 512;
}
