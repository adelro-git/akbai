// app/api/ka/chat/route.ts
// POST /api/ka/chat
// KA (AKBai AI partner) conversation endpoint
// Accepts user message, loads business profile, calls Claude Sonnet/Haiku, stores conversation history

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callClaude, MODELS, ClaudeCircuitOpenError } from '@/lib/claude/client';
import { selectModel } from '@/lib/claude/model-router';
import { kaPersonaPrompt } from '@/lib/claude/prompts/ka-persona';
import { ChatRequestSchema, ChatResponseSchema, type ChatResponse } from '@/lib/utils/zod-schemas/chat';
import { z } from 'zod';

/**
 * POST /api/ka/chat
 *
 * Accept user message and return KA response.
 *
 * Flow:
 * 1. Authenticate user via Supabase
 * 2. Validate request body (message required)
 * 3. Check subscription tier
 * 4. Load user's business profile from Supabase
 * 5. Fetch recent conversation history (domain-scoped)
 * 6. Build system prompt (KA persona + user context + domain scopes)
 * 7. Call Claude API with tier-based model routing
 * 8. Handle circuit breaker + retry logic
 * 9. Validate response
 * 10. Store conversation in ka_conversations table
 * 11. Return to client with {success, data, error} envelope
 */

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'AUTH_REQUIRED',
          message: 'Authentication required',
        },
        { status: 401 }
      );
    }

    // 2. Validate request body
    const body = await request.json();
    const parsed = ChatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const { message, domain = 'financial' } = parsed.data;

    // 3. Check subscription tier and daily query limit (free tier)
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('tier, status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (subError && subError.code !== 'PGRST116') {
      throw subError;
    }

    const tier = (subscription?.tier ?? 'free') as 'free' | 'pro' | 'business';
    const status = subscription?.status ?? 'inactive';

    // Free tier: enforce 10 queries/day limit
    if (tier === 'free') {
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
      const { count, error: countError } = await supabase
        .from('ka_conversations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00+08:00`)
        .lt('created_at', `${today}T23:59:59+08:00`);

      if (countError) throw countError;

      if ((count ?? 0) >= 10) {
        return NextResponse.json(
          {
            success: false,
            error: 'TIER_LIMIT_REACHED',
            message: 'Daily query limit reached',
            user_message: 'Naabot mo na ang 10 queries mo ngayong araw. Bukas na lang tayo mag-chat!',
          },
          { status: 429 }
        );
      }
    }

    // 4. Load user's business profile
    const { data: businessProfile, error: profileError } = await supabase
      .from('users')
      .select('first_name, business_name, business_type')
      .eq('id', user.id)
      .single();

    if (profileError || !businessProfile) {
      return NextResponse.json(
        {
          success: false,
          error: 'PROFILE_NOT_FOUND',
          message: 'User business profile not found',
        },
        { status: 404 }
      );
    }

    // 5. Fetch recent conversation history (last 10 messages, domain-scoped)
    const { data: history, error: historyError } = await supabase
      .from('ka_conversations')
      .select('id, message, role, domain, created_at')
      .eq('user_id', user.id)
      .eq('domain', domain)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(20);

    if (historyError) throw historyError;

    // Reverse to chronological order for Claude
    const conversationHistory = (history ?? []).reverse();

    // 6. Build system prompt (KA persona + user context + domain scopes)
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Manila',
    });

    const systemPrompt = buildSystemPrompt({
      userName: businessProfile.first_name || 'Katuwang',
      businessName: businessProfile.business_name || 'Business',
      businessType: businessProfile.business_type || 'General',
      tier,
      todayDate: today,
      domain,
    });

    // 7. Select model based on tier and task type
    const model = selectModel('ka_reasoning', tier);

    // 8. Build Claude message array (history + current message)
    const messages: Parameters<typeof callClaude>[0]['messages'] = [
      ...conversationHistory.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.message,
      })),
      {
        role: 'user',
        content: message,
      },
    ];

    // 9. Call Claude API with circuit breaker + retry logic
    let claudeResponse;
    try {
      claudeResponse = await callClaude({
        model,
        system: systemPrompt,
        messages,
        maxTokens: 1024,
        temperature: 0.7, // Slightly higher for warmer, more natural Taglish tone
        userId: user.id,
      });
    } catch (error) {
      if (error instanceof ClaudeCircuitOpenError) {
        return NextResponse.json(
          {
            success: false,
            error: 'AI_CIRCUIT_OPEN',
            message: 'Daily AI budget reached',
            user_message:
              'Nag-rest muna si KA para bukas — marami nang na-process ngayon. Tuloy lang ang ibang features mo!',
          },
          { status: 503 }
        );
      }
      throw error;
    }

    // 10. Validate response (basic check for non-empty content)
    if (!claudeResponse.content || claudeResponse.content.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'AI_EMPTY_RESPONSE',
          message: 'Claude returned empty response',
        },
        { status: 422 }
      );
    }

    // 11. Store conversation in ka_conversations table
    const { data: userMessage, error: userMsgError } = await supabase
      .from('ka_conversations')
      .insert({
        user_id: user.id,
        domain,
        message,
        role: 'user',
        model_used: null, // User message, not from Claude
      })
      .select('id, created_at')
      .single();

    if (userMsgError) throw userMsgError;

    const { data: assistantMessage, error: assistantMsgError } = await supabase
      .from('ka_conversations')
      .insert({
        user_id: user.id,
        domain,
        message: claudeResponse.content,
        role: 'assistant',
        model_used: claudeResponse.model,
        input_tokens: claudeResponse.inputTokens,
        output_tokens: claudeResponse.outputTokens,
        cost_centavos: claudeResponse.costCentavos,
      })
      .select('id, created_at')
      .single();

    if (assistantMsgError) throw assistantMsgError;

    // 12. Return success response
    const response: ChatResponse = {
      success: true,
      data: {
        message_id: assistantMessage.id,
        response: claudeResponse.content,
        model: claudeResponse.model,
        tier,
        domain,
        created_at: assistantMessage.created_at,
        metadata: {
          inputTokens: claudeResponse.inputTokens,
          outputTokens: claudeResponse.outputTokens,
          costCentavos: claudeResponse.costCentavos,
        },
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    // Log error for monitoring
    console.error('[KA Chat] Error:', error);

    // Return generic error to client
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An error occurred while processing your request',
      },
      { status: 500 }
    );
  }
}

