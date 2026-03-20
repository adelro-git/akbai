/**
 * /app/api/ka/chat/route.ts
 * POST endpoint for KA chat messages
 *
 * Flow:
 * 1. Auth check (get user)
 * 2. Tier check (Haiku for free, Sonnet for Pro/Business)
 * 3. Circuit breaker check (daily spend cap)
 * 4. Validate request body (Zod)
 * 5. Build KA context from user profile
 * 6. Fetch conversation history (last 10 messages)
 * 7. Build system prompt with context + domain scope
 * 8. Call Claude API with retry logic
 * 9. Store user message in ka_conversations
 * 10. Store KA response in ka_conversations
 * 11. Return response with standard envelope
 *
 * Error handling:
 * - Returns { success: false, error: { code, message, message_tl } }
 * - Taglish error messages for users
 * - English logs for debugging
 */

import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { callClaude, MODELS, ClaudeCircuitOpenError } from '@/lib/claude/client';
import { selectModel } from '@/lib/claude/model-router';
import { buildKAContext, buildKASystemPrompt } from '@/lib/claude/contexts/ka-context-builder';
import {
  storeConversationMessage,
  getConversationHistory,
} from '@/lib/supabase/queries/ka-conversations';
import { KAChatRequestSchema, type KAChatRequest } from '@/lib/utils/zod-schemas/ka-chat-schema';
import { ZodError } from 'zod';

/**
 * POST /api/ka/chat
 *
 * Request body:
 * {
 *   "message": "Magkano na ba ang sales ko this month?",
 *   "domain": "financial" (optional, default: "financial")
 * }
 *
 * Response (success):
 * {
 *   "success": true,
 *   "data": {
 *     "id": "uuid",
 *     "user_id": "uuid",
 *     "role": "assistant",
 *     "content": "Based sa records mo...",
 *     "domain": "financial",
 *     "tokens_input": 1234,
 *     "tokens_output": 456,
 *     "model": "claude-sonnet-4-6",
 *     "cost_centavos": 42,
 *     "created_at": "2026-03-15T10:30:00Z"
 *   }
 * }
 *
 * Response (error):
 * {
 *   "success": false,
 *   "error": {
 *     "code": "AI_CIRCUIT_OPEN",
 *     "message": "Daily spend cap reached",
 *     "message_tl": "Nag-rest muna si KA para bukas..."
 *   }
 * }
 */
