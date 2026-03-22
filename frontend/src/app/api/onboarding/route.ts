import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { OnboardingStepSchema } from '@/lib/kilala-kita/schemas';
import { getFirstKAMessage } from '@/lib/kilala-kita/first-responses';
import type { PainPoint } from '@/lib/kilala-kita/schemas';

// ============================================================
// POST — Save one onboarding step
// ============================================================
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message_tl: 'Kailangan mag-login muna.' } },
      { status: 401 }
    );
  }

  // Validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message_tl: 'Mali ang request format.' } },
      { status: 400 }
    );
  }

  const parsed = OnboardingStepSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message_tl: 'Mali ang data.',
          details: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  // Check current onboarding state
  const { data: userData } = await supabase
    .from('users')
    .select('onboarding_step, onboarding_completed')
    .eq('id', user.id)
    .single();

  if (!userData) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message_tl: 'Hindi mahanap ang user.' } },
      { status: 404 }
    );
  }

  if (userData.onboarding_completed) {
    return NextResponse.json(
      { success: false, error: { code: 'ALREADY_COMPLETED', message_tl: 'Tapos na ang onboarding.' } },
      { status: 400 }
    );
  }

  // Enforce sequential steps
  const expectedStep = userData.onboarding_step + 1;
  if (parsed.data.step !== expectedStep) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'WRONG_STEP',
          message_tl: `Kailangan muna tapusin ang step ${expectedStep}.`,
        },
      },
      { status: 400 }
    );
  }

  const stepData = parsed.data;

  switch (stepData.step) {
    case 1: {
      const { error } = await supabase
        .from('users')
        .update({ display_name: stepData.display_name, onboarding_step: 1 })
        .eq('id', user.id);
      if (error) {
        return NextResponse.json(
          { success: false, error: { code: 'DB_ERROR', message_tl: 'Hindi ma-save. Subukan muli.' } },
          { status: 500 }
        );
      }
      break;
    }

    case 2: {
      // Upsert business_profile
      const { data: existingProfile } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .single();

      if (existingProfile) {
        await supabase
          .from('business_profiles')
          .update({ business_type: stepData.business_type })
          .eq('id', existingProfile.id);
      } else {
        await supabase.from('business_profiles').insert({
          user_id: user.id,
          business_type: stepData.business_type,
        });
      }

      await supabase
        .from('users')
        .update({ onboarding_step: 2 })
        .eq('id', user.id);
      break;
    }

    case 3: {
      const { data: profile } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .single();

      if (profile) {
        await supabase
          .from('business_profiles')
          .update({ income_range: stepData.income_range })
          .eq('id', profile.id);
      }

      await supabase
        .from('users')
        .update({ onboarding_step: 3 })
        .eq('id', user.id);
      break;
    }

    case 4: {
      await supabase
        .from('users')
        .update({ primary_pain: stepData.primary_pain, onboarding_step: 4 })
        .eq('id', user.id);
      break;
    }

    case 5: {
      await supabase
        .from('users')
        .update({
          bir_consent: stepData.bir_consent,
          onboarding_step: 5,
          onboarding_completed: true,
        })
        .eq('id', user.id);

      // Generate first KA message
      const { data: finalUser } = await supabase
        .from('users')
        .select('display_name, primary_pain')
        .eq('id', user.id)
        .single();

      const { data: finalProfile } = await supabase
        .from('business_profiles')
        .select('business_type')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .single();

      const firstResponse = getFirstKAMessage(
        finalProfile?.business_type ?? 'other',
        (finalUser?.primary_pain ?? 'knowing_earnings') as PainPoint,
        finalUser?.display_name ?? 'Boss'
      );

      // Save first KA message to conversation history
      await supabase.from('ka_conversations').insert({
        user_id: user.id,
        role: 'assistant',
        content: firstResponse.message,
        domain: 'onboarding',
      });

      return NextResponse.json({
        success: true,
        data: {
          step: 5,
          completed: true,
          firstMessage: firstResponse.message,
          featureNudge: firstResponse.featureNudge,
        },
      });
    }
  }

  return NextResponse.json({
    success: true,
    data: { step: stepData.step, completed: false },
  });
}

// ============================================================
// GET — Return current onboarding state (for resumability)
// ============================================================
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message_tl: 'Kailangan mag-login muna.' } },
      { status: 401 }
    );
  }

  const { data: userData } = await supabase
    .from('users')
    .select('display_name, primary_pain, bir_consent, onboarding_step, onboarding_completed')
    .eq('id', user.id)
    .single();

  const { data: profile } = await supabase
    .from('business_profiles')
    .select('business_type, income_range')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single();

  return NextResponse.json({
    success: true,
    data: {
      onboarding_step: userData?.onboarding_step ?? 0,
      onboarding_completed: userData?.onboarding_completed ?? false,
      display_name: userData?.display_name ?? null,
      business_type: profile?.business_type ?? null,
      income_range: profile?.income_range ?? null,
      primary_pain: userData?.primary_pain ?? null,
      bir_consent: userData?.bir_consent ?? null,
    },
  });
}
