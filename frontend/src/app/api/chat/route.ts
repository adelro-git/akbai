import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const KA_SYSTEM_PROMPT = `You are Kai, the AI business partner inside AKBai — katuwang ng negosyo ng mga Filipino MSME.

VOICE: You speak in natural Taglish (Filipino-English mix). Warm, competent, proactive. Use "po" naturally — not every sentence, but when appropriate. Always on BIR/tax topics.

STYLE:
- Keep responses short: max 2–3 sentences
- Use digits for numbers (₱18,400 not "eighteen thousand")
- Call the user by first name when known
- Never say "Certainly!", "As an AI...", or robotic filler
- You are a brilliant kababayan colleague, not a corporate chatbot
- Start conversations proactively — give insight before being asked when you have data

DISCLAIMER (add naturally when giving financial/tax guidance):
"Paalala lang po: I-verify mo ito sa iyong accountant o CPA bago mag-file."

SCOPE (Phase 1 only):
- Income/expense tracking
- BIR deadlines and compliance basics
- Cash flow questions
- Business profitability questions
For questions outside scope (legal advice, specific OR numbers, VAT registration), redirect warmly: "Para sa specific na tax computation, mas magaling jan ang iyong CPA po."
`

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            message_tl: 'Kailangan mag-login muna.',
          },
        },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { message } = body

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Message is required',
            message_tl: 'Walang mensahe.',
          },
        },
        { status: 400 }
      )
    }

    const { data: history } = await supabase
      .from('ka_conversations')
      .select('role, content')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(20)

    await supabase.from('ka_conversations').insert({
      user_id: user.id,
      role: 'user',
      content: message.trim(),
      domain: 'general',
    })

    // NOTE: Replace this with your own Anthropic API key for production use.
    // Currently using Emergent Universal Key via the FastAPI backend.
    // This Next.js route is a fallback — the primary endpoint is handled by FastAPI.
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey || apiKey === 'your-anthropic-api-key-here') {
      const fallback =
        'Sandali lang po — ang ANTHROPIC_API_KEY ay hindi pa na-configure. I-add mo sa .env.local file para ma-activate si Kai!'
      await supabase.from('ka_conversations').insert({
        user_id: user.id,
        role: 'assistant',
        content: fallback,
        domain: 'general',
      })
      return NextResponse.json({ success: true, data: { message: fallback } })
    }

    const anthropic = new Anthropic({ apiKey })

    const contextMessages: Anthropic.MessageParam[] = [
      ...(history || []).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message.trim() },
    ]

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: KA_SYSTEM_PROMPT,
      messages: contextMessages,
    })

    const kaiResponse =
      response.content[0].type === 'text'
        ? response.content[0].text
        : 'Pasensya na po, may problema. Subukan muli.'

    await supabase.from('ka_conversations').insert({
      user_id: user.id,
      role: 'assistant',
      content: kaiResponse,
      domain: 'general',
    })

    return NextResponse.json({ success: true, data: { message: kaiResponse } })
  } catch (error: unknown) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Something went wrong',
          message_tl: 'May nangyaring mali. Pakiulit ulit.',
        },
      },
      { status: 500 }
    )
  }
}
