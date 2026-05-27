// AKBai Build 0 — Zod schemas for Claude API request validation

import { z } from 'zod';
import { KNOWN_FORM_CODES } from '@/lib/bir/forms';

// ADR-017 §1, §5 — same allowlist + N-range as the page parser.
const DeadlineContextSchema = z.object({
  formCode: z.enum(KNOWN_FORM_CODES),
  daysUntilDue: z.number().int().min(-30).max(30),
});

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
  /** Optional ADR-017 deadline deeplink context. */
  deadlineContext: DeadlineContextSchema.optional(),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;
