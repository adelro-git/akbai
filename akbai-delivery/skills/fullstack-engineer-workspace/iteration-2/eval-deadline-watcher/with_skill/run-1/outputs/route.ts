/**
 * BIR Deadline Watcher — API Route
 * Feature: BIR Deadline Watcher (Build 6)
 * Role: Server-side endpoint for fetching upcoming BIR deadlines
 *
 * Flow: Auth check → Get user → Query upcoming deadlines from Supabase
 *       → Filter soft-deleted → Order by due_date → Return response
 *
 * Dependencies: Supabase (bir_deadlines table with RLS)
 * Tested by: QA — auth flow, deadline query ordering, soft-delete filtering
 */

import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { GetDeadlinesResponseSchema } from '@/lib/utils/zod-schemas/deadline-types';

// --- Validate Request Method ---
// Only GET is allowed; all other methods return 405
export async function GET(request: Request) {
  try {
    // --- Auth Check: Verify session and get user ID ---
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiError(
        'UNAUTHORIZED',
        'User not authenticated',
        'Kailangan mong mag-login muna',
        401
      );
    }

    // --- Query Deadlines: Fetch all upcoming and pending deadlines for user ---
    // RLS policy ensures user can only see their own deadlines
    // Filter by deleted_at IS NULL (soft delete compliance)
    // Order by due_date ascending (nearest deadline first)
    const { data: deadlines, error: queryError } = await supabase
      .from('bir_deadlines')
      .select(
        'id,user_id,form_type,due_date,filed,filed_at,notification_sent_7d,notification_sent_3d,notification_sent_1d,created_at,updated_at'
      )
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('due_date', { ascending: true })
      .order('form_type', { ascending: true });

    if (queryError) {
      console.error('[api/deadlines] Supabase query error:', queryError);
      return apiError(
        'QUERY_ERROR',
        'Failed to fetch deadlines from database',
        'May problema sa pag-load ng deadlines. Subukan ulit.',
        500
      );
    }

    // --- Validate Response: Ensure response matches schema ---
    // This catches any schema drift between API and frontend expectations
    const validatedDeadlines = deadlines || [];

    try {
      const responseEnvelope = {
        success: true as const,
        data: validatedDeadlines,
      };
      GetDeadlinesResponseSchema.parse(responseEnvelope);
    } catch (validationError) {
      console.error(
        '[api/deadlines] Response validation error:',
        validationError
      );
      return apiError(
        'VALIDATION_ERROR',
        'Deadline data format mismatch',
        'May problema sa deadline data. Kontakin ang support.',
        500,
        { validation_error: String(validationError) }
      );
    }

    // --- Return Success: Respond with deadline list ---
    return apiSuccess(validatedDeadlines, 200);
  } catch (unexpectedError) {
    console.error('[api/deadlines] Unexpected error:', unexpectedError);
    return apiError(
      'INTERNAL_ERROR',
      'Unexpected server error',
      'May problema sa server. Subukan ulit mamaya.',
      500,
      {
        error_type: unexpectedError instanceof Error ? unexpectedError.name : 'Unknown',
      }
    );
  }
}

// --- Reject Other Methods ---
// Only GET is implemented for deadline fetching
export async function POST() {
  return apiError('METHOD_NOT_ALLOWED', 'POST not supported on this endpoint', '', 405);
}

export async function PUT() {
  return apiError('METHOD_NOT_ALLOWED', 'PUT not supported on this endpoint', '', 405);
}

export async function DELETE() {
  return apiError('METHOD_NOT_ALLOWED', 'DELETE not supported on this endpoint', '', 405);
}
