/**
 * Reply Drafter — Zod schemas (Build 7)
 *
 * Input validation for the /api/reply-draft endpoint.
 * All API inputs go through Zod — no raw body parsing.
 */

import { z } from 'zod';

// ============================================================
// Request Schema
// ============================================================

export const ReplyDraftRequestSchema = z.object({
  customerMessage: z
    .string()
    .min(1, 'Customer message is required')
    .max(2000, 'Message too long — max 2000 characters'),
  context: z
    .string()
    .max(500, 'Context too long — max 500 characters')
    .optional(),
  tone: z
    .enum(['friendly', 'professional', 'casual'])
    .default('friendly'),
});

export type ReplyDraftInput = z.infer<typeof ReplyDraftRequestSchema>;

// ============================================================
// Response Schema (for type validation in tests)
// ============================================================

export const ReplyOptionSchema = z.object({
  text: z.string().min(1),
  tone: z.string().min(1),
});

export const ReplyDraftResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      replies: z.array(ReplyOptionSchema).min(1).max(3),
      disclaimer: z.string(),
    })
    .optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      message_tl: z.string(),
    })
    .optional(),
});
