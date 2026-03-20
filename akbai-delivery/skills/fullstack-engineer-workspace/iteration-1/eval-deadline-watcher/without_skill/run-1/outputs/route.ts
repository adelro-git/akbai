import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase client with service role (server-side)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export const dynamic = 'force-dynamic';

interface DeadlineWithPriority {
  id: string;
  user_id: string;
  form_type: string;
  form_name: string;
  due_date: string;
  description: string | null;
  is_filed: boolean;
  filed_date: string | null;
  days_remaining: number;
  priority_level: 'critical' | 'warning' | 'normal';
  created_at: string;
  updated_at: string;
}

/**
 * GET /api/deadlines
 * Returns upcoming BIR deadlines for the authenticated user
 * Query parameters:
 *   - status: "unfiled" | "filed" | "all" (default: "unfiled")
 *   - limit: number (default: 50)
 *   - offset: number (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify the token and get the user
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !userData.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = userData.user.id;
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'unfiled';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0'));

    // Build query
    let query = supabaseAdmin
      .from('bir_deadlines')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('due_date', { ascending: true })
      .range(offset, offset + limit - 1);

    // Filter by status
    if (status === 'unfiled') {
      query = query.eq('is_filed', false);
    } else if (status === 'filed') {
      query = query.eq('is_filed', true);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch deadlines' },
        { status: 500 }
      );
    }

    // Compute days remaining and priority level for each deadline
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadlinesWithPriority: DeadlineWithPriority[] = (data || []).map((deadline: any) => {
      const dueDate = new Date(deadline.due_date);
      dueDate.setHours(0, 0, 0, 0);

      const daysRemaining = Math.ceil(
        (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      let priorityLevel: 'critical' | 'warning' | 'normal' = 'normal';
      if (daysRemaining <= 3) {
        priorityLevel = 'critical';
      } else if (daysRemaining <= 7) {
        priorityLevel = 'warning';
      }

      return {
        ...deadline,
        days_remaining: daysRemaining,
        priority_level: priorityLevel,
      };
    });

    return NextResponse.json({
      data: deadlinesWithPriority,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: offset + limit < (count || 0),
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/deadlines
 * Create a new BIR deadline for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify the token and get the user
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !userData.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = userData.user.id;
    const body = await request.json();

    // Validate required fields
    const { form_type, form_name, due_date, description, is_filed, filed_date } = body;

    if (!form_type || !form_name || !due_date) {
      return NextResponse.json(
        { error: 'Missing required fields: form_type, form_name, due_date' },
        { status: 400 }
      );
    }

    // Validate dates
    const dueDateObj = new Date(due_date);
    if (isNaN(dueDateObj.getTime())) {
      return NextResponse.json(
        { error: 'Invalid due_date format' },
        { status: 400 }
      );
    }

    if (is_filed && !filed_date) {
      return NextResponse.json(
        { error: 'filed_date is required when is_filed is true' },
        { status: 400 }
      );
    }

    // Insert the deadline
    const { data, error } = await supabaseAdmin
      .from('bir_deadlines')
      .insert({
        user_id: userId,
        form_type,
        form_name,
        due_date,
        description: description || null,
        is_filed: is_filed || false,
        filed_date: filed_date || null,
      })
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to create deadline' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data: data?.[0] || null },
      { status: 201 }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/deadlines/:id
 * Update a BIR deadline
 */
export async function PATCH(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify the token and get the user
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !userData.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = userData.user.id;
    const { searchParams } = request.nextUrl;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing deadline ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // First, verify the deadline belongs to the user
    const { data: existingDeadline, error: fetchError } = await supabaseAdmin
      .from('bir_deadlines')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingDeadline) {
      return NextResponse.json(
        { error: 'Deadline not found or access denied' },
        { status: 404 }
      );
    }

    // Update the deadline
    const { data, error } = await supabaseAdmin
      .from('bir_deadlines')
      .update(body)
      .eq('id', id)
      .eq('user_id', userId)
      .select();

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json(
        { error: 'Failed to update deadline' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data?.[0] || null });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/deadlines/:id
 * Delete a BIR deadline
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify the token and get the user
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !userData.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = userData.user.id;
    const { searchParams } = request.nextUrl;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing deadline ID' },
        { status: 400 }
      );
    }

    // Delete the deadline
    const { error } = await supabaseAdmin
      .from('bir_deadlines')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete deadline' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 204 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
