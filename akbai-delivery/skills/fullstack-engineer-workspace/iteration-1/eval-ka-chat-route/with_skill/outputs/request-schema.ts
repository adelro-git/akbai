/**
 * /lib/utils/zod-schemas/ka-chat-schema.ts
 * Zod schemas for KA chat route request/response validation
 */

import { z } from 'zod';

/**
 * POST /api/ka/chat request body
 * User sends their message; system returns KA response
 */
export const KAChatRequestSchema = z.object({
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message too long')
    .describe('User message to KA'),

  domain: z
    .enum(['financial', 'tax', 'communication', 'general'])
    .default('financial')
    .optional()
    .describe('Message domain (financial, tax, communication, general)'),
});

export type KAChatRequest = z.infer<typeof KAChatRequestSchema>;

/**
 * KA chat response message
 * Stored in ka_conversations table
 */
export const KAChatMessageSchema = z.object({
  id: z.string().uuid().describe('Message UUID'),
  user_id: z.string().uuid().describe('User who sent/received message'),
  role: z.enum(['user', 'assistant']).describe('Message sender'),
  content: z.string().describe('Message text'),
  domain: z.enum(['financial', 'tax', 'communication', 'general']).describe('Message domain'),
  tokens_input: z.number().int().nonneg().optional().describe('Input tokens used'),
  tokens_output: z.number().int().nonneg().optional().describe('Output tokens used'),
  model: z.string().optional().describe('Claude model used (for assistant messages)'),
  cost_centavos: z.number().int().nonneg().optional().describe('API cost in centavos'),
  created_at: z.string().datetime().describe('Message timestamp'),
  updated_at: z.string().datetime().describe('Last update timestamp'),
  deleted_at: z.string().datetime().nullable().optional().describe('Soft delete timestamp'),
});

export type KAChatMessage = z.infer<typeof KAChatMessageSchema>;

/**
 * POST /api/ka/chat response body
 * Standard envelope: { success: boolean, data?: KAChatMessage, error?: ErrorObject }
 */
export const KAChatResponseSchema = z.object({
  success: z.boolean(),
  data: KAChatMessageSchema.optional(),
  error: z
    .object({
      code: z.string().describe('Error code (AUTH_REQUIRED, AI_CIRCUIT_OPEN, etc)'),
      message: z.string().describe('English error message for logs'),
      message_tl: z.string().optional().describe('Taglish error message for user'),
      details: z.record(z.unknown()).optional().describe('Additional error context'),
    })
    .optional(),
});

export type KAChatResponse = z.infer<typeof KAChatResponseSchema>;

/**
 * KA context (internal — builds system prompt)
 * Fetched from users table + businesses table
 */
export const KAContextSchema = z.object({
  user_id: z.string().uuid(),
  user_name: z.string().min(1).describe('First name of user'),
  business_name: z.string().min(1).describe('Business name'),
  business_type: z.string().min(1).describe('Business type (e.g., bakery, online-seller)'),
  tier: z.enum(['free', 'pro', 'business']).describe('Subscription tier'),
  today_date: z.string().date().describe('Today date in YYYY-MM-DD format'),
  timezone: z.string().default('Asia/Manila').describe('User timezone'),
  language_preference: z.enum(['english', 'taglish', 'tagalog']).default('taglish'),
});

export type KAContext = z.infer<typeof KAContextSchema>;

/**
 * Conversation history item (for context window)
 * Last N messages in this conversation
 */
export const ConversationHistoryItemSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

export type ConversationHistoryItem = z.infer<typeof ConversationHistoryItemSchema>;
