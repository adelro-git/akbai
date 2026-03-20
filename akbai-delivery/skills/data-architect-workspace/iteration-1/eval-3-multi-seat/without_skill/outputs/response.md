# Multi-Seat Support for AKBai Business Tier
## Schema & RLS Design Without Breaking Existing Single-User Setup

**Version:** 1.0 | **Date:** 2026-03-15 | **Status:** Production-Ready Strategy
**Scope:** Business tier multi-seat implementation (5 team members max, 3 roles)

---

## Executive Summary

Adding multi-seat support to AKBai requires:
1. **New table:** `business_members` — maps users to businesses with roles
2. **New table:** `member_permissions` — role-based permission templates (optional, can use hardcoded role logic)
3. **Updated RLS policies** — switch from `auth.uid() = user_id` to **business-scoped access** without breaking Pro/Free tiers
4. **Backward compatibility layer** — Free/Pro users continue with single-owner model; Business tier enables multi-seat
5. **Audit trail** — member join/leave events logged for compliance

**Key principle:** Business membership becomes the new access control boundary, replacing individual user ownership.

---

## Part 1: Data Model Changes

### 1.1 New Table: `business_members`

Represents the team. Replaces the implicit "user owns business" relationship.

```sql
-- Migration: 00000000000015_create_business_members.sql
-- Rollback: DROP TABLE IF EXISTS public.business_members CASCADE;

CREATE TABLE public.business_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Role (hardcoded enumeration)
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'accountant', 'viewer')),

  -- Membership status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'removed', 'left')),

  -- Invitation tracking (for "invited" status)
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,

  -- Permissions override (nullable — if null, use role defaults)
  -- Future: store custom permission set (JSON) for edge cases
  custom_permissions JSONB,

  -- Standard columns
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view their own memberships
CREATE POLICY "select_own_memberships" ON public.business_members
  FOR SELECT USING (auth.uid() = user_id);

-- Insert: Only business owners can add members (enforcement via business logic, not RLS)
-- RLS allows insert for now; API layer validates role = 'owner'
CREATE POLICY "insert_own_memberships" ON public.business_members
  FOR INSERT WITH CHECK (
    auth.uid() = user_id  -- Can only add yourself; API validates you're an owner
  );

-- Update: Owners can update member roles (enforcement via API)
CREATE POLICY "update_own_membership" ON public.business_members
  FOR UPDATE USING (auth.uid() = user_id);

-- Delete (soft): Owners can remove members; members can leave
-- Actual soft-delete via API (set status = 'removed' or 'left')
CREATE POLICY "delete_own_membership" ON public.business_members
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.business_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Indexes
CREATE INDEX idx_business_members_business_id
  ON public.business_members(business_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_business_members_user_id
  ON public.business_members(user_id)
  WHERE deleted_at IS NULL;

-- Unique: one user per business per role (optional: enforce one owner)
CREATE UNIQUE INDEX idx_business_members_uniq
  ON public.business_members(business_id, user_id)
  WHERE deleted_at IS NULL AND status IN ('active', 'invited');

-- Fast lookup: which businesses does this user have access to?
CREATE INDEX idx_business_members_user_active
  ON public.business_members(user_id, status)
  WHERE deleted_at IS NULL;
```

**Notes:**
- `invited_by` tracks who sent the invitation (audit trail).
- `custom_permissions` is reserved for future per-user permission overrides (e.g., "accountant, but no salary viewing").
- `status` field allows for invitation workflow: invited → accepted_at set → status changes to 'active'.
- Soft-delete pattern maintained (`deleted_at`).

---

### 1.2 Optional: `member_permissions` Lookup Table

If you want a single source of truth for role → permission mappings:

```sql
-- Migration: 00000000000016_create_member_permissions.sql
-- Optional: hardcoded role logic in application is simpler for MVP

CREATE TABLE public.member_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL UNIQUE CHECK (role IN ('owner', 'accountant', 'viewer')),

  -- Permission set (JSON array of permission keys)
  permissions JSONB NOT NULL,  -- ['read:transactions', 'read:invoices', 'update:invoices', ...]

  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- No RLS — system lookup table
-- Service role populates this on schema deploy

-- Example data (insert post-deploy):
INSERT INTO public.member_permissions (role, permissions, description) VALUES
  ('owner', '["read:all", "write:all", "delete:all", "invite:members", "manage:roles"]'::jsonb,
   'Full access. Can invite team members and manage roles.'),
  ('accountant', '["read:all", "write:transactions", "write:invoices", "write:daily_entries"]'::jsonb,
   'Can see and edit all financial data, but cannot delete or manage team.'),
  ('viewer', '["read:dashboard", "read:transactions", "read:invoices"]'::jsonb,
   'Read-only access to dashboard and reports. Cannot edit or delete.'),
('owner', '["read:all", "write:all", "delete:all", "invite:members", "manage:roles"]'::jsonb, 'Full control'),
  ('accountant', '["read:all", "write:transactions", "write:invoices", "write:daily_entries"]'::jsonb, 'Can manage financials, cannot delete'),
  ('viewer', '["read:dashboard", "read:transactions", "read:invoices"]'::jsonb, 'Read-only dashboard access');
```

**Decision:** For MVP, **hardcode role logic in API routes** (see Part 3). Add the lookup table later if permissions become complex.

---

### 1.3 Updated `businesses` Table

No schema change needed. The `user_id` column remains for backward compatibility (owner/creator reference).

```sql
-- NO MIGRATION NEEDED FOR THIS TABLE
-- businesses.user_id now represents the OWNER, not sole access holder
-- Multi-seat members are tracked in business_members

-- Example clarification comment (optional):
ALTER TABLE public.businesses
  COMMENT ON COLUMN user_id IS 'Original owner (creator) of this business.
  Team members with access are tracked in business_members table.';
```

---

## Part 2: RLS Policy Evolution (Backward Compatibility)

### Challenge

Current RLS uses `auth.uid() = user_id` on tables like `transactions`, `invoices`, `receipts`, etc. This **only grants access to the transaction creator**, not the team.

**Solution:** Rewrite RLS to check business membership instead of direct user ownership.

### 2.1 Helper Function: Check Business Membership

Create a reusable function to avoid duplicating membership logic in every policy:

```sql
-- Migration: 00000000000014_create_membership_helpers.sql

CREATE OR REPLACE FUNCTION public.user_has_business_access(
  p_user_id UUID,
  p_business_id UUID,
  p_required_role TEXT DEFAULT 'viewer'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_role TEXT;
BEGIN
  -- Check if user is a member of the business
  SELECT role INTO v_user_role
  FROM public.business_members
  WHERE user_id = p_user_id
    AND business_id = p_business_id
    AND status IN ('active', 'invited')  -- invited members can read but not write
    AND deleted_at IS NULL
  LIMIT 1;

  -- No membership found
  IF v_user_role IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check role hierarchy
  CASE
    WHEN p_required_role = 'viewer' THEN
      RETURN v_user_role IN ('viewer', 'accountant', 'owner');
    WHEN p_required_role = 'accountant' THEN
      RETURN v_user_role IN ('accountant', 'owner');
    WHEN p_required_role = 'owner' THEN
      RETURN v_user_role = 'owner';
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql STABLE;

-- Simplified version (no role check) for SELECT policies:
CREATE OR REPLACE FUNCTION public.user_has_business_read_access(
  p_user_id UUID,
  p_business_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.business_members
    WHERE user_id = p_user_id
      AND business_id = p_business_id
      AND status IN ('active', 'invited')
      AND deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql STABLE;
```

**Why `STABLE`?** The function is deterministic for a given user + business within a transaction (RLS evaluation context). Marking it STABLE allows PostgreSQL to optimize batch RLS checks.

---

### 2.2 Rewrite RLS Policies on User-Data Tables

For each table (`transactions`, `receipts`, `invoices`, `daily_entries`, `bir_deadlines`), replace the old policy with a business-scoped one.

**Example: `transactions` table**