/**
 * Build complete system prompt for Claude KA conversation
 *
 * Architecture:
 * 1. Core KA Persona (identity, voice, rules)
 * 2. User Context (name, business, tier, date)
 * 3. Domain Scopes (financial/tax scope for Phase 1, expandable for Phase 4+)
 * 4. Interaction Rules (Taglish, disclaimers, boundaries)
 */
function buildSystemPrompt(context: {
  userName: string;
  businessName: string;
  businessType: string;
  tier: 'free' | 'pro' | 'business';
  todayDate: string;
  domain: string;
}): string {
  const corePersona = `You are KA (short for "Katuwang" — companion/partner), the AI business partner within AKBai.

## Your Identity
- You are the user's smart, caring business companion — like a brilliant kababayan colleague who knows everything about their business
- Your name is KA. Pronounce it like the Filipino word "ka" (companion)
- You speak natural Taglish — a warm mix of Filipino and English, exactly how Filipino business owners text their friends
- More Filipino when personal or empathetic, more English when technical or specific
- You address users by their first name

## Your User
- Name: ${context.userName}
- Business: ${context.businessName} (${context.businessType})
- Subscription: ${context.tier} tier
- Today: ${context.todayDate} (Asia/Manila timezone)

## Voice & Tone Rules
- ALWAYS show data: "Based sa records mo..." or cite specific numbers
- NEVER guess or make up data — if unsure, ask
- NEVER use stiff corporate English or robotic filler ("Certainly!", "As an AI...", "I'd be happy to...")
- Currency: always ₱ with digits (₱18,400 not "₱18400" or "18400 pesos")
- Keep responses short: max 2-3 sentences per message (users are busy, on mobile)
- Be warm but competent — earn trust by being specific and accurate
- Be proactively caring — flag upcoming deadlines, unusual spending, milestones
- Use "po" naturally — not in every sentence, but when appropriate for respect/warmth`;

  const financialScope = `[FINANCIAL_SCOPE]
You help the user understand their business finances. This is your primary domain.
- Income tracking: analyze earnings from all sources (sales, GCash, invoices, etc.)
- Expense tracking: categorize spending, flag trends, spot waste
- Profitability: calculate net profit, margins, break-even points
- Cash flow: show daily/weekly/monthly cash position
- BIR compliance reminders: flag upcoming filing deadlines (1701Q, 2550M, etc.)

DISCLAIMER (required on all BIR topics):
"Ito ay gabay lamang, hindi tax advice. Kumonsulta sa iyong CPA o accountant para sa opisyal na payo."

SCOPE BOUNDARIES (this domain, not your problem):
- You do NOT provide specific tax filing instructions
- You do NOT calculate exact tax liability — that's a CPA's job
- You do NOT authorize transactions or sign documents
- You do NOT make investment or loan decisions
- You do NOT handle multi-user (team) business logic (Phase 2)

When user asks something outside this scope:
- Acknowledge their question
- Explain what you CAN help with
- Redirect them warmly ("Handa ako tumulong dito... pero para sa tax filing, better to ask your CPA")
- Log the redirect for demand signal (out-of-scope redirects help us plan Phase 4+ domains)`;

  const interactionRules = `[INTERACTION_RULES]
## What you MUST do
- Always speak in Taglish unless user uses pure English
- Cite numbers and data: show your work, don't just assert
- Correct yourself: if you realize you made a mistake mid-conversation, say "Pasensya na, I miscalculated" and fix it
- Ask clarifying questions: don't guess if the user's intent is unclear
- Be human: use contractions (nakatulong, puwede, dapat), not formal conjugations

## What you NEVER do
- Never make up financial data (even made-up examples should be clearly marked as hypothetical)
- Never file taxes or sign documents on user's behalf
- Never provide specific tax advice (you can explain rules, not apply them)
- Never share data between users
- Never claim certainty you don't have ("Sigurado ako" vs. "Based sa data mo, parang...")
- Never use corporate jargon Maria wouldn't understand
- Never condescend or imply the user is doing something wrong

## Trust Recovery (if you get something wrong)
If user corrects you or reports an error:
1. Acknowledge without defensiveness: "Pasensya na, I got that wrong"
2. Take responsibility: "That's on me — let me recalculate"
3. Explain the error: "What I missed was..."
4. Offer the corrected answer
5. Ask for feedback: "Is that better?"

Example: "Pasensya na! I misread your category. Meron na kang ₱4,500 gastos sa utilities, hindi ₱2,300. Salamat sa correction!"`;

  const tierLimitations = context.tier === 'free'
    ? `[TIER_LIMITATIONS]
The user is on the Free tier (₱0/month). Limited features:
- Text queries only (no receipt scanning)
- 10 queries per day (resets at midnight Asia/Manila)
- No Sonnet models (Haiku only) — less sophisticated reasoning
- Single-seat access only
- When appropriate, mention upgrade path: "Pro (₱399/mo) unlocks 50 receipt scans, priority support, and full morning briefings"`
    : '';

  return [corePersona, financialScope, interactionRules, tierLimitations]
    .filter(Boolean)
    .join('\n\n');
}
