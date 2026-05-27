import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { enforceRateLimit } from '@/lib/rate-limit/middleware';
import { createServiceClient } from '@/lib/supabase/service';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';
import { BusinessTypeEnum, IncomeRangeEnum } from '@/lib/kilala-kita/schemas';
import { BIR_TAX_TYPES } from '@/lib/deadlines/types';

// ============================================================
// Zod Schemas
// ============================================================

export const ProfilePatchSchema = z
  .object({
    display_name: z.string().trim().min(1, 'Kailangan ng pangalan.').max(100).optional(),
    business_name: z.string().trim().max(200).optional(),
    business_type: BusinessTypeEnum.optional(),
    income_range: IncomeRangeEnum.optional(),
    bir_registered: z.boolean().optional(),
    bir_tax_type: z.enum(BIR_TAX_TYPES).optional(),
  })
  .refine(
    (data) =>
      data.display_name !== undefined ||
      data.business_name !== undefined ||
      data.business_type !== undefined ||
      data.income_range !== undefined ||
      data.bir_registered !== undefined ||
      data.bir_tax_type !== undefined,
    { message: 'Walang data na i-update.' }
  );

export type ProfilePatchPayload = z.infer<typeof ProfilePatchSchema>;

export interface ProfileData {
  display_name: string | null;
  email: string | null;
  business_name: string | null;
  business_type: string | null;
  income_range: string | null;
  bir_registered: boolean;
  bir_tax_type: string | null;
  profile_version: number;
}

// ============================================================
// GET — Return user + business profile data
// ============================================================

export async function GET() {
  const supabase = await createClient();

  let userId: string;
  let userEmail: string | null = null;

  if (SKIP_AUTH) {
    userId = DEV_USER.id;
    userEmail = DEV_USER.email ?? null;

    // Dev bypass — query real DB with service client to bypass RLS
    const svc = createServiceClient();

    const { data: devUserData } = await svc
      .from('users')
      .select('display_name')
      .eq('id', userId)
      .single();

    const { data: devProfile } = await svc
      .from('business_profiles')
      .select('business_name, business_type, income_range, bir_registered, bir_tax_type')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    const response: ProfileData = {
      display_name: devUserData?.display_name ?? null,
      email: userEmail,
      business_name: devProfile?.business_name ?? null,
      business_type: devProfile?.business_type ?? null,
      income_range: devProfile?.income_range ?? null,
      bir_registered: devProfile?.bir_registered ?? false,
      bir_tax_type: devProfile?.bir_tax_type ?? null,
      profile_version: 1,
    };

    return NextResponse.json({ success: true, data: response });
  }

  // Auth check
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

  userId = user.id;
  userEmail = user.email ?? null;

  // Fetch user data
  const { data: userData } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', userId)
    .single();

  // Fetch business profile
  const { data: profile } = await supabase
    .from('business_profiles')
    .select('business_name, business_type, income_range, bir_registered, bir_tax_type')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single();

  const response: ProfileData = {
    display_name: userData?.display_name ?? null,
    email: userEmail,
    business_name: profile?.business_name ?? null,
    business_type: profile?.business_type ?? null,
    income_range: profile?.income_range ?? null,
    bir_registered: profile?.bir_registered ?? false,
    bir_tax_type: profile?.bir_tax_type ?? null,
    profile_version: 1,
  };

  return NextResponse.json({ success: true, data: response });
}

// ============================================================
// PATCH — Update user + business profile
// ============================================================