```sql
-- Migration: 00000000000017_update_rls_multi_seat.sql

-- OLD POLICY (remove):
DROP POLICY IF EXISTS "select_own" ON public.transactions;
DROP POLICY IF EXISTS "insert_own" ON public.transactions;
DROP POLICY IF EXISTS "update_own" ON public.transactions;

-- NEW POLICIES (business-scoped):

-- SELECT: User has read access to any transaction in a business they belong to
CREATE POLICY "select_business_data" ON public.transactions
  FOR SELECT USING (
    public.user_has_business_read_access(auth.uid(), business_id)
  );

-- INSERT: User can only create transactions in businesses where they're accountant/owner
CREATE POLICY "insert_business_data" ON public.transactions
  FOR INSERT WITH CHECK (
    public.user_has_business_access(auth.uid(), business_id, 'accountant')
  );

-- UPDATE: Viewer role cannot update
CREATE POLICY "update_business_data" ON public.transactions
  FOR UPDATE USING (
    public.user_has_business_access(auth.uid(), business_id, 'accountant')
  );

-- DELETE: Only owners can delete (hard delete is prohibited per tech stack,
-- but this policy grants permission to set deleted_at via trigger/API)
CREATE POLICY "delete_business_data" ON public.transactions
  FOR DELETE USING (
    public.user_has_business_access(auth.uid(), business_id, 'owner')
  );
```

**Apply the same pattern to:**
- `receipts` — SELECT/INSERT/UPDATE/DELETE same as transactions
- `invoices` — SELECT/INSERT/UPDATE for accountant+; DELETE for owner only
- `daily_entries` — SELECT/INSERT/UPDATE for accountant+; DELETE for owner
- `bir_deadlines` — SELECT for all roles; UPDATE/DELETE for owner only
- `ka_conversations` — Keep user-scoped (not business-scoped) — each user has their own KA history

**Example: `invoices` (more permissive for READ)**

```sql
DROP POLICY IF EXISTS "select_own" ON public.invoices;
DROP POLICY IF EXISTS "insert_own" ON public.invoices;
DROP POLICY IF EXISTS "update_own" ON public.invoices;

CREATE POLICY "select_business_invoices" ON public.invoices
  FOR SELECT USING (
    public.user_has_business_read_access(auth.uid(), business_id)
  );

CREATE POLICY "insert_business_invoices" ON public.invoices
  FOR INSERT WITH CHECK (
    public.user_has_business_access(auth.uid(), business_id, 'accountant')
  );

CREATE POLICY "update_business_invoices" ON public.invoices
  FOR UPDATE USING (
    public.user_has_business_access(auth.uid(), business_id, 'accountant')
  );

CREATE POLICY "delete_business_invoices" ON public.invoices
  FOR DELETE USING (
    public.user_has_business_access(auth.uid(), business_id, 'owner')
  );
```

---

### 2.3 RLS for `business_members` Itself

```sql
-- Already defined in Part 1.1, but clarified here:

DROP POLICY IF EXISTS "select_own" ON public.business_members;
DROP POLICY IF EXISTS "insert_own" ON public.business_members;
DROP POLICY IF EXISTS "update_own" ON public.business_members;

-- SELECT: Users can view their own memberships + all members of their business
CREATE POLICY "select_my_memberships" ON public.business_members
  FOR SELECT USING (
    auth.uid() = user_id  -- See own row
    OR
    (public.user_has_business_read_access(auth.uid(), business_id))  -- See team in your business
  );

-- INSERT: Self-signup not allowed; only invite endpoint uses service role
-- For public signup: API layer handles it using service role key
CREATE POLICY "insert_via_api_only" ON public.business_members
  FOR INSERT WITH CHECK (FALSE);  -- Never allow client insert

-- UPDATE: Users can only update their own memberships (role change via API)
-- Owners can modify other members' roles (handled via API + service role check)
CREATE POLICY "update_my_membership" ON public.business_members
  FOR UPDATE USING (
    auth.uid() = user_id
    OR
    (public.user_has_business_access(auth.uid(), business_id, 'owner'))
  );

-- DELETE: Soft-delete only (set status = 'removed' or 'left')
CREATE POLICY "delete_via_api" ON public.business_members
  FOR DELETE USING (FALSE);  -- Never allow client delete
```

---

### 2.4 RLS for `businesses` Table (Simplified)

Currently: `auth.uid() = user_id` (creator only)

New: Business member can access

