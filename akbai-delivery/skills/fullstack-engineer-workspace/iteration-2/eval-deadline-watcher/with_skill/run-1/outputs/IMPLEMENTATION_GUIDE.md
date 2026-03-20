# BIR Deadline Watcher — Implementation Guide

**Feature:** BIR Deadline Watcher (Build 6)
**Status:** Production-ready scaffold
**Created:** March 15, 2026
**Scaffolding Order:** Types → Database → API → Page → Components

---

## Overview

The BIR Deadline Watcher is a mobile-first feature that helps Filipino MSMEs track tax filing deadlines for BIR forms (1701Q, 2550M, 2551Q, 1702, etc.). The feature displays upcoming deadlines with color-coded urgency indicators:

- **Green:** >7 days remaining (on track)
- **Amber:** 3–7 days remaining (due soon)
- **Red:** ≤3 days remaining (critical) or overdue

---

## File Structure & Placement

```
/app/(app)/(features)/deadlines/
  ├── page.tsx              # Server page: fetches and displays deadlines
  ├── loading.tsx           # Loading skeleton UI
  ├── error.tsx             # Error boundary component
  └── components/           # (create this folder)
      └── deadline-card.tsx # Reusable deadline card component

/app/api/deadlines/
  └── route.ts             # GET endpoint to fetch user's deadlines

/lib/utils/zod-schemas/
  └── deadline-types.ts    # Shared Zod schemas and types

/supabase/migrations/
  └── 002_add_bir_deadlines.sql  # Database schema migration
```

---

## Installation Checklist

### Step 1: Add Zod Schemas
1. Create `/lib/utils/zod-schemas/deadline-types.ts`
2. Copy contents from `deadline-types.ts` in outputs
3. Verify imports resolve: `z` from `zod`

### Step 2: Create Database Migration
1. Create `/supabase/migrations/002_add_bir_deadlines.sql`
2. Copy SQL migration from `002_add_bir_deadlines.sql`
3. Run migration: `supabase db push`
4. Regenerate types: `supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/types.ts`
5. Verify `bir_deadlines` table appears in `lib/supabase/types.ts`

### Step 3: Create API Route
1. Create folder `/app/api/deadlines/`
2. Create `/app/api/deadlines/route.ts`
3. Copy contents from `route.ts` in outputs
4. Verify imports:
   - `@/lib/supabase/server`
   - `@/lib/utils/api-response`
   - `@/lib/utils/zod-schemas/deadline-types`

### Step 4: Create Components
1. Create `/components/features/deadlines/` folder
2. Copy `deadline-card.tsx` to `/components/features/deadlines/deadline-card.tsx`
3. Verify it imports `@/lib/utils/zod-schemas/deadline-types`

### Step 5: Create Feature Page
1. Create `/app/(app)/(features)/deadlines/` folder
2. Copy `page.tsx`, `loading.tsx`, `error.tsx` to this folder
3. Verify imports resolve for:
   - `@/lib/supabase/server`
   - `@/lib/utils/api-response`
   - `@/components/features/deadlines/deadline-card`
   - `@/components/ui/empty-state`

### Step 6: Update Navigation (Optional)
1. Add deadlines link to bottom nav or feature menu
2. Example path: `/app/(app)/(features)/deadlines`

---

## Key Design Decisions

### 1. **Server Component Page**
`page.tsx` is a Server Component (no `'use client'`). It:
- Fetches deadlines directly from Supabase on the server
- Uses RLS policies to filter user-owned data
- Passes immutable data to the client component `DeadlineCard`
- Reduces client-side bundle size (important for Philippine LTE)

### 2. **Client Component Card**
`deadline-card.tsx` is a Client Component (`'use client'`) because:
- It computes days remaining dynamically based on the current date
- It must run on the browser to reflect real-time countdown
- It handles color state changes (green → amber → red as deadline approaches)

### 3. **Color State Mapping**
Days remaining determines urgency:
- **Green:** >7 days → `text-teal-light`, `bg-teal-light/20`
- **Amber:** 3–7 days → `text-yellow-400`, `bg-yellow-400/20`
- **Red:** ≤3 days or overdue → `text-red-400`, `bg-red-500/20`

Colors match AKBai brand palette and are immediately recognizable on dark backgrounds.

### 4. **RLS Security**
Every deadline query includes:
- `WHERE deleted_at IS NULL` (soft delete compliance)
- `eq('user_id', user.id)` (application-level defense in depth)
- RLS policies on the table enforce `auth.uid() = user_id`

A user cannot see another user's deadlines, even if they bypass the app.

### 5. **Soft Delete Pattern**
Deadlines are never hard-deleted:
- Old/archived deadlines: set `deleted_at = NOW()`
- Recovery: possible via admin dashboard (future)
- Compliance: satisfies NPC audit trail requirements

