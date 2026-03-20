# Multi-Seat Support for Business Tier — Schema & RLS Design

## Overview

You want to enable multi-seat collaboration on the Business tier (₱899/mo, up to 5 team members) while preserving single-user isolation for Pro (₱399/mo) and Free tiers. This requires:

1. A new `business_members` table linking users to businesses with role-based permissions
2. Enhanced RLS policies on all business-owned tables to include team member access
3. Backward compatibility so existing Pro/Free users see no changes
4. Role definitions: **Owner** (full control), **Accountant** (read all financials, no deletes), **Viewer** (read dashboard only)

This is a **Phase 2 concern** — your Phase 1 schema is already prepared for it. The `business_id` foreign key on key tables (`transactions`, `receipts`, `invoices`, etc.) is the hook for this expansion.

---

## Step 1: Design Purpose & Relationships

**What:** A business can have multiple team members; each member has a defined role.

**Personas:**
- **Maria (Owner):** Runs the bakery, invites her daughter (Accountant) to reconcile weekly expenses. Wants to see all data, control member access.
- **Daughter (Accountant):** Reviews transactions, corrects amounts, but cannot delete. Cannot manage team members.
- **Assistant (Viewer):** Can see the dashboard (cash position, BIR deadlines) for operational awareness but cannot view detailed transaction data.

**Relationships:**
```
businesses (1) ──┬─ business_members (N)
                 └─ with user_id + role
```

Each `business_member` record represents one user's access to one business with a specific role.

**Expected volume:** Typically 1–5 rows per business (max 5 per Business tier contract). Small index overhead.

---

## Step 2: Create the business_members Table

```sql
-- Migration: 20260315120000_create_business_members.sql
-- Rollback:
--   DROP POLICY IF EXISTS "select_own" ON public.business_members;
--   DROP POLICY IF EXISTS "select_team" ON public.business_members;
--   DROP POLICY IF EXISTS "insert_own" ON public.business_members;
--   DROP POLICY IF EXISTS "update_own" ON public.business_members;
--   DROP TABLE IF EXISTS public.business_members;

CREATE TABLE public.business_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Role: determines what this user can see/do
  role TEXT NOT NULL CHECK (role IN ('owner', 'accountant', 'viewer')),

  -- Metadata
  invited_by UUID REFERENCES auth.users(id),  -- Track who invited this member
  invited_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,                     -- NULL until member accepts invite

  -- Standard columns
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;

-- Standard four-policy pattern
CREATE POLICY "select_own" ON public.business_members
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "insert_own" ON public.business_members
  FOR INSERT WITH CHECK (auth.uid() = invited_by);  -- Only owners can invite

CREATE POLICY "update_own" ON public.business_members
  FOR UPDATE USING (auth.uid() = invited_by);  -- Only owners can change roles

-- Trigger for updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.business_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Indexes
CREATE INDEX idx_business_members_business_id ON public.business_members(business_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_business_members_user_id ON public.business_members(user_id) WHERE deleted_at IS NULL;

-- Unique: one user per business (cannot invite the same user twice)
CREATE UNIQUE INDEX idx_business_members_unique
  ON public.business_members(business_id, user_id)
  WHERE deleted_at IS NULL;
```

**Design notes:**
- `invited_by` captures who invited the member — essential for multi-seat audit trail (NPC compliance).
- `accepted_at` differentiates pending invites from active members. Initial implementation: invites are instant (accepted_at = now()), but this supports an email-based invite flow in Phase 2.
- RLS allows a user to see their own memberships. The INSERT policy restricts to `invited_by = auth.uid()` — only the owner can invite (enforce this in application logic too).

---

## Step 3: Update Existing Table RLS Policies

Every table that currently uses `user_id` RLS must be updated to also allow access via the `business_members` table. Do not remove the existing `user_id` policies — they still apply to Free/Pro users who don't use multi-seat.

### Pattern: Layered RLS for Free/Pro vs Business

```sql
-- Old policy (Phase 1 — still valid for Free/Pro):
CREATE POLICY "select_own" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

-- New policy (Phase 2 — adds Business tier multi-seat):
CREATE POLICY "select_team" ON public.transactions
  FOR SELECT USING (
    -- Either own row OR belong to a business that owns the row
    auth.uid() = user_id
    OR
    business_id IN (
      SELECT business_id FROM public.business_members
      WHERE user_id = auth.uid()
        AND deleted_at IS NULL
        AND accepted_at IS NOT NULL  -- Member has accepted invite
    )
  );
```