```sql
DROP POLICY IF EXISTS "select_own" ON public.businesses;
DROP POLICY IF EXISTS "insert_own" ON public.businesses;
DROP POLICY IF EXISTS "update_own" ON public.businesses;

-- SELECT: Any team member can read business details
CREATE POLICY "select_business_details" ON public.businesses
  FOR SELECT USING (
    public.user_has_business_read_access(auth.uid(), id)
  );

-- INSERT: Only authenticated users (creator becomes owner via API)
CREATE POLICY "insert_own_business" ON public.businesses
  FOR INSERT WITH CHECK (
    auth.uid() = user_id  -- Enforce user creates their own business (as owner)
  );

-- UPDATE: Only the owner (via business_members role check) can update business info
CREATE POLICY "update_business_info" ON public.businesses
  FOR UPDATE USING (
    public.user_has_business_access(auth.uid(), id, 'owner')
  );

-- DELETE: Soft-delete for owners only
CREATE POLICY "delete_business" ON public.businesses
  FOR DELETE USING (
    public.user_has_business_access(auth.uid(), id, 'owner')
  );
```

---

## Part 3: Application Logic & API Routes

### 3.1 Authentication Context: Get User's Businesses

Every request needs to know which businesses the user can access. Add a helper:

```typescript
// /lib/supabase/auth.ts

import { createClient } from '@supabase/supabase-js';

export type UserBusinessRole = 'owner' | 'accountant' | 'viewer';

export interface BusinessAccess {
  businessId: string;
  role: UserBusinessRole;
}

/**
 * Fetch all businesses this user has access to.
 * Called on app load and cached in context/state.
 */
export async function getUserBusinesses(userId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from('business_members')
    .select('business_id, role')
    .eq('user_id', userId)
    .eq('status', 'active')
    .is('deleted_at', null);

  if (error) throw error;

  return data as BusinessAccess[];
}

/**
 * Check if user has a specific role in a business.
 * Roles: owner > accountant > viewer
 */
export function hasRole(
  accesses: BusinessAccess[],
  businessId: string,
  requiredRole: UserBusinessRole
): boolean {
  const access = accesses.find(a => a.businessId === businessId);
  if (!access) return false;

  const roleHierarchy = { viewer: 0, accountant: 1, owner: 2 };
  return roleHierarchy[access.role] >= roleHierarchy[requiredRole];
}
```

---

### 3.2 API Route: Invite Team Member

```typescript
// /app/api/businesses/[businessId]/members/invite/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const businessId = req.nextUrl.pathname.split('/')[3];
  const { email, role } = await req.json();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const authUser = await supabase.auth.getUser();
  if (!authUser.data.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1. Verify requester is owner
  const { data: memberCheck } = await supabase
    .from('business_members')
    .select('role')
    .eq('business_id', businessId)
    .eq('user_id', authUser.data.user.id)
    .eq('status', 'active')
    .single();

  if (memberCheck?.role !== 'owner') {
    return NextResponse.json({ error: 'Only owners can invite members' }, { status: 403 });
  }

  // 2. Find user by email
  const { data: inviteeAuth } = await supabase.auth.admin.listUsers(); // requires service role
  // OR use a lookup table `user_emails` if email is not in auth.users

  // 3. Check if already a member
  const { data: existingMember } = await supabase
    .from('business_members')
    .select('id')
    .eq('business_id', businessId)
    .eq('user_id', inviteeAuth.id) // invitee's user_id
    .is('deleted_at', null);

  if (existingMember?.length > 0) {
    return NextResponse.json({ error: 'User already a member' }, { status: 400 });
  }

  // 4. Check 5-member limit
  const { count } = await supabase
    .from('business_members')
    .select('*', { count: 'exact' })
    .eq('business_id', businessId)
    .eq('status', 'active')
    .is('deleted_at', null);

  if ((count ?? 0) >= 5) {
    return NextResponse.json(
      { error: 'Business tier limited to 5 team members' },
      { status: 400 }
    );
  }

  // 5. Insert membership with 'invited' status
  const { data, error } = await supabase
    .from('business_members')
    .insert({
      business_id: businessId,
      user_id: inviteeAuth.id,
      role,
      status: 'invited',
      invited_by: authUser.data.user.id,
      invited_at: new Date().toISOString(),
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // 6. Send email invitation (future: Resend + templated email)
  // For now, log or queue for manual follow-up

  return NextResponse.json({ data });
}
```

