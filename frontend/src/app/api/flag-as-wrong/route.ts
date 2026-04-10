import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';

// ============================================================
// Zod Schema
// ============================================================

export const FlagAsWrongSchema = z.object({
  message_id: z.string().min(1, 'Kailangan ng message ID.'),
  reason: z.string().optional(),
  comment: z.string().max(500).optional(),
});

export type FlagAsWrongPayload = z.infer<typeof FlagAsWrongSchema>;

// ============================================================
// POST — Submit a flag-as-wrong report
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // --- Auth Check ---
    let userId: string;

    if (SKIP_AUTH) {
      userId = DEV_USER.id;
    } else {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message_tl: 'Kailangan mag-login muna.',
            },
          },
          { status: 401 }
        );
      }

      userId = user.id;
    }

    // --- Zod Validation ---
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message_tl: 'Mali ang request format.',
          },
        },
        { status: 400 }
      );
    }

    const parsed = FlagAsWrongSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message_tl: 'Walang message_id o mali ang format.',
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { message_id, reason, comment } = parsed.data;

    // --- Insert flag report ---
    // Dev bypass uses service client to bypass RLS; auth path uses normal client
    const db = SKIP_AUTH ? createServiceClient() : supabase;

    const { error: insertError } = await db
      .from('flag_as_wrong_reports')
      .insert({
        user_id: userId,
        message_id,
        reason: reason ?? null,
        user_comment: comment ?? null,
        status: 'open',
      });

    if (insertError) {
      console.error('[FlagAsWrong] Insert error:', insertError.message);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DB_ERROR',
            message_tl: 'Hindi ma-save ang report. Subukan muli.',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        message_tl: 'Salamat sa feedback mo! Ire-review namin \'to.',
      },
    });
  } catch (error: unknown) {
    console.error(
      '[FlagAsWrong] Server error:',
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message_tl: 'May nangyaring mali. Subukan muli.',
        },
      },
      { status: 500 }
    );
  }
}