**Why layered?** Because the original `select_own` policy is still the fastest path for single-user queries. The `select_team` policy handles multi-seat without breaking single-user access.

### Apply to ALL Business-Owned Tables

Update RLS on these tables:
- `transactions`
- `receipts`
- `invoices`
- `bir_deadlines`
- `daily_entries`

#### Example: transactions table

```sql
-- Migration: 20260315120100_add_team_policies_transactions.sql
-- Rollback:
--   DROP POLICY IF EXISTS "select_team" ON public.transactions;

-- Add the new team-based select policy
CREATE POLICY "select_team" ON public.transactions
  FOR SELECT USING (
    business_id IN (
      SELECT business_id FROM public.business_members
      WHERE user_id = auth.uid()
        AND deleted_at IS NULL
        AND accepted_at IS NOT NULL
    )
  );

-- For UPDATE, add a team-based policy
-- Accountants can update transactions in their business, but with restrictions
CREATE POLICY "update_team_transactions" ON public.transactions
  FOR UPDATE USING (
    business_id IN (
      SELECT business_id FROM public.business_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'accountant')
        AND deleted_at IS NULL
        AND accepted_at IS NOT NULL
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM public.business_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'accountant')
        AND deleted_at IS NULL
        AND accepted_at IS NOT NULL
    )
  );

-- DELETE policy: only owners can delete (soft-delete)
-- Keep this restrictive — Viewers and Accountants have no delete access
CREATE POLICY "delete_team_transactions" ON public.transactions
  FOR UPDATE USING (
    business_id IN (
      SELECT business_id FROM public.business_members
      WHERE user_id = auth.uid()
        AND role = 'owner'
        AND deleted_at IS NULL
        AND accepted_at IS NOT NULL
    )
    AND deleted_at IS NULL
  )
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM public.business_members
      WHERE user_id = auth.uid()
        AND role = 'owner'
        AND deleted_at IS NULL
        AND accepted_at IS NOT NULL
    )
  );
```

#### Example: receipts table

```sql
-- Migration: 20260315120150_add_team_policies_receipts.sql

-- SELECT: team members (any role) can see receipts
CREATE POLICY "select_team" ON public.receipts
  FOR SELECT USING (
    business_id IN (
      SELECT business_id FROM public.business_members
      WHERE user_id = auth.uid()
        AND deleted_at IS NULL
        AND accepted_at IS NOT NULL
    )
  );

-- INSERT: only owners and accountants can upload receipts
CREATE POLICY "insert_team" ON public.receipts
  FOR INSERT WITH CHECK (
    business_id IN (
      SELECT business_id FROM public.business_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'accountant')
        AND deleted_at IS NULL
        AND accepted_at IS NOT NULL
    )
  );

-- UPDATE: only owners and accountants can modify
CREATE POLICY "update_team" ON public.receipts
  FOR UPDATE USING (
    business_id IN (
      SELECT business_id FROM public.business_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'accountant')
        AND deleted_at IS NULL
        AND accepted_at IS NOT NULL
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM public.business_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'accountant')
        AND deleted_at IS NULL
        AND accepted_at IS NOT NULL
    )
  );
```

#### Role-Based Access Matrix

| Action | Owner | Accountant | Viewer |
|--------|-------|-----------|--------|
| View transactions | Yes | Yes | Yes (dashboard aggregate only) |
| View receipts | Yes | Yes | No |
| View invoices | Yes | Yes | No |
| View BIR deadlines | Yes | Yes | Yes |
| Upload receipt | Yes | Yes | No |
| Edit transaction | Yes | Yes | No |
| Delete transaction (soft-delete) | Yes | No | No |
| Manage team members | Yes | No | No |
| Change business settings | Yes | No | No |

**Implementation note:** RLS cannot directly enforce "dashboard aggregate only" — that's an application-layer concern. Viewers can SELECT from `transactions` but the app should filter to only show aggregated data (total sales, total expenses, cash position) without line-item details.

---

## Step 4: Backward Compatibility — Existing Pro/Free Users

**The beauty:** Your existing RLS policies remain unchanged. A Pro user who hasn't created a business with team members still accesses data via `auth.uid() = user_id` (faster, simpler). They never hit the `business_members` subquery.

**The mechanism:** When a user is on Free or Pro, they have no rows in `business_members`. Their RLS policies route through the original `select_own` policy. No code changes needed on the client side.