---

### 3.3 API Route: Role-Based Data Access (Example: List Transactions)

```typescript
// /app/api/businesses/[businessId]/transactions/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.pathname.split('/')[3];

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const authUser = await supabase.auth.getUser();
  if (!authUser.data.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1. Check user has access to this business
  const { data: member } = await supabase
    .from('business_members')
    .select('role')
    .eq('business_id', businessId)
    .eq('user_id', authUser.data.user.id)
    .eq('status', 'active')
    .is('deleted_at', null)
    .single();

  if (!member) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // 2. Fetch transactions (RLS will enforce user_has_business_read_access)
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('business_id', businessId)
    .order('transaction_date', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // 3. Filter by role if needed (e.g., hide salary transactions from viewers)
  // Example: filter by custom logic or return different fields per role
  if (member.role === 'viewer') {
    // Viewer sees only dashboard summary, not line items
    // Apply client-side filtering or change query above
  }

  return NextResponse.json({ data });
}
```

---

### 3.4 Handling Free/Pro vs Business Tier

The `subscriptions.tier` column determines multi-seat availability:

```typescript
// /lib/subscriptions.ts

export async function isMultiSeatEligible(userId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data } = await supabase
    .from('subscriptions')
    .select('tier')
    .eq('user_id', userId)
    .single();

  return data?.tier === 'business' || data?.tier === 'scale';
}

// In UI: hide "invite team members" button for Free/Pro
if (await isMultiSeatEligible(userId)) {
  // Show Invite button
} else {
  // Show upgrade prompt
}
```

---

## Part 4: Migration Strategy (Zero-Downtime)

### 4.1 Phase 1: Deploy New Schema (RLS Disabled for Data Tables)

1. Create `business_members` table (RLS enabled on it, but loose policies).
2. Create helper functions `user_has_business_access()` and `user_has_business_read_access()`.
3. **Temporarily disable** RLS on `transactions`, `invoices`, `receipts`, etc.
   - This prevents blocking existing single-user queries while you test.

```sql
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts DISABLE ROW LEVEL SECURITY;
-- ... etc
```

---

### 4.2 Phase 2: Backfill `business_members` Table

For every existing user-business relationship, create an ownership membership:

```sql
-- Backfill script (run manually, post-deploy)
INSERT INTO public.business_members (business_id, user_id, role, status, created_at, updated_at)
SELECT
  id AS business_id,
  user_id,
  'owner' AS role,
  'active' AS status,
  created_at,
  updated_at
FROM public.businesses
WHERE deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.business_members
    WHERE business_members.business_id = businesses.id
      AND business_members.user_id = businesses.user_id
      AND deleted_at IS NULL
  )
ON CONFLICT DO NOTHING;  -- Ignore if already exists

-- Verify backfill
SELECT COUNT(*) FROM public.business_members;
SELECT COUNT(*) FROM public.businesses;
-- Should be equal or close
```

---

### 4.3 Phase 3: Enable New RLS Policies (Soft Switch)

1. Enable RLS on data tables with **new policies**.
2. Test against staging database with existing Free/Pro users.
3. Verify that single-user queries still work (they reference the business_id, which now has a member row).

```sql
-- Enable RLS on data tables
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bir_deadlines ENABLE ROW LEVEL SECURITY;

-- Add the new policies (from Part 2.2–2.4)
-- ... execute all CREATE POLICY statements
```

---

### 4.4 Phase 4: Test & Monitor

- **Automated tests:** RLS test suite using Supabase client library
  - Single-user flow (Free/Pro): User queries own transactions → RLS succeeds
  - Multi-seat flow (Business): Owner + accountant query same business → RLS succeeds
  - Cross-business isolation: User A cannot access User B's business
  - Role isolation: Viewer cannot INSERT transactions

