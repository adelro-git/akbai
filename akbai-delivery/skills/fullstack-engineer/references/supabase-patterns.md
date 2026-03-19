# AKBai — Supabase Patterns
> Reference for fullstack-engineer skill. Typed client setup, RLS templates, Edge Function boilerplate, query patterns, migrations.
> Last updated: March 2026 | Stack: Supabase (Postgres, Auth, Storage, Edge Functions, Realtime)

---

## Table of Contents

1. [Typed Client Setup](#typed-client-setup)
2. [RLS Policy Templates](#rls-policy-templates)
3. [Common Query Patterns](#common-query-patterns)
4. [Migration Conventions](#migration-conventions)
5. [Edge Function Boilerplate](#edge-function-boilerplate)
6. [Supabase Storage Patterns](#supabase-storage-patterns)
7. [Realtime Subscriptions](#realtime-subscriptions)

---

## Typed Client Setup

AKBai uses three Supabase client variants. Each has a specific purpose and security boundary.

### Generate Types

Run this after every migration to keep types in sync:

```bash
supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/types.ts
```

This generates a `Database` type that reflects your actual schema. Every query is type-checked against it.

### Browser Client (client-side)

Used in Client Components (`'use client'`). Uses the anon key and relies on RLS for security.

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### Server Client (API routes, Server Components)

Used in Server Components and API routes. Reads the auth session from cookies. Still subject to RLS — it acts as the authenticated user.

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './types';

export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // In Server Components, cookie setting is a no-op.
            // This is fine — the middleware handles session refresh.
          }
        },
      },
    }
  );
}
```

### Admin Client (service role — server-side only)

Bypasses RLS. Used for cross-user operations like Anton's admin dashboard, aggregating metrics, or system-level tasks. This file must NEVER be imported in client-side code.

```typescript
// lib/supabase/admin.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// This client uses the service role key — it bypasses RLS.
// Only import this in server-side code (API routes, Edge Functions).
// NEVER import in components or pages that could end up in the client bundle.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

### Auth Middleware (session refresh)

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session — this is the critical line
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect unauthenticated users away from app routes
  if (!user && request.nextUrl.pathname.startsWith('/(app)')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

---

## RLS Policy Templates

Every table in AKBai has RLS enabled. No exceptions. These templates cover the common patterns.

### Standard User-Scoped CRUD

Apply this to every user-owned table (transactions, receipts, invoices, etc.):

```sql
-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Read own rows (excludes soft-deleted)
CREATE POLICY "Users read own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Insert own rows
CREATE POLICY "Users insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Update own rows (only non-deleted)
CREATE POLICY "Users update own transactions"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- Soft-delete own rows (update deleted_at)
-- Note: no DELETE policy needed since hard deletes are prohibited
```

### Service Role Access (Admin Operations)

The service role bypasses RLS automatically, so no additional policy is needed for admin operations. The admin client (`lib/supabase/admin.ts`) uses this key. Keep admin operations in API routes only.

### Multi-Seat (Business Tier — Phase 2)

When Business tier launches with multi-seat support (up to 5 team members), RLS policies need to account for team membership:

```sql
-- Future: Business tier multi-seat
CREATE POLICY "Team members read business transactions"
  ON transactions FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.business_id = transactions.business_id
        AND team_members.user_id = auth.uid()
        AND team_members.deleted_at IS NULL
    )
  );
```

This is Phase 2 — don't implement it yet, but design tables to be compatible with it (every user-owned table should have both `user_id` and `business_id`).

---

## Common Query Patterns

### Paginated List (Cursor-Based)

```typescript
// lib/supabase/queries/transactions.ts
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

type Transaction = Database['public']['Tables']['transactions']['Row'];

interface PaginatedResult<T> {
  items: T[];
  next_cursor: string | null;
  has_more: boolean;
}

export async function getTransactions(
  userId: string,
  cursor?: string,
  limit = 20
): Promise<PaginatedResult<Transaction>> {
  const supabase = createClient();

  let query = supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1); // Fetch one extra to check has_more

  if (cursor) {
    query = query.lt('id', cursor);
  }

  const { data, error } = await query;

  if (error) throw error;

  const has_more = (data?.length ?? 0) > limit;
  const items = data?.slice(0, limit) ?? [];
  const next_cursor = has_more ? items[items.length - 1]?.id ?? null : null;

  return { items, next_cursor, has_more };
}
```

### Insert with Audit Columns

Supabase auto-sets `created_at` via default. Use a trigger for `updated_at`:

```sql
-- Migration: Auto-update updated_at on every UPDATE
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to every table
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

```typescript
// Application code — just insert, audit columns are handled by the DB
const { data, error } = await supabase
  .from('transactions')
  .insert({
    user_id: user.id,
    amount: 345000, // centavos
    type: 'expense',
    category: 'ingredients',
    description: 'Flour and sugar for ube cake',
    date: '2026-03-14',
  })
  .select()
  .single();
```

### Soft Delete

```typescript
export async function softDeleteTransaction(userId: string, transactionId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('transactions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', transactionId)
    .eq('user_id', userId) // Defense in depth — even with RLS
    .is('deleted_at', null) // Can't delete something already deleted
    .select()
    .single();

  return { data, error };
}
```

### Upsert with Conflict Handling

Useful for daily_entries (one per user per date):

```typescript
const { data, error } = await supabase
  .from('daily_entries')
  .upsert(
    {
      user_id: user.id,
      date: '2026-03-14',
      sales: 1500000, // centavos
      expenses: 450000,
    },
    { onConflict: 'user_id,date' }
  )
  .select()
  .single();
```

### Aggregation Query (Dashboard)

```typescript
// Monthly totals for Saan Napunta
const { data, error } = await supabase
  .rpc('get_monthly_totals', {
    p_user_id: user.id,
    p_year: 2026,
    p_month: 3,
  });

// The RPC function (in a migration):
// CREATE FUNCTION get_monthly_totals(p_user_id UUID, p_year INT, p_month INT)
// RETURNS TABLE(category TEXT, total_amount BIGINT, transaction_count INT)
// AS $$ ... $$ LANGUAGE sql SECURITY DEFINER;
```

For complex aggregations, use Postgres functions (`SECURITY DEFINER` with explicit user_id check inside) rather than multiple client-side queries. This reduces round trips — important on Philippine LTE.

---

## Migration Conventions

### File Naming

```
supabase/migrations/
  001_initial_schema.sql
  002_add_bir_deadlines.sql
  003_add_receipt_deduplication.sql
```

Sequential numbering. Descriptive name. One logical change per migration.

### Migration Template

```sql
-- Migration: 002_add_bir_deadlines.sql
-- Purpose: Create BIR deadline tracking table
-- Build: Build 6 (Deadline Watcher)

-- Create table
CREATE TABLE IF NOT EXISTS bir_deadlines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  business_id UUID NOT NULL REFERENCES businesses(id),
  form_type TEXT NOT NULL,           -- '1701Q', '2550M', '2551Q', etc.
  due_date DATE NOT NULL,
  filed BOOLEAN DEFAULT FALSE,
  filed_at TIMESTAMPTZ,
  notification_sent_7d BOOLEAN DEFAULT FALSE,
  notification_sent_3d BOOLEAN DEFAULT FALSE,
  notification_sent_1d BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_bir_deadlines_user_date
  ON bir_deadlines(user_id, due_date)
  WHERE deleted_at IS NULL;

-- RLS
ALTER TABLE bir_deadlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own deadlines"
  ON bir_deadlines FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users insert own deadlines"
  ON bir_deadlines FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own deadlines"
  ON bir_deadlines FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON bir_deadlines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Migration Checklist

Every migration must:
- [ ] Include RLS policies (enable + per-operation policies)
- [ ] Add `created_at`, `updated_at`, `deleted_at` columns
- [ ] Add `user_id` foreign key to `auth.users(id)` (for user-owned tables)
- [ ] Add `updated_at` trigger
- [ ] Add relevant indexes (especially on `user_id` + frequently filtered columns)
- [ ] Use `WHERE deleted_at IS NULL` in index conditions for partial indexes
- [ ] Be idempotent (`IF NOT EXISTS`, `OR REPLACE` where possible)

---

## Edge Function Boilerplate

Edge Functions run on Supabase's Deno runtime. AKBai uses them for webhooks only — all other server logic lives in Next.js API routes.

### Xendit Payment Webhook

```typescript
// supabase/functions/xendit-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req: Request) => {
  // 1. Verify webhook signature
  const callbackToken = req.headers.get('x-callback-token');
  if (callbackToken !== Deno.env.get('XENDIT_WEBHOOK_TOKEN')) {
    return new Response('Unauthorized', { status: 401 });
  }

  // 2. Parse body
  const body = await req.json();
  const { id: paymentId, status, external_id } = body;

  // 3. Create admin client (service role — bypasses RLS)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // 4. Idempotency check — prevent double-processing (Gap D2)
  const { data: existing } = await supabase
    .from('webhook_events')
    .select('id')
    .eq('payment_id', paymentId)
    .eq('event_type', 'payment.success')
    .single();

  if (existing) {
    // Already processed — return 200 so Xendit doesn't retry
    return new Response(JSON.stringify({ received: true, deduplicated: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 5. Record the webhook event
  await supabase.from('webhook_events').insert({
    payment_id: paymentId,
    event_type: `payment.${status}`,
    payload: body,
  });

  // 6. Process based on status
  if (status === 'PAID') {
    // Extract user_id from external_id (format: "sub_{userId}_{planId}")
    const userId = external_id.split('_')[1];

    await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        last_payment_at: new Date().toISOString(),
        grace_period_end: null,
      })
      .eq('user_id', userId);
  } else if (status === 'FAILED') {
    const userId = external_id.split('_')[1];

    // Set 3-day grace period (Gap C2)
    const gracePeriodEnd = new Date();
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 3);

    await supabase
      .from('subscriptions')
      .update({
        status: 'past_due',
        grace_period_end: gracePeriodEnd.toISOString(),
      })
      .eq('user_id', userId);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
```

### Edge Function Rules

- Webhooks only — no business logic that belongs in Next.js API routes
- Always verify the webhook signature/token first
- Always check idempotency before processing
- Use the service role client (webhooks come from external systems, not authenticated users)
- Return 200 even for deduplicated events — otherwise the webhook provider retries
- Log the full payload to `webhook_events` for debugging

---

## Supabase Storage Patterns

### Receipt Image Storage

```typescript
// Client-side: upload receipt image to Supabase Storage
const filePath = `${userId}/${year}/${month}/${crypto.randomUUID()}.jpg`;

const { data, error } = await supabase.storage
  .from('receipts')
  .upload(filePath, compressedImage, {
    contentType: 'image/jpeg',
    upsert: false,
  });
```

### Storage Bucket RLS

```sql
-- Only the owner can access their receipt images
CREATE POLICY "Users access own receipts"
  ON storage.objects FOR ALL
  USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);
```

---

## Realtime Subscriptions

Use Supabase Realtime sparingly — only for features where instant updates matter (e.g., KA chat messages appearing in real time). For most features, page revalidation or polling is simpler.

```typescript
// Client Component: subscribe to new KA messages
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function ChatMessages({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel('ka-chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ka_conversations',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  return (/* render messages */);
}
```
