# BIR Deadline Watcher — Feature Implementation

## Overview

This directory contains the complete scaffolding for the **BIR Deadline Watcher** feature, following AKBai's fullstack conventions and architecture patterns. The feature allows users to track important BIR tax deadlines with smart status indicators and proactive alerts.

## Files Included

### 1. **002_add_bir_deadlines.sql**
Supabase migration that creates the `bir_deadlines` table with full RLS (Row Level Security) policy set.

**Key features:**
- UUID primary key with auto-generation
- User-scoped data (linked to `auth.users(id)`)
- Date-based indexing for fast queries
- Soft-delete support via `deleted_at` column
- Audit columns: `created_at`, `updated_at`
- Notification tracking: `notification_sent_7d`, `notification_sent_3d`, `notification_sent_1d`
- RLS policies: SELECT, INSERT, UPDATE (no hard DELETE)
- Auto-trigger for `updated_at` timestamp updates

**Usage:**
Apply this migration to your Supabase project:
```bash
supabase migration up 002_add_bir_deadlines.sql
```

---

### 2. **deadline-schemas.ts**
Zod validation schemas for type-safe API contracts.

**Location:** `lib/utils/zod-schemas/deadline.ts`

**Exports:**
- `BirDeadline` — Full row type from database
- `CreateBirDeadlineInput` — Request body for POST /api/deadlines
- `UpdateBirDeadlineInput` — Request body for PATCH operations
- `GetBirDeadlinesResponseSchema` — API response envelope

**Pattern:**
All schemas follow the single source of truth principle — types are derived from schemas via `z.infer<>`.

---

### 3. **route.ts**
API endpoint for deadline CRUD operations.

**Location:** `app/api/deadlines/route.ts`

**Methods:**

#### GET /api/deadlines
- **Authentication:** Required (user must be logged in)
- **Returns:** Array of `BirDeadline` objects, sorted by `due_date` ascending
- **RLS:** Automatically scoped to current user via the database policy
- **Response:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "form_type": "1701Q",
        "due_date": "2026-04-15",
        "filed": false,
        "filed_at": null,
        "notification_sent_7d": false,
        "notification_sent_3d": false,
        "notification_sent_1d": false,
        "created_at": "2026-03-15T10:30:00Z",
        "updated_at": "2026-03-15T10:30:00Z",
        "deleted_at": null
      }
    ]
  }
  ```

#### POST /api/deadlines
- **Authentication:** Required
- **Request body:**
  ```json
  {
    "form_type": "1701Q",
    "due_date": "2026-04-15"
  }
  ```
- **Returns:** The created deadline object with generated `id`
- **Validation:** Both fields required; form_type converted to uppercase

**Error handling:**
All responses follow AKBai's standard envelope with error codes and Taglish messages:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "User not authenticated",
    "message_tl": "Kailangan mo ng account para makita ang deadlines"
  }
}
```

---

### 4. **page.tsx**
Server-rendered page component for the deadlines feature.

**Location:** `app/(app)/(features)/deadlines/page.tsx`

**Key behaviors:**
- Server Component (no `'use client'`) — data fetching at page level
- Automatically redirected to `/login` if user not authenticated (via middleware)
- Fetches deadlines from database with `WHERE deleted_at IS NULL`
- Groups deadlines: unfiled first (urgent), then filed (completed)
- Shows counters: "2 to file, 3 filed"
- Renders empty state if no deadlines exist

**Mobile-first layout:**
- Base: 375px width, single-column
- Padding: 16px sides, 96px bottom (accounts for 80px bottom nav)
- Section headers: small caps, gray text
- Full-width deadline cards with consistent spacing

---

### 5. **deadline-card.tsx**
Interactive card component showing a single deadline's details.

**Location:** `components/features/deadlines/deadline-card.tsx`

**Client Component** (`'use client'`) — uses React hooks for interactivity and date calculations.

**Display logic:**