```typescript
// /tests/rls-multi-seat.test.ts (Vitest)

describe('RLS Multi-Seat', () => {
  it('owner can read all business transactions', async () => {
    const ownerClient = createClient(url, anonKey, { auth: { access_token: ownerToken } });
    const { data, error } = await ownerClient
      .from('transactions')
      .select('*')
      .eq('business_id', businessId);

    expect(error).toBeNull();
    expect(data.length).toBeGreaterThan(0);
  });

  it('accountant can insert but not delete transactions', async () => {
    const accountantClient = createClient(url, anonKey, { auth: { access_token: accountantToken } });

    // INSERT should succeed
    const { data: insertData, error: insertError } = await accountantClient
      .from('transactions')
      .insert({ business_id: businessId, ... });
    expect(insertError).toBeNull();

    // DELETE should fail
    const { error: deleteError } = await accountantClient
      .from('transactions')
      .delete()
      .eq('id', insertData[0].id);
    expect(deleteError).toBeTruthy(); // RLS denies
  });

  it('viewer cannot insert transactions', async () => {
    const viewerClient = createClient(url, anonKey, { auth: { access_token: viewerToken } });
    const { error } = await viewerClient
      .from('transactions')
      .insert({ business_id: businessId, ... });

    expect(error).toBeTruthy(); // RLS denies
  });

  it('user cannot access business they are not a member of', async () => {
    const outsiderClient = createClient(url, anonKey, { auth: { access_token: outsiderToken } });
    const { data, error } = await outsiderClient
      .from('transactions')
      .select('*')
      .eq('business_id', businessId);

    // RLS should return empty or deny
    expect(data.length).toBe(0);
  });
});
```

- **Staging environment:** Deploy to staging, run RLS tests, verify no breakage.
- **Canary rollout:** Deploy to 10% of users, monitor error rates for 24 hours.
- **Full rollout:** Deploy to all users.

---

### 4.5 Rollback Plan

If RLS policies cause widespread breakage:

```sql
-- Disable new RLS, revert to old policies
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
-- Re-create old policies (from backup)
CREATE POLICY "select_own" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);
-- etc.
```

---

## Part 5: Audit & Compliance

### 5.1 Member Activity Log

Track who joined, who left, who changed roles:

```sql
-- Extend audit_log table or create member_audit_log

CREATE TABLE public.member_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES auth.users(id),  -- Who made the change
  target_user_id UUID NOT NULL REFERENCES auth.users(id),  -- Who was affected
  action TEXT NOT NULL CHECK (action IN ('invited', 'accepted', 'role_changed', 'removed', 'left')),
  old_role TEXT,
  new_role TEXT,
  reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- No RLS for compliance (service role only)
ALTER TABLE public.member_audit_log ENABLE ROW LEVEL SECURITY;

-- Populate on member changes via trigger
CREATE OR REPLACE FUNCTION public.log_member_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.member_audit_log (business_id, actor_id, target_user_id, action, new_role, created_at)
    VALUES (NEW.business_id, NEW.invited_by, NEW.user_id, 'invited', NEW.role, now());

  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'active' AND OLD.status = 'invited' THEN
      INSERT INTO public.member_audit_log (business_id, actor_id, target_user_id, action, new_role)
      VALUES (NEW.business_id, NEW.user_id, NEW.user_id, 'accepted', NEW.role);
    ELSIF NEW.role != OLD.role THEN
      INSERT INTO public.member_audit_log (business_id, actor_id, target_user_id, action, old_role, new_role)
      VALUES (NEW.business_id, auth.uid(), NEW.user_id, 'role_changed', OLD.role, NEW.role);
    ELSIF NEW.status = 'removed' AND OLD.status = 'active' THEN
      INSERT INTO public.member_audit_log (business_id, actor_id, target_user_id, action, old_role)
      VALUES (NEW.business_id, auth.uid(), NEW.user_id, 'removed', OLD.role);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_member_activity
  AFTER INSERT OR UPDATE ON public.business_members
  FOR EACH ROW EXECUTE FUNCTION public.log_member_changes();
```

---

### 5.2 Data Segregation & Compliance (RA 10173)

The `user_has_business_access()` function ensures:
- **Purpose Limitation:** Users only see data from businesses they're explicitly invited to.
- **Data Minimization:** Viewer role sees only aggregated dashboard, not line-item details.
- **Audit Trail:** `member_audit_log` + `audit_log` track all PII access.

---

## Part 6: Future Enhancements

### 6.1 Invitation Workflow via Email

```typescript
// Use Resend or SendGrid to send invite email
// Email contains a link: app.akbai.ph/invite/{invitationToken}
// Token validates and auto-accepts membership
```