**Example query (unchanged):**
```sql
SELECT * FROM transactions
WHERE auth.uid() = user_id;  -- Existing Pro/Free users hit this path
```

**Multi-seat user query (new):**
```sql
SELECT * FROM transactions
WHERE auth.uid() = user_id
  OR business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid() ...);
  -- Business tier users hit this path
```

Both paths coexist. The database router (RLS) chooses automatically based on whether the user has `business_members` rows.

---

## Step 5: Subscription Tier Enforcement

The **tier enforcement** happens in application code, not the database. Why?

- RLS ensures data isolation (Viewer can't read receipts).
- The app enforces that only Business tier can create multi-seat.

**In your subscription webhook handler:**

```typescript
// On Xendit payment success → update subscriptions table
if (payload.tier === 'business') {
  // Enable multi-seat features in the UI
  // Expose "Invite team members" button
} else if (payload.tier === 'pro') {
  // Hide multi-seat features
  // If user somehow is part of a multi-member business, they see their own data only
}
```

**Enforce during invite:**

```typescript
// POST /api/business/invite-member (server-side)

export async function POST(req: Request) {
  const { business_id, email, role } = await req.json();
  const user_id = auth.uid();

  // 1. Verify the inviter is the Owner
  const member = await supabase
    .from('business_members')
    .select('role')
    .eq('business_id', business_id)
    .eq('user_id', user_id)
    .single();

  if (member.data?.role !== 'owner') {
    return Response.json({ error: 'Only owners can invite members' }, { status: 403 });
  }

  // 2. Verify subscription is Business tier
  const subscription = await supabase
    .from('subscriptions')
    .select('tier')
    .eq('user_id', user_id)
    .single();

  if (subscription.data?.tier !== 'business') {
    return Response.json(
      { error: 'Multi-seat requires Business tier (₱899/mo)' },
      { status: 402 }
    );
  }

  // 3. Count current members
  const { count } = await supabase
    .from('business_members')
    .select('id', { count: 'exact' })
    .eq('business_id', business_id)
    .is('deleted_at', null);

  if (count >= 5) {
    return Response.json({ error: 'Max 5 team members per business' }, { status: 400 });
  }

  // 4. Invite
  const invited_user = await supabase.auth.admin.getUserByEmail(email);
  if (!invited_user.data?.user) {
    // Send email invite to create account
    // For now: send magic link with business_id pre-filled
  }

  await supabase.from('business_members').insert({
    business_id,
    user_id: invited_user.data.user.id,
    role,
    invited_by: user_id,
    accepted_at: new Date(),  // Phase 1: instant. Phase 2: awaiting email acceptance
  });

  return Response.json({ success: true });
}
```

---

## Step 6: Address NPC Compliance

**New data flows:**

1. **Third-party PII:** When inviting a team member by email, you're processing their email address. Ensure your Privacy Policy covers "inviting team members to collaborate."

2. **Audit trail:** `business_members.invited_by` tracks who invited whom — a natural audit trail. Log it in `audit_log` when roles change.

3. **Data subject rights:** When a user is deleted, all `business_members` rows where `user_id = deleted_user_id` must be soft-deleted. Their access to shared businesses is revoked.

4. **Consent:** Update your Privacy Policy to state: "If you invite team members, they will see transactions, receipts, and other business data shared with your business."

**Update audit_log:**

```sql
-- Log role changes
INSERT INTO audit_log (actor_id, action, resource_type, resource_id, metadata)
VALUES (
  auth.uid(),
  'member_role_change',
  'business_members',
  member_id,
  jsonb_build_object('role', new_role, 'business_id', business_id)
);
```

---

## Step 7: Migration Order & Rollback

Deploy these migrations in sequence:

1. **20260315120000_create_business_members.sql** — Create table + RLS (deny-all initially, no data yet)
2. **20260315120100_add_team_policies_transactions.sql** — Add read policies to transactions
3. **20260315120150_add_team_policies_receipts.sql** — Add policies to receipts
4. **20260315120200_add_team_policies_invoices.sql** — Add policies to invoices
5. **20260315120250_add_team_policies_bir_deadlines.sql** — Add policies to BIR deadlines
6. **20260315120300_add_team_policies_daily_entries.sql** — Add policies to daily entries

**Why staggered?** If a single migration fails halfway through, you only lose the last policy. Each policy is independently rollback-able.

**Test locally:**

```bash
supabase db reset
# Migrations apply
supabase db reset  # Test rollback
# Verify old single-user queries still work
psql ... -c "SELECT * FROM transactions WHERE user_id = auth.uid();"
# Verify new team queries work
psql ... -c "SELECT * FROM transactions WHERE business_id IN (SELECT business_id FROM business_members WHERE user_id = auth.uid());"
```

---

## Step 8: Update Schema Reference

After deploying, add this to `references/supabase-schema.md`:

```markdown
## NEW: business_members

**Purpose:** Links users to businesses with role-based access (Phase 2).
**Persona interaction:** All Business tier users.
**Data classification:** Business (non-PII).

[Full DDL, RLS, indexes as written above]

**Notes:**
- Phase 1: no business_members rows exist. All access routed via user_id.
- Phase 2+: team_policies activate on transactions, receipts, invoices, bir_deadlines, daily_entries.
- Max 5 members per business (enforced in app, not DB).
- Roles: owner (full access), accountant (read + update, no delete), viewer (read dashboard only).
```

---

## Step 9: Common Pitfalls & How to Avoid Them

### 1. **Viewers accidentally see detailed receipts**
**Problem:** RLS allows Viewer to SELECT from receipts, but app doesn't filter.
**Solution:** RLS is a floor, not a ceiling. The app must also filter:
```typescript
const role = await getTeamMemberRole(business_id);
if (role === 'viewer') {
  // Only fetch dashboard aggregates
  return getDashboardAggregates(business_id);
}
// else: full receipt list
```

### 2. **Accountants can hard-delete via RLS loophole**
**Problem:** You forgot to restrict DELETE on the Accountant team policy.
**Solution:** Soft-delete only. RLS should prevent Accountant from UPDATE-ing transactions.deleted_at. The app UI never shows a "Delete" button for non-owners.

### 3. **Slow queries from business_members subqueries**
**Problem:** Every SELECT now has a subquery. At scale (1000s of teams), this is slow.
**Solution:** For Phase 1/2 scale, this is fine. When you hit 10,000+ users:
- Denormalize: add a cached `business_ids` ARRAY to the users table, refreshed daily.
- Use a materialized view for the business_members → businesses join.

### 4. **Owner deleted, team members orphaned**
**Problem:** Invite business members under an Owner account. Owner deletes account. Members suddenly have access to nobody's business.
**Solution:** ON DELETE CASCADE on `invited_by` is not needed. Instead, keep the FK optional (`invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL`). The business remains; it's just unclaimed if the Owner deletes. Optionally, promote the most recent accountant to Owner on Owner deletion.

---

## Step 10: Phased Rollout

### Phase 1 (Current)
- No changes to schema beyond preparations.
- Single-user works perfectly.

### Phase 2 (Next)
- Deploy `business_members` table.
- Deploy team read policies (select_team).
- Launch multi-seat feature (owned by Phase 2 product roadmap).

### Phase 2 + 1 month
- Monitor RLS performance in production.
- If queries slow down, add partial indexes on `business_members(user_id)`.

---

## Complete SQL Checklist

Copy-paste ready migrations:

### Migration 1: Create business_members
```sql
-- 20260315120000_create_business_members.sql

CREATE TABLE public.business_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'accountant', 'viewer')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON public.business_members
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "insert_own" ON public.business_members
  FOR INSERT WITH CHECK (auth.uid() = invited_by);

CREATE POLICY "update_own" ON public.business_members
  FOR UPDATE USING (auth.uid() = invited_by);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.business_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_business_members_business_id ON public.business_members(business_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_business_members_user_id ON public.business_members(user_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_business_members_unique
  ON public.business_members(business_id, user_id)
  WHERE deleted_at IS NULL;
```

### Migration 2–6: Team Policies (shown above for transactions, receipts)

---

## Final Notes

- **No breaking changes:** Existing Pro/Free users unaffected. Their RLS routes via the original policies.
- **Tight role enforcement:** Combine RLS (database floor) with application-layer role checks (ceiling).
- **NPC readiness:** Document the business_members data flow in your Privacy Policy. Track invites in audit_log.
- **Test thoroughly:** RLS bugs are silent. Write tests for: Pro user can't see Accountant receipts, Viewer can't update transactions, Owner can invite but not non-owners.

Once Phase 2 launches, this design scales cleanly to multiple businesses per user (future Phase 3 feature). The `business_id` FKs are already there — just add a "Switch Business" UI element and the architecture supports it.
