// AKBai Build 0 — AI loading state wait estimator (Gap B1)
// Provides feature-specific wait time estimates with conversational Filipino messages

import type { KAFeature, UserTier } from './types';

export interface LoadingEstimate {
  minSeconds: number;
  maxSeconds: number;
  messageTl: string;
  longWaitMessageTl: string;
}

/**
 * Feature-specific loading time configs.
 * Each feature maps to its typical wait range and Taglish loading messages.
 */
const FEATURE_ESTIMATES: Record<KAFeature, Record<UserTier, LoadingEstimate>> = {
  general_chat: {
    free: {
      minSeconds: 2,
      maxSeconds: 4,
      messageTl: 'Nag-iisip si Kai... ~2-4 seconds',
      longWaitMessageTl: 'Medyo matagal — sandali lang pa po...',
    },
    pro: {
      minSeconds: 3,
      maxSeconds: 5,
      messageTl: 'Nag-iisip si Kai... ~3-5 seconds',
      longWaitMessageTl: 'Medyo matagal — sandali lang pa po...',
    },
    business: {
      minSeconds: 3,
      maxSeconds: 5,
      messageTl: 'Nag-iisip si Kai... ~3-5 seconds',
      longWaitMessageTl: 'Medyo matagal — sandali lang pa po...',
    },
  },
  resibo_scanner: {
    free: {
      minSeconds: 5,
      maxSeconds: 8,
      messageTl: 'Binabasa ni Kai ang resibo... ~5-8 seconds',
      longWaitMessageTl: 'Medyo matagal — sandali lang pa po...',
    },
    pro: {
      minSeconds: 5,
      maxSeconds: 8,
      messageTl: 'Binabasa ni Kai ang resibo... ~5-8 seconds',
      longWaitMessageTl: 'Medyo matagal — sandali lang pa po...',
    },
    business: {
      minSeconds: 5,
      maxSeconds: 8,
      messageTl: 'Binabasa ni Kai ang resibo... ~5-8 seconds',
      longWaitMessageTl: 'Medyo matagal — sandali lang pa po...',
    },
  },
  morning_briefing: {
    free: {
      minSeconds: 3,
      maxSeconds: 5,
      messageTl: 'Inihahanda ni Kai ang briefing mo... ~3-5 seconds',
      longWaitMessageTl: 'Medyo matagal — sandali lang pa po...',
    },
    pro: {
      minSeconds: 3,
      maxSeconds: 5,
      messageTl: 'Inihahanda ni Kai ang briefing mo... ~3-5 seconds',
      longWaitMessageTl: 'Medyo matagal — sandali lang pa po...',
    },
    business: {
      minSeconds: 3,
      maxSeconds: 5,
      messageTl: 'Inihahanda ni Kai ang briefing mo... ~3-5 seconds',
      longWaitMessageTl: 'Medyo matagal — sandali lang pa po...',
    },
  },
  reply_drafter: {
    free: {
      minSeconds: 2,
      maxSeconds: 4,
      messageTl: 'Sandali lang po...',
      longWaitMessageTl: 'Medyo matagal — sandali lang pa po...',
    },
    pro: {
      minSeconds: 2,
      maxSeconds: 4,
      messageTl: 'Sandali lang po...',
      longWaitMessageTl: 'Medyo matagal — sandali lang pa po...',
    },
    business: {
      minSeconds: 2,
      maxSeconds: 4,
      messageTl: 'Sandali lang po...',
      longWaitMessageTl: 'Medyo matagal — sandali lang pa po...',
    },
  },
  classify_expense: {
    free: {
      minSeconds: 2,
      maxSeconds: 4,
      messageTl: 'Sandali lang po...',
      longWaitMessageTl: 'Medyo matagal — sandali lang pa po...',
    },
    pro: {
      minSeconds: 2,
      maxSeconds: 4,
      messageTl: 'Sandali lang po...',
      longWaitMessageTl: 'Medyo matagal — sandali lang pa po...',
    },
    business: {
      minSeconds: 2,
      maxSeconds: 4,
      messageTl: 'Sandali lang po...',
      longWaitMessageTl: 'Medyo matagal — sandali lang pa po...',
    },
  },
  classify_intent: {
    free: {
      minSeconds: 2,
      maxSeconds: 4,
      messageTl: 'Sandali lang po...',
      longWaitMessageTl: 'Medyo matagal — sandali lang pa po...',
    },
    pro: {
      minSeconds: 2,
      maxSeconds: 4,
      messageTl: 'Sandali lang po...',
      longWaitMessageTl: 'Medyo matagal — sandali lang pa po...',
    },
    business: {
      minSeconds: 2,
      maxSeconds: 4,
      messageTl: 'Sandali lang po...',
      longWaitMessageTl: 'Medyo matagal — sandali lang pa po...',
    },
  },
};

/**
 * Get estimated wait time and Taglish loading messages for a given feature + tier.
 * Used by the chat loading indicator to show realistic wait estimates.
 */
export function getEstimatedWait(feature: KAFeature, tier: UserTier): LoadingEstimate {
  return FEATURE_ESTIMATES[feature][tier];
}