### 6. **Timezone Handling**
- **Storage:** All `due_date` values are ISO 8601 dates (YYYY-MM-DD) in UTC
- **Display:** Converted to Asia/Manila timezone in the UI
- **Critical:** BIR filing deadlines are date-critical; timezone bugs = compliance failures

### 7. **Mobile-First Layout**
- Base design for 375px width
- Responsive grid: `gap-3 p-4` (spacing scales with screen)
- Touch targets: all interactive elements are `min-h-[44px]`
- No hover-dependent interactions (tap/focus only)

---

## Data Flow

### Fetch Deadlines

```
User visits /app/deadlines
  ↓
NextAuth middleware checks session → redirects if not authenticated
  ↓
page.tsx (Server Component)
  ├─ createClient() → Supabase server client
  ├─ getUser() → Extract user.id
  ├─ .from('bir_deadlines')
  │  .select(...)
  │  .eq('user_id', user.id)
  │  .is('deleted_at', null)
  │  .order('due_date', ascending)
  ↓
Returns Deadline[] (immutable)
  ↓
Renders page with deadlines organized by urgency
  ├─ Overdue section
  ├─ Critical section (3 days or less)
  ├─ Due soon section (3–7 days)
  └─ On track section (>7 days)
  ↓
Each deadline → DeadlineCard component
  └─ Computes days remaining
  └─ Applies urgency color
  └─ Renders form type, due date, days badge, filed status
```

### API Endpoint (Alternative to Server Query)