export async function PATCH(req: NextRequest) {
  const limited = enforceRateLimit(req, { key: 'profile', windowMs: 60_000, maxRequests: 20 });
  if (limited) return limited;

  const supabase = await createClient();

  let userId: string;

  if (SKIP_AUTH) {
    userId = DEV_USER.id;

    // Validate body even in dev mode
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message_tl: 'Mali ang request format.' } },
        { status: 400 }
      );
    }

    const parsed = ProfilePatchSchema.safeParse(body);
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

    // Dev bypass — persist to DB like production, use service client to bypass RLS
    const svc = createServiceClient();
    const data = parsed.data;

    // Update users table if display_name provided
    if (data.display_name !== undefined) {
      await svc
        .from('users')
        .update({ display_name: data.display_name })
        .eq('id', userId);
    }

    // Update business_profiles if any business field provided
    const devBusinessFields: Record<string, string | boolean> = {};
    if (data.business_name !== undefined) devBusinessFields.business_name = data.business_name;
    if (data.business_type !== undefined) devBusinessFields.business_type = data.business_type;
    if (data.income_range !== undefined) devBusinessFields.income_range = data.income_range;
    if (data.bir_registered !== undefined) devBusinessFields.bir_registered = data.bir_registered;
    if (data.bir_tax_type !== undefined) devBusinessFields.bir_tax_type = data.bir_tax_type;

    if (Object.keys(devBusinessFields).length > 0) {
      const { data: currentProfile } = await svc
        .from('business_profiles')
        .select('id')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();

      if (currentProfile) {
        await svc
          .from('business_profiles')
          .update(devBusinessFields)
          .eq('id', currentProfile.id);
      }
    }

    // Re-fetch updated data
    const { data: devUser } = await svc
      .from('users')
      .select('display_name')
      .eq('id', userId)
      .single();

    const { data: devProfile } = await svc
      .from('business_profiles')
      .select('business_name, business_type, income_range, bir_registered, bir_tax_type')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    const response: ProfileData = {
      display_name: devUser?.display_name ?? 'Boss',
      email: DEV_USER.email ?? null,
      business_name: devProfile?.business_name ?? 'Dev Business',
      business_type: devProfile?.business_type ?? 'food_baking',
      income_range: devProfile?.income_range ?? 'below_50k',
      bir_registered: devProfile?.bir_registered ?? false,
      bir_tax_type: devProfile?.bir_tax_type ?? null,
      profile_version: 1,
    };

    return NextResponse.json({ success: true, data: response });
  }

  // Auth check
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

  userId = user.id;

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

  const parsed = ProfilePatchSchema.safeParse(body);
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

  const data = parsed.data;

  // Update users table if display_name provided
  if (data.display_name !== undefined) {
    const { error: userError } = await supabase
      .from('users')
      .update({ display_name: data.display_name })
      .eq('id', userId);

    if (userError) {
      return NextResponse.json(
        { success: false, error: { code: 'DB_ERROR', message_tl: 'Hindi ma-save ang pangalan. Subukan muli.' } },
        { status: 500 }
      );
    }
  }

  // Update business_profiles if any business field provided
  const businessFields: Partial<{
    business_name: string;
    business_type: string;
    income_range: string;
    bir_registered: boolean;
    bir_tax_type: string;
  }> = {};

  if (data.business_name !== undefined) businessFields.business_name = data.business_name;
  if (data.business_type !== undefined) businessFields.business_type = data.business_type;
  if (data.income_range !== undefined) businessFields.income_range = data.income_range;
  if (data.bir_registered !== undefined) businessFields.bir_registered = data.bir_registered;
  if (data.bir_tax_type !== undefined) businessFields.bir_tax_type = data.bir_tax_type;

  if (Object.keys(businessFields).length > 0) {
    const { data: currentProfile } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (!currentProfile) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message_tl: 'Walang business profile. I-setup muna sa onboarding.' } },
        { status: 404 }
      );
    }

    const { error: profileError } = await supabase
      .from('business_profiles')
      .update(businessFields)
      .eq('id', currentProfile.id);

    if (profileError) {
      return NextResponse.json(
        { success: false, error: { code: 'DB_ERROR', message_tl: 'Hindi ma-save ang profile. Subukan muli.' } },
        { status: 500 }
      );
    }
  }

  // Re-fetch updated data
  const { data: updatedUser } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', userId)
    .single();

  const { data: updatedProfile } = await supabase
    .from('business_profiles')
    .select('business_name, business_type, income_range, bir_registered, bir_tax_type')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single();

  const response: ProfileData = {
    display_name: updatedUser?.display_name ?? null,
    email: user.email ?? null,
    business_name: updatedProfile?.business_name ?? null,
    business_type: updatedProfile?.business_type ?? null,
    income_range: updatedProfile?.income_range ?? null,
    bir_registered: updatedProfile?.bir_registered ?? false,
    bir_tax_type: updatedProfile?.bir_tax_type ?? null,
    profile_version: 1,
  };

  return NextResponse.json({ success: true, data: response });
}