export async function POST(req: Request) {
  try {
    // ============================================
    // 1. AUTH CHECK
    // ============================================
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn('Auth error in /api/ka/chat:', authError?.message);
      return apiError('AUTH_REQUIRED', 'Authentication required', 'Kailangan mong mag-login.', 401);
    }

    // ============================================
    // 2. VALIDATE REQUEST BODY
    // ============================================
    let body: unknown;
    try {
      body = await req.json();
    } catch (e) {
      console.warn('Invalid JSON in /api/ka/chat:', e);
      return apiError(
        'INVALID_JSON',
        'Request body is not valid JSON',
        'May problema sa message. Subukan ulit.',
        400
      );
    }

    const parseResult = KAChatRequestSchema.safeParse(body);
    if (!parseResult.success) {
      console.warn('Zod validation error in /api/ka/chat:', parseResult.error.issues);
      return apiError(
        'VALIDATION_ERROR',
        'Request validation failed',
        'Ang message mo ay hindi valid. Subukan ulit.',
        400,
        { issues: parseResult.error.issues }
      );
    }

    const request: KAChatRequest = parseResult.data;
    const domain = request.domain || 'financial';

    // ============================================
    // 3. BUILD KA CONTEXT (user profile)
    // ============================================
    let kaContext;
    try {
      kaContext = await buildKAContext(user.id);
    } catch (e) {
      console.error('Failed to build KA context:', e);
      return apiError(
        'CONTEXT_ERROR',
        'Cannot load user profile',
        'May problema sa pag-load ng profile mo. Subukan ulit.',
        500
      );
    }

    // ============================================
    // 4. TIER CHECK (model routing)
    // ============================================
    const selectedModel = selectModel('ka_reasoning', kaContext.tier);
    console.log(
      `Model selection: tier=${kaContext.tier}, task=ka_reasoning, model=${selectedModel}`
    );

    // ============================================
    // 5. CIRCUIT BREAKER CHECK
    // ============================================
    // Circuit breaker is checked inside callClaude()
    // If it fails, ClaudeCircuitOpenError is thrown and caught below

    // ============================================
    // 6. FETCH CONVERSATION HISTORY
    // ============================================
    let conversationHistory;
    try {
      conversationHistory = await getConversationHistory(user.id, domain, 10);
    } catch (e) {
      console.warn('Failed to fetch conversation history:', e);
      conversationHistory = []; // Degrade gracefully
    }

    // ============================================
    // 7. BUILD SYSTEM PROMPT
    // ============================================
    const systemPrompt = buildKASystemPrompt(kaContext, domain);

    // ============================================
    // 8. BUILD MESSAGES ARRAY
    // ============================================
    const messages: { role: 'user' | 'assistant'; content: string }[] = [
      // Add conversation history
      ...conversationHistory,
      // Add current user message
      {
        role: 'user' as const,
        content: request.message,
      },
    ];

    // ============================================
    // 9. CALL CLAUDE API
    // ============================================
    let claudeResponse;
    try {
      claudeResponse = await callClaude({
        model: selectedModel,
        system: systemPrompt,
        messages,
        maxTokens: 1024,
        temperature: 0.7, // Slightly higher for personality, but not too high for consistency
        userId: user.id,
      });

      console.log(`Claude API call succeeded:`, {
        model: selectedModel,
        inputTokens: claudeResponse.inputTokens,
        outputTokens: claudeResponse.outputTokens,
        costCentavos: claudeResponse.costCentavos,
      });
    } catch (e) {
      // ============================================
      // HANDLE CLAUDE API ERRORS
      // ============================================
      if (e instanceof ClaudeCircuitOpenError) {
        console.warn(`Circuit breaker opened: ${e.message}`);
        return apiError(
          'AI_CIRCUIT_OPEN',
          e.message,
          'Nag-rest muna si KA para bukas — marami nang na-process ngayon. Tuloy lang ang ibang features mo!',
          503
        );
      }

      // Generic Claude API error
      const errorMsg = e instanceof Error ? e.message : 'Unknown error';
      console.error(`Claude API error: ${errorMsg}`);
      return apiError(
        'AI_ERROR',
        `Claude API failed: ${errorMsg}`,
        'May problema sa KA ngayon. Subukan ulit sa ilang sandali.',
        503
      );
    }

    // ============================================
    // 10. STORE USER MESSAGE IN DB
    // ============================================
    let userMessageRecord;
    try {
      userMessageRecord = await storeConversationMessage({
        user_id: user.id,
        role: 'user',
        content: request.message,
        domain,
        tokens_input: 0, // We don't have token count for user message
      });
      console.log(`Stored user message: ${userMessageRecord.id}`);
    } catch (e) {
      console.error('Failed to store user message:', e);
      // Don't fail the whole request — continue to store assistant message
    }

    // ============================================
    // 11. STORE KA RESPONSE IN DB
    // ============================================
    let assistantMessageRecord;
    try {
      assistantMessageRecord = await storeConversationMessage({
        user_id: user.id,
        role: 'assistant',
        content: claudeResponse.content,
        domain,
        tokens_input: claudeResponse.inputTokens,
        tokens_output: claudeResponse.outputTokens,
        model: claudeResponse.model,
        cost_centavos: claudeResponse.costCentavos,
      });
      console.log(`Stored assistant message: ${assistantMessageRecord.id}`);
    } catch (e) {
      console.error('Failed to store assistant message:', e);
      // Return error response — can't reliably track conversation history
      return apiError(
        'STORAGE_ERROR',
        'Failed to store message in database',
        'May problema sa pag-save. Subukan ulit.',
        500
      );
    }

    // ============================================
    // 12. RETURN SUCCESS RESPONSE
    // ============================================
    return apiSuccess(
      {
        id: assistantMessageRecord.id,
        user_id: assistantMessageRecord.user_id,
        role: assistantMessageRecord.role,
        content: assistantMessageRecord.content,
        domain: assistantMessageRecord.domain,
        tokens_input: assistantMessageRecord.tokens_input,
        tokens_output: assistantMessageRecord.tokens_output,
        model: assistantMessageRecord.model,
        cost_centavos: assistantMessageRecord.cost_centavos,
        created_at: assistantMessageRecord.created_at,
        updated_at: assistantMessageRecord.updated_at,
      },
      200
    );
  } catch (e) {
    // Catch-all for unexpected errors
    const errorMsg = e instanceof Error ? e.message : 'Unknown error';
    console.error(`Unhandled error in /api/ka/chat: ${errorMsg}`, e);
    return apiError(
      'INTERNAL_ERROR',
      `Internal server error: ${errorMsg}`,
      'May problema sa server. Subukan ulit later.',
      500
    );
  }
}