The `/api/deadlines` GET route is available for client-side fetching (not used by default, but available for future features like:
- Frontend polling
- Realtime updates via Supabase subscriptions
- Mobile app requests

```
GET /api/deadlines
  → Auth check (user session)
  → Query Supabase (RLS filters applied)
  → Validate response with Zod
  → Return { success: true, data: Deadline[] }
```

---

## Component API

### DeadlineCard

**Props:**
```typescript
interface DeadlineCardProps {
  deadline: Deadline; // From Supabase bir_deadlines table
}
```

**Behavior:**
- Receives an immutable `Deadline` object
- Computes `daysRemaining` on the client (reflects real-time)
- Applies color state based on days remaining
- Displays form type (e.g., "BIR 1701Q")
- Shows due date in human-readable format (e.g., "March 15, 2026")
- Shows days remaining in large badge (e.g., "7 days")
- Shows filed/unfiled status badge
- Shows filed timestamp if `filed_at` is not null

**Colors:**
| Days Remaining | Urgency | Colors |
|---|---|---|
| >7 | On track | Teal accent, teal badge |
| 3–7 | Due soon | Amber accent, amber badge |
| ≤3 | Critical | Red accent, red badge |
| Overdue | Critical | Red accent, red badge |

---

## Testing Strategy

### Manual Testing (QA)

1. **Auth Flow**
   - Load `/app/deadlines` unauthenticated → redirect to `/login`
   - Login → page loads

2. **Empty State**
   - New user with no deadlines → "Wala pang BIR deadlines..." message
   - Verify text is Taglish and encouraging

3. **Deadline Display**
   - Add 5 test deadlines (use Supabase dashboard):
     - One overdue (due_date = 2 days ago)
     - One critical (due_date = 2 days from today)
     - One due soon (due_date = 5 days from today)
     - One on track (due_date = 14 days from today)
     - One already filed (filed = true, filed_at = recent timestamp)
   - Verify each deadline appears in correct section
   - Verify colors: red for overdue/critical, amber for due soon, teal for on track
   - Verify filed badge shows "✓ Filed" in teal (not "Unfiled")

4. **Day Countdown**
   - Create deadline due in 7 days
   - Verify badge shows "7" and color is amber
   - Wait 1 day → refresh page → badge shows "6" (still amber)
   - Verify countdown is real-time (not hardcoded)

5. **Loading State**
   - Slow network (DevTools throttle) → verify `loading.tsx` skeleton appears
   - Verify skeleton approximates final card layout

6. **Error State**
   - Supabase down (stop service) → load page → `error.tsx` shows error message
   - Verify error message is Taglish: "May problema sa pag-load"
   - Verify "Subukan Ulit" button retries the page

7. **RLS Security**
   - Insert deadline for user A
   - Login as user B → verify deadline doesn't appear
   - Verify RLS policy is enforced at database level

### Automated Testing (Future)

```typescript
// Example Vitest unit test for DeadlineCard
import { render, screen } from '@testing-library/react';
import { DeadlineCard } from '@/components/features/deadlines/deadline-card';

describe('DeadlineCard', () => {
  it('renders form type and due date', () => {
    const deadline = {
      id: 'test-1',
      user_id: 'user-1',
      form_type: '1701Q',
      due_date: '2026-03-22',
      filed: false,
      filed_at: null,
      // ... other fields
    };
    render(<DeadlineCard deadline={deadline} />);
    expect(screen.getByText('BIR 1701Q')).toBeInTheDocument();
    expect(screen.getByText('March 22, 2026')).toBeInTheDocument();
  });

  it('shows red urgency for ≤3 days remaining', () => {
    // Due in 2 days
    const deadline = {
      // ...
      due_date: '2026-03-17',
    };
    render(<DeadlineCard deadline={deadline} />);
    // Verify red color applied to badge
    expect(screen.getByText('Critical — file now')).toBeInTheDocument();
  });

  it('shows amber urgency for 3-7 days remaining', () => {
    // Due in 5 days
    const deadline = {
      // ...
      due_date: '2026-03-20',
    };
    render(<DeadlineCard deadline={deadline} />);
    expect(screen.getByText('Due soon')).toBeInTheDocument();
  });
});
```

---

## Future Enhancements (Phase 2+)

1. **Edit Deadline**
   - Add PUT/PATCH handler to mark deadline as `filed: true`
   - Button in DeadlineCard: "Mark as Filed"
   - Show confirmation: "Marked BIR 1701Q as filed ✓"

2. **Add Deadline**
   - Modal form with date picker
   - Field: form_type (dropdown or text)
   - Field: due_date
   - POST to /api/deadlines or Supabase directly

3. **Notifications**
   - Leverage `notification_sent_7d`, `notification_sent_3d`, `notification_sent_1d` columns
   - Cron job: daily check for deadlines approaching
   - Send push notification via KA chat: "Heads up! BIR 1701Q due in 7 days"

4. **Calendar Integration**
   - Embed deadline events into KA morning briefing
   - "Today's Focus: BIR 2550M due in 2 days"

5. **Multi-Form Support**
   - BIR form reference: link to form details
   - What does 1701Q cover? When is it due? (hardcoded or fetched from CMS)

6. **Business Tier Multi-Seat (Phase 2)**
   - Add `business_id` column to `bir_deadlines` table
   - Update RLS to allow team members to view shared deadlines
   - Assign deadline responsibility to team member

---

## Known Limitations & Gaps

### Limitation 1: Static Deadline List
- Deadlines must be manually added via Supabase dashboard or admin API
- No automated BIR calendar import yet
- Future: Create admin tool to bulk-import BIR calendar

### Limitation 2: No Notifications
- App doesn't send proactive KA alerts when deadlines approach
- `notification_sent_*` columns exist but unused
- Future: Implement with cron job + Supabase Edge Functions

### Limitation 3: No Calendar View
- Deadlines shown in list format only
- No month/week calendar visualization
- Future: Add calendar component (next quarter)

### Limitation 4: Timezone Display Only
- All dates shown in Asia/Manila
- No option for user to change timezone
- Fine for Phase 1 (all users are PH-based); revisit if global expansion planned

---

## Deployment Checklist

- [ ] Migration file created and reviewed
- [ ] `supabase db push` executed successfully
- [ ] `supabase gen types...` regenerated types
- [ ] Zod schemas in `/lib/utils/zod-schemas/deadline-types.ts`
- [ ] API route at `/app/api/deadlines/route.ts`
- [ ] Component at `/components/features/deadlines/deadline-card.tsx`
- [ ] Page, loading, error at `/app/(app)/(features)/deadlines/`
- [ ] Test deadlines added to database
- [ ] Manual QA testing completed (auth, empty state, colors, loading, errors)
- [ ] Navigation updated (if applicable)
- [ ] Code reviewed by second engineer (Anton or team)
- [ ] Deployed to staging
- [ ] Deployed to production

---

## Support & Debugging

### Page loads but no deadlines appear
1. Check Supabase dashboard → `bir_deadlines` table
2. Verify deadlines exist for logged-in user
3. Check `deleted_at` is NULL (soft delete filtering)
4. Check browser console for API errors

### Wrong colors displaying
1. Verify deadline `due_date` is ISO 8601 format (YYYY-MM-DD)
2. Check if system clock is accurate (affects countdown)
3. Verify Tailwind color tokens are defined in `tailwind.config.ts`

### Error boundary showing
1. Check browser console for error details
2. Check server logs: `supabase logs`
3. Verify Supabase is healthy: https://status.supabase.com

### RLS blocking access
1. Verify user is authenticated (check Supabase Auth dashboard)
2. Verify user.id matches `user_id` in deadline row
3. Check RLS policy: `ALTER TABLE bir_deadlines ENABLE ROW LEVEL SECURITY`
4. Test with admin client: `supabase admin` CLI

---

## Summary

This scaffold provides a complete, production-ready BIR Deadline Watcher feature. It follows AKBai's conventions for types, database patterns, API design, and mobile-first UI. All files include comprehensive section headers for QA, PM, and future developers. The feature is ready for immediate deployment after running the migration and adding test data.

**Next step after deployment:** Build admin tool to bulk-import BIR calendar for upcoming year.