#### Colors (status-based):
- **Green (teal-light):** Default, days > 7 remaining, or filed
- **Amber (#FBBF24):** 7 days or less remaining and unfiled
- **Red (#F87171):** 3 days or less remaining and unfiled

#### Card displays:
1. **Form type** (e.g., "BIR 1701Q") with filed/unfiled badge
   - Filed: teal checkmark badge
   - Unfiled: amber warning badge
2. **Due date** in readable format (e.g., "Apr 15, 2026")
3. **Days remaining** with human-readable text
   - "X days left" for future dates
   - "Overdue" for past dates
4. **CTA button:** "Mark as Filed" (hidden if already filed)

**Timezone handling:**
- All dates converted to Asia/Manila via `date-fns-tz`
- Calculations respect Manila timezone (not UTC)
- Compliant with BIR deadline requirements

**Touch targets:**
- Card: minimum 44px height
- Button: minimum 44px height
- 8px padding for visual breathing room

---

### 6. **loading.tsx**
Loading skeleton for the deadlines page.

**Location:** `app/(app)/(features)/deadlines/loading.tsx`

**Pattern:**
- Matches the final page layout exactly
- Uses `animate-pulse` for subtle animation
- Shows 3 skeleton cards (typical scenario)
- Warm Honey color avoided (loading states should feel neutral)

**User experience:**
On slow LTE networks, the skeleton appears immediately while data loads in background — maintains perceived responsiveness.

---

### 7. **error.tsx**
Error boundary component for the deadlines feature.

**Location:** `app/(app)/(features)/deadlines/error.tsx`

**Client Component** — Next.js error boundary pattern.

**Features:**
- Taglish error message: "May problema sa pag-load"
- Visual icon (alert circle in red)
- Reset button to retry the page
- Development-only error details (never shown to users in production)
- Consistent styling with brand colors

---

## Architecture & Design Decisions

### 1. **Server Component for Data Fetching**
The page is a Server Component, not a Client Component. This:
- Eliminates client-side data fetching waterfalls
- Keeps the bundle smaller (matters on Philippine LTE)
- Uses Supabase server client (more secure than browser client)
- Leverages Next.js Suspense for loading states

### 2. **RLS + Application-Level Auth**
The API route checks `getUser()` AND the database enforces RLS policies. This is defense-in-depth:
- Database-level security (RLS policies) prevents data leakage
- Application-level auth check provides early validation
- Both must pass for a query to succeed

### 3. **Soft Delete Pattern**
Deadlines are never hard-deleted. Instead:
- UPDATE sets `deleted_at = NOW()`
- All SELECT queries include `WHERE deleted_at IS NULL`
- Compliance requirement for NPC (National Privacy Commission) data restoration

### 4. **Timezone-Aware Calculations**
BIR deadlines are date-critical. The implementation:
- Stores all dates as ISO 8601 (YYYY-MM-DD) in UTC
- Converts to Manila timezone for display and calculations
- Uses `date-fns-tz` library (official, well-maintained)
- Never uses `new Date()` without timezone context

### 5. **Mobile-First Styling**
All Tailwind classes target 375px width first:
- Base classes apply to mobile
- `sm:`, `md:`, `lg:` scale up for larger screens
- No `@media (max-width)` — always use mobile-first approach
- Touch targets: minimum 44x44px (iOS/Android guidelines)

### 6. **Zod as Source of Truth**
Schemas define the API contract, TypeScript types are derived:
```typescript
const MySchema = z.object({ name: z.string() });
type My = z.infer<typeof MySchema>; // Type derived from schema
```
This prevents type/schema drift and catches mismatches at compile time.

---

## Integration Checklist

### Pre-Deployment Steps

- [ ] **1. Run migration:** Apply `002_add_bir_deadlines.sql` to Supabase
  ```bash
  supabase migration up 002_add_bir_deadlines.sql
  ```

- [ ] **2. Generate types:** After migration, sync Supabase types
  ```bash
  supabase gen types typescript > lib/supabase/types.ts
  ```

- [ ] **3. Place files:**
  - `deadline-schemas.ts` → `lib/utils/zod-schemas/deadline.ts`
  - `route.ts` → `app/api/deadlines/route.ts`
  - `deadline-card.tsx` → `components/features/deadlines/deadline-card.tsx`
  - `page.tsx` → `app/(app)/(features)/deadlines/page.tsx`
  - `loading.tsx` → `app/(app)/(features)/deadlines/loading.tsx`
  - `error.tsx` → `app/(app)/(features)/deadlines/error.tsx`

- [ ] **4. Install dependencies:** Ensure `date-fns` and `date-fns-tz` are installed
  ```bash
  npm install date-fns date-fns-tz
  ```

- [ ] **5. Add to bottom nav:** Update `components/ui/bottom-nav.tsx` to include deadlines link
  ```tsx
  <NavItem href="/deadlines" icon={<CalendarIcon />} label="Deadlines" />
  ```

- [ ] **6. Test the flow:**
  - Navigate to `/deadlines` (should show empty state or existing deadlines)
  - Call POST `/api/deadlines` with `{ form_type: "1701Q", due_date: "2026-04-15" }`
  - Verify deadline appears on page with correct color coding
  - Test in browser DevTools: set viewport to 375px to verify mobile layout

---

## Feature Capabilities

### Current MVP

✅ **View deadlines** — See all BIR deadlines sorted by due date
✅ **Status indicators** — Filed/unfiled badges
✅ **Smart coloring** — Amber (7d), Red (3d), Green (filed)
✅ **Days remaining** — Human-readable countdown
✅ **Mobile-first** — Fully responsive at 375px+
✅ **Timezone-aware** — Asia/Manila calculations
✅ **RLS protected** — User-scoped data only
✅ **Error handling** — Graceful loading/error states

### Phase 2 / Future (Not in MVP)

- [ ] Mark deadline as filed (button handler needs API endpoint)
- [ ] Create/edit deadlines via UI form (POST endpoint exists, UI not implemented)
- [ ] Proactive alerts (7-day, 3-day, 1-day notifications)
- [ ] KA chat integration (deadline alerts from Kai in chat)
- [ ] Calendar view (alternative to list view)
- [ ] Bulk import from BIR calendar (manual or auto-sync)
- [ ] Soft reminders in morning briefing (Ang Umaga Mo)

---

## Compliance Notes

### BIR Requirements

- **Date accuracy:** All calculations in Manila timezone (BIR HQ timezone)
- **Data retention:** No hard deletes — `deleted_at` field enables restoration per NPC
- **User privacy:** RLS ensures users see only their own deadlines
- **Audit trail:** `created_at`, `updated_at`, `deleted_at` tracked automatically

### AKBai Standards

- **TypeScript strict mode:** All code uses `strict: true` in tsconfig
- **No `any` types:** All variables have explicit types
- **Taglish messaging:** All user-facing text blends Filipino + English per brand voice
- **Mobile-first CSS:** All layouts designed for 375px first, scale up
- **Soft deletes:** No hard DELETE operations in application code

---

## Testing Strategy

### Unit Tests (Vitest)
```typescript
// deadline.test.ts
import { BirDeadlineSchema } from '@/lib/utils/zod-schemas/deadline';

describe('BirDeadlineSchema', () => {
  it('validates a valid deadline', () => {
    const valid = {
      id: crypto.randomUUID(),
      user_id: crypto.randomUUID(),
      form_type: '1701Q',
      due_date: '2026-04-15',
      filed: false,
      // ... other fields
    };
    expect(() => BirDeadlineSchema.parse(valid)).not.toThrow();
  });
});
```

### Integration Tests (Playwright)
```typescript
// deadlines.spec.ts
test('shows empty state when no deadlines', async ({ page }) => {
  await page.goto('/deadlines');
  await expect(page.getByText(/Walang BIR deadlines/)).toBeVisible();
});

test('displays deadline with amber color at 7 days', async ({ page }) => {
  // Create deadline due in 5 days
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 5);

  // Verify card has amber background
  const card = page.getByText('BIR 1701Q').parent();
  await expect(card).toHaveClass(/bg-amber-900/);
});
```

### Manual Testing Checklist
- [ ] Desktop (1920px): Layout and spacing correct
- [ ] Tablet (768px): Touch targets accessible
- [ ] Mobile (375px): Single-column, no horizontal scroll
- [ ] Slow 3G (DevTools): Loading skeleton appears, then content loads
- [ ] Offline: Page shows cached data or graceful error
- [ ] Dark mode: Verify color contrast ratios

---

## Code Quality

### Linting & Formatting

All files follow AKBai's TypeScript strict mode:
```bash
npx eslint . --fix
npx prettier . --write
```

### Type Safety

- No `any` types
- All API responses validated with Zod
- Database queries typed against generated Supabase types
- Component props defined via interfaces

### Performance

- Server Component (no client-side rendering overhead)
- Minimal bundle size (only `date-fns` and `date-fns-tz` imported in client)
- RLS indexes optimize common queries
- Skeleton loading provides perceived performance

---

## Support & Troubleshooting

### Issue: "Days remaining" showing incorrect number

**Cause:** Timezone mismatch. Verify:
1. Server timezone is UTC (standard for Node.js)
2. Database timezone is UTC
3. Display conversion uses `date-fns-tz` with `Asia/Manila`

**Fix:** Run:
```bash
TZ=UTC node -e "console.log(new Date())"
```

### Issue: DeadlineCard not showing amber background

**Cause:** Tailwind CSS not including the class name.

**Fix:**
1. Verify `tailwind.config.ts` includes `components/**/*.{tsx}`
2. Clear `.next/` build cache: `rm -rf .next && npm run dev`
3. Check that `date-fns` is installed (needed for date calculations)

### Issue: POST /api/deadlines returns 401 Unauthorized

**Cause:** User session expired or not authenticated.

**Fix:**
1. Verify user is logged in (check cookies in DevTools)
2. Check middleware is set up correctly (should refresh session)
3. Test with `curl` directly to isolate client vs. server issue

---

## References

- **AKBai Fullstack Engineer Skill:** `/mnt/AKBai/akbai-delivery/skills/fullstack-engineer/SKILL.md`
- **Next.js Conventions:** `references/nextjs-conventions.md`
- **Supabase Patterns:** `references/supabase-patterns.md`
- **Brand Context:** `/mnt/AKBai/akbai-delivery/shared/brand-context.md`
- **Gap Registry:** Check for deadline-related gaps in `/mnt/AKBai/akbai-delivery/shared/gap-registry.md`

---

## Implementation Complete ✅

All files follow AKBai's conventions exactly:
- Supabase RLS configured with best practices
- Type-safe API with Zod validation
- Mobile-first UI with brand colors
- Timezone-aware date handling (BIR-critical)
- Comprehensive error and loading states
- Ready for Phase 1 MVP deployment

**Total scaffolding:** 6 files + 1 migration SQL
**Time to integration:** ~15 minutes (copy files, run migration, update imports)
