// lib/utils/zod-schemas/chat.ts
// Zod schemas for KA chat request/response validation

import { z } from 'zod';

/**
 * Incoming request to POST /api/ka/chat
 */
export const ChatRequestSchema = z.object({
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message too long')
    .describe('User message to KA'),
  domain: z
    .enum(['financial'])
    .default('financial')
    .describe('Domain of conversation (financial for Phase 1, expandable for Phase 4+)'),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

/**
 * Success response from POST /api/ka/chat
 */
export const ChatResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    message_id: z.string().uuid().describe('ID of the stored assistant message'),
    response: z.string().describe('KA response in Taglish'),
    model: z.string().describe('Claude model used (claude-haiku-4-5-20251001 or claude-sonnet-4-6)'),
    tier: z.enum(['free', 'pro', 'business']).describe('User subscription tier'),
    domain: z.string().describe('Conversation domain'),
    created_at: z.string().datetime().describe('Server timestamp of response'),
    metadata: z.object({
      inputTokens: z.number().int().nonneg().describe('Tokens consumed from input'),
      outputTokens: z.number().int().nonneg().describe('Tokens consumed from output'),
      costCentavos: z.number().int().nonneg().describe('Cost in Philippine centavos'),
    }),
  }),
});

export type ChatResponse = z.infer<typeof ChatResponseSchema>;

/**
 * Error response from POST /api/ka/chat
 *
 * Standard error codes:
 * - AUTH_REQUIRED: User not authenticated
 * - VALIDATION_ERROR: Request body invalid
 * - TIER_LIMIT_REACHED: Free tier daily limit (10 queries) reached
 * - PROFILE_NOT_FOUND: User business profile not set up yet
 * - AI_CIRCUIT_OPEN: Daily Claude API spend cap exceeded
 * - AI_EMPTY_RESPONSE: Claude returned empty response
 * - INTERNAL_ERROR: Unhandled server error
 */
export const ChatErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string().describe('Machine-readable error code'),
  message: z.string().describe('English error message for debugging'),
  user_message: z
    .string()
    .optional()
    .describe('User-facing Taglish message (if applicable)'),
  details: z
    .any()
    .optional()
    .describe('Additional error details (e.g., Zod validation issues)'),
});

export type ChatErrorResponse = z.infer<typeof ChatErrorResponseSchema>;

/**
 * Conversation history row as stored in ka_conversations table
 */
export const ConversationMessageSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  domain: z.string(),
  message: z.string().describe('The message content'),
  role: z.enum(['user', 'assistant']).describe('Message author'),
  model_used: z.string().nullable().describe('Claude model if role=assistant, null if role=user'),
  input_tokens: z.number().int().nonneg().nullable(),
  output_tokens: z.number().int().nonneg().nullable(),
  cost_centavos: z.number().int().nonneg().nullable(),
  created_at: z.string().datetime(),
  deleted_at: z.string().datetime().nullable(),
});

export type ConversationMessage = z.infer<typeof ConversationMessageSchema>;
