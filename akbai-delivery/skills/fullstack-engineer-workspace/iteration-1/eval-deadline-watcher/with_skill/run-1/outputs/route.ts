// app/api/deadlines/route.ts
// API route to fetch upcoming BIR deadlines for the authenticated user

import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import type { BirDeadline } from '@/lib/utils/zod-schemas/deadline';

export async function GET(request: Request) {
  try {
    // 1. Get authenticated user
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiError(
        'UNAUTHORIZED',
        'User not authenticated',
        'Kailangan mo ng account para makita ang deadlines',
        401
      );
    }

    // 2. Fetch deadlines for this user, sorted by due_date ascending
    const { data: deadlines, error: dbError } = await supabase
      .from('bir_deadlines')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('due_date', { ascending: true });

    if (dbError) {
      console.error('[deadlines] Database error:', dbError);
      return apiError(
        'DB_ERROR',
        'Failed to fetch deadlines',
        'May problema sa pag-load ng deadlines. Subukan ulit.',
        500
      );
    }

    // 3. Return success response
    return apiSuccess<BirDeadline[]>(deadlines || [], 200);
  } catch (error) {
    console.error('[deadlines] Unexpected error:', error);
    return apiError(
      'INTERNAL_ERROR',
      'Unexpected server error',
      'May problema sa server. Subukan ulit mamaya.',
      500
    );
  }
}

export async function POST(request: Request) {
  try {
    // 1. Get authenticated user
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiError(
        'UNAUTHORIZED',
        'User not authenticated',
        'Kailangan mo ng account',
        401
      );
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const { form_type, due_date } = body;

    if (!form_type || !due_date) {
      return apiError(
        'VALIDATION_ERROR',
        'form_type and due_date are required',
        'Kumpleto ang lahat ng fields?',
        400
      );
    }

    // 3. Insert deadline
    const { data: deadline, error: insertError } = await supabase
      .from('bir_deadlines')
      .insert({
        user_id: user.id,
        form_type: form_type.toUpperCase(),
        due_date,
        filed: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[deadlines] Insert error:', insertError);
      return apiError(
        'DB_ERROR',
        'Failed to create deadline',
        'Hindi ma-save ang deadline. Subukan ulit.',
        500
      );
    }

    return apiSuccess(deadline, 201);
  } catch (error) {
    console.error('[deadlines] POST error:', error);
    return apiError(
      'INTERNAL_ERROR',
      'Unexpected server error',
      'May problema sa server',
      500
    );
  }
}
