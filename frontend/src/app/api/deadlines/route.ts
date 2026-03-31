/**
 * Deadlines API Route — BIR Deadline Watcher
 * Feature: Build 6 — BIR Deadline Watcher (Sprint 9)
 * Role: CRUD for BIR deadlines. GET lists deadlines with urgency color
 *       coding, POST generates deadlines from tax type, PATCH updates status.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';
import { getManilaToday } from '@/lib/timezone';
import {
  DeadlinesQuerySchema,
  GenerateDeadlinesSchema,
  UpdateDeadlineSchema,
} from '@/lib/deadlines/schemas';
import { generateDeadlines } from '@/lib/deadlines/generate';
import type {
  DeadlineRow,
  DeadlineWithUrgency,
  DeadlineUrgency,
} from '@/lib/deadlines/types';

// ============================================================
// Dev-mode in-memory store for deadlines
// ============================================================

let devDeadlines: (DeadlineRow & { deleted_at: string | null })[] = [];

// ============================================================
// Helpers — urgency calculation
// ============================================================

function calculateUrgency(dueDate: string, status: string, today: string): { urgency: DeadlineUrgency; days_until: number } {
  const due = new Date(dueDate + 'T00:00:00');
  const ref = new Date(today + 'T00:00:00');
  const diffMs = due.getTime() - ref.getTime();
  const daysUntil = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let urgency: DeadlineUrgency;
  if (status === 'overdue' || daysUntil < 0) {
    urgency = 'overdue';
  } else if (daysUntil <= 7) {
    urgency = 'urgent';
  } else {
    urgency = 'normal';
  }

  return { urgency, days_until: daysUntil };
}

function enrichWithUrgency(rows: DeadlineRow[], today: string): DeadlineWithUrgency[] {
  return rows.map((row) => {
    const { urgency, days_until } = calculateUrgency(row.due_date, row.status, today);
    return { ...row, urgency, days_until };
  });
}

// ============================================================
// GET — List user's deadlines with urgency color coding
// ============================================================

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const today = getManilaToday();

  // Parse query params
  const url = new URL(req.url);
  const rawParams: Record<string, string> = {};
  for (const [k, v] of url.searchParams.entries()) {
    rawParams[k] = v;
  }

  const parsed = DeadlinesQuerySchema.safeParse(rawParams);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message_tl: 'Mali ang query parameters.' } },
      { status: 400 }
    );
  }

  const filters = parsed.data;

  if (SKIP_AUTH) {
    let filtered = devDeadlines.filter((d) => d.deleted_at === null);
    if (filters.status) filtered = filtered.filter((d) => d.status === filters.status);
    filtered.sort((a, b) => a.due_date.localeCompare(b.due_date));

    const enriched = enrichWithUrgency(
      filtered.map(({ deleted_at: _da, ...rest }) => rest),
      today
    );

    return NextResponse.json({ success: true, data: { deadlines: enriched } });
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

  // Build query
  let query = supabase
    .from('bir_deadlines')
    .select('id, user_id, form_name, due_date, description, status, notified_7d, notified_3d, notified_1d, created_at, updated_at')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('due_date', { ascending: true });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  const { data: deadlines, error: queryError } = await query;

  if (queryError) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message_tl: 'Hindi makuha ang deadlines. Subukan muli.' } },
      { status: 500 }
    );
  }

  const rows = (deadlines ?? []) as DeadlineRow[];
  const enriched = enrichWithUrgency(rows, today);

  return NextResponse.json({ success: true, data: { deadlines: enriched } });
}

// ============================================================
// POST — Generate deadlines for user based on their BIR tax type
// ============================================================

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message_tl: 'Mali ang request format.' } },
      { status: 400 }
    );
  }

  const parsed = GenerateDeadlinesSchema.safeParse(body);
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

  const { tax_type, year } = parsed.data;
  const generated = generateDeadlines(tax_type, year);

  if (SKIP_AUTH) {
    const userId = DEV_USER.id;
    let insertedCount = 0;

    for (const dl of generated) {
      // Upsert: skip if already exists for same form+due_date
      const exists = devDeadlines.find(
        (d) => d.user_id === userId && d.form_name === dl.form_name && d.due_date === dl.due_date && d.deleted_at === null
      );

      if (!exists) {
        devDeadlines.push({
          id: crypto.randomUUID(),
          user_id: userId,
          form_name: dl.form_name,
          due_date: dl.due_date,
          description: dl.description,
          status: 'upcoming',
          notified_7d: false,
          notified_3d: false,
          notified_1d: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
        });
        insertedCount++;
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          generated: generated.length,
          inserted: insertedCount,
          message: `Na-generate ang ${insertedCount} na bagong deadlines.`,
        },
      },
      { status: 201 }
    );
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

  // Upsert deadlines — insert only if not already existing
  let insertedCount = 0;

  for (const dl of generated) {
    const { data: existing } = await supabase
      .from('bir_deadlines')
      .select('id')
      .eq('user_id', user.id)
      .eq('form_name', dl.form_name)
      .eq('due_date', dl.due_date)
      .is('deleted_at', null)
      .maybeSingle();

    if (!existing) {
      const { error: insertError } = await supabase
        .from('bir_deadlines')
        .insert({
          user_id: user.id,
          form_name: dl.form_name,
          due_date: dl.due_date,
          description: dl.description,
          status: 'upcoming',
        });

      if (insertError) {
        return NextResponse.json(
          { success: false, error: { code: 'DB_ERROR', message_tl: 'Hindi ma-save ang deadline. Subukan muli.' } },
          { status: 500 }
        );
      }
      insertedCount++;
    }
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        generated: generated.length,
        inserted: insertedCount,
        message: `Na-generate ang ${insertedCount} na bagong deadlines.`,
      },
    },
    { status: 201 }
  );
}

// ============================================================
// PATCH — Update a deadline's status (e.g., mark as 'filed')
// ============================================================

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();

  // Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message_tl: 'Mali ang request format.' } },
      { status: 400 }
    );
  }

  const parsed = UpdateDeadlineSchema.safeParse(body);
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

  const { id, status } = parsed.data;

  if (SKIP_AUTH) {
    const deadline = devDeadlines.find((d) => d.id === id && d.deleted_at === null);
    if (!deadline) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message_tl: 'Hindi makita ang deadline.' } },
        { status: 404 }
      );
    }
    deadline.status = status;
    deadline.updated_at = new Date().toISOString();
    return NextResponse.json({ success: true, data: { id, status } });
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

  const { data: updated, error: updateError } = await supabase
    .from('bir_deadlines')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .select('id, status')
    .single();

  if (updateError || !updated) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message_tl: 'Hindi ma-update ang deadline. Subukan muli.' } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: updated });
}
