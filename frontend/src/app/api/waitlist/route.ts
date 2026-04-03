import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const WaitlistSchema = z.object({
  email: z.string().email('Invalid email address'),
  source: z.string().default('landing_page'),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid request format.',
          message_tl: 'Mali ang request format.',
        },
      },
      { status: 400 }
    )
  }

  const parsed = WaitlistSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_EMAIL',
          message: 'Please enter a valid email address.',
          message_tl: 'Kailangan ng valid na email address.',
          details: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    )
  }

  const { email, source } = parsed.data

  const supabase = await createClient()

  const { error } = await supabase
    .from('waitlist')
    .insert({ email, source })

  if (error) {
    // Handle unique constraint violation (duplicate email)
    if (error.code === '23505') {
      return NextResponse.json({
        success: true,
        data: { already_exists: true },
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DB_ERROR',
          message: 'Something went wrong. Please try again.',
          message_tl: 'May problema. Subukan muli.',
        },
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    data: { already_exists: false },
  })
}