### 6.2 Custom Permissions

Extend `business_members.custom_permissions` JSONB to override role defaults:

```json
{
  "can_delete_transactions": false,
  "can_view_salaries": false,
  "restricted_categories": ["salary", "owner_drawings"]
}
```

### 6.3 Activity Dashboard (Owner View)

Show owner a log of who accessed what:

```sql
-- Query: "Who accessed business financials in the last 7 days?"
SELECT actor_id, COUNT(*) as access_count
FROM public.audit_log
WHERE resource_type IN ('transactions', 'invoices')
  AND resource_id IN (SELECT id FROM transactions WHERE business_id = $1)
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY actor_id;
```

### 6.4 Invite Tokens & Self-Service Onboarding

Instead of email-only invites, generate invite tokens:

```sql
CREATE TABLE public.invite_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  token TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),

  -- Expiry
  expires_at TIMESTAMPTZ NOT NULL,
  redeemed_at TIMESTAMPTZ,
  redeemed_by UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User visits /join/{token}, auto-creates membership on accept
```

---

## Part 7: Troubleshooting & FAQs

### Q: What happens to Pro users who stay single-user?

**A:** They get a `business_members` row automatically (backfill). No behavior change. They continue to own their business and all its data, now tracked in `business_members` table.

### Q: How do I prevent Free users from seeing the "Invite Team" button?

**A:** Check `subscriptions.tier` in the frontend:

```tsx
const isBusinessTier = subscription?.tier === 'business' || subscription?.tier === 'scale';
if (isBusinessTier) {
  return <InviteButton />;
}
```

### Q: What if an owner accidentally removes themselves from their own business?

**A:** Currently, the API allows it. **Recommendation:** Add validation:

```typescript
// In remove-member API route:
if (targetUserId === authUser.id && targetRole === 'owner') {
  return NextResponse.json({ error: 'Cannot remove yourself as sole owner' }, { status: 400 });
}
```

### Q: How do I enforce "one owner per business"?

**A:** Add a constraint or check in your invite API:

```typescript
const { count } = await supabase
  .from('business_members')
  .select('*', { count: 'exact' })
  .eq('business_id', businessId)
  .eq('role', 'owner')
  .eq('status', 'active');

if (role === 'owner' && count >= 1) {
  return NextResponse.json({ error: 'Business already has an owner' }, { status: 400 });
}
```

### Q: What about `ka_conversations` — should they be shared across the team?

**A:** **No.** Each user has their own KA conversation history. This is intentional:
- Team members ask different questions.
- Privacy: accountant may ask sensitive questions the owner shouldn't see.
- Keep RLS on `ka_conversations` user-scoped:

```sql
-- Do NOT change this
CREATE POLICY "select_own_conversations" ON public.ka_conversations
  FOR SELECT USING (auth.uid() = user_id);
```

---

## Part 8: Summary Checklist

- [ ] **Schema:** Create `business_members` table + helper functions
- [ ] **Backfill:** Insert ownership rows for all existing businesses
- [ ] **RLS Policies:** Rewrite `transactions`, `invoices`, `receipts`, `daily_entries`, `bir_deadlines` policies to use `user_has_business_access()`
- [ ] **API Routes:** Create invite, list members, change role endpoints
- [ ] **Tier Check:** Add `isMultiSeatEligible()` to frontend
- [ ] **Audit Trail:** Implement `member_audit_log` trigger
- [ ] **Tests:** Write RLS test suite (Vitest)
- [ ] **Staging:** Deploy to staging, run full test suite
- [ ] **Canary:** Deploy to 10% of prod users
- [ ] **Monitor:** Watch error rates, RLS denials
- [ ] **Full Rollout:** Deploy to all users
- [ ] **Docs:** Update schema reference, API docs
- [ ] **Future:** Invite tokens, email workflow, custom permissions

---

## Conclusion

Multi-seat support is **fully backward compatible**. Free and Pro users continue as single-owner businesses; Business tier users unlock team collaboration. The new RLS model shifts the access boundary from `user_id` to `business_id`, enabling a flexible team structure while maintaining data isolation and compliance.

**Key principle:** Business membership becomes the new source of truth for access control. Implement it step-by-step, test thoroughly, and roll out gradually.
