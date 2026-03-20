// AKBai Build 0 — Zod schemas for Claude API request validation

import { z } from 'zod';

/** Validated chat request from the client. */
export const ChatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  feature: z
    .enum([
      'general_chat',
      'resibo_scanner',
      'morning_briefing',
      'reply_drafter',
      'classify_expense',
      'classify_intent',
    ])
    .default('general_chat'),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;
