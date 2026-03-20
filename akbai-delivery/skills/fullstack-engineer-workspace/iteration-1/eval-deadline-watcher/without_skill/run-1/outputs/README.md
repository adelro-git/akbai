# BIR Deadline Watcher Feature - Complete Scaffold

This directory contains the complete scaffolding for the BIR Deadline Watcher feature for AKBai (Filipino MSME AI business partner).

## Files Overview

### 1. **migration.sql** (Supabase Database)
- Creates `bir_deadlines` table with UUID PK, foreign key to `auth.users`
- Columns: `form_type`, `form_name`, `due_date`, `description`, `is_filed`, `filed_date`, timestamps
- Full Row Level Security (RLS) enabled with 4 policies:
  - Users can only SELECT, INSERT, UPDATE, DELETE their own deadlines
- Indexes for performance: user_id, (user_id, due_date), due_date, (user_id, is_filed)
- Automatic `updated_at` timestamp via trigger
- View `upcoming_bir_deadlines` for upcoming unfiled deadlines with priority levels

**Installation**: Run this SQL in your Supabase console under the target project.

### 2. **route.ts** (API Handler - `/api/deadlines`)
- **GET**: Fetch paginated deadlines for authenticated user
  - Query params: `status` (unfiled|filed|all), `limit`, `offset`
  - Computes `days_remaining` and `priority_level` (critical/warning/normal)
  - Requires Bearer token authorization
- **POST**: Create new deadline for user
  - Required fields: `form_type`, `form_name`, `due_date`
  - Optional: `description`, `is_filed`, `filed_date`
- **PATCH**: Update deadline by ID
  - Verifies user ownership before updating
- **DELETE**: Delete deadline by ID
  - Verifies user ownership before deleting

All endpoints return 401 on missing/invalid auth, 404 on not found, 500 on server error.

### 3. **page.tsx** (Main UI - `/app/(app)/(features)/deadlines/`)
- Full client-side React component with hooks
- Fetches deadlines from `/api/deadlines` route
- Filters: unfiled | filed | all (tabs)
- Displays `DeadlineCard` components in a grid
- Actions: Mark as Filed, Delete
- Error states and loading skeleton support
- Empty state messaging
- Informational section explaining color coding

### 4. **deadline-card.tsx** (Component)
Mobile-first card showing:
- **Form type** (badge, uppercase)
- **Form name** (title)
- **Status badge**: Filed (green) | Unfiled (blue) | Overdue (red)
- **Due date** (formatted with locale-aware text: "Today", "Tomorrow", or date)
- **Days remaining** with progress bar
  - Red: ≤3 days
  - Amber: ≤7 days
  - Green: >7 days
- **Buttons**: Mark Filed (green) | Delete (outline)
- Description (truncated to 2 lines)

### 5. **loading.tsx** (Skeleton UI)
- `DeadlinesSkeleton` component for initial page load
- Animates 3 skeleton cards matching deadline-card structure
- Prevents layout shift during data fetch

### 6. **error.tsx** (Error Handling)
- `ErrorBoundary` class component for React error boundary
- `ErrorPage` functional component for 404/500 scenarios
- Error message display with action to retry
- Fallback UI for critical failures

## Integration Steps

### 1. Database Setup
```sql
-- Run migration.sql in your Supabase SQL Editor
```

### 2. Project Structure
```
/app/(app)/(features)/deadlines/
├── page.tsx          # Main page
├── deadline-card.tsx # Card component
├── loading.tsx       # Skeleton loader
├── error.tsx         # Error boundary
└── route.ts          # API handler in /api/deadlines
```

### 3. Environment Variables Required
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Dependencies
- `@supabase/supabase-js` — Database & Auth
- `date-fns` — Date formatting (with fil locale for Filipino)
- `lucide-react` — Icons (Calendar, Clock, AlertCircle, CheckCircle2)

## Features

### Color Coding (Mobile-First Responsive)
- **Green** (bg-green-50, border-green-200): >7 days or Filed
- **Amber** (bg-amber-50, border-amber-200): 3-7 days
- **Red** (bg-red-50, border-red-200): ≤3 days
- **Gray**: Filed status

### Priority Computation
- Server-side in `/api/deadlines` route
- Client-side in `DeadlineCard` component
- Uses `(due_date - CURRENT_DATE)` calculation
- Handles overdue dates gracefully

### Authentication
- Supabase Auth via Bearer tokens
- Session-based fetching in page.tsx
- RLS enforces user isolation at DB level

### Data Mutations
- **Mark as Filed**: Sets `is_filed=true`, `filed_date=TODAY`
- **Delete**: Removes deadline completely
- Optimistic UI updates after API success

## Accessibility & UX
- Semantic HTML (buttons, links)
- Color-blind friendly (icons + text)
- Mobile-first (responsive padding, font sizes)
- Clear status indicators (badges + progress bars)
- Loading states (skeleton, disabled buttons)
- Error messages (red banners, inline feedback)

## Notes for Implementation

1. **Route placement**: `route.ts` should be at `/app/api/deadlines/route.ts`
2. **Page placement**: `page.tsx` at `/app/(app)/(features)/deadlines/page.tsx`
3. **Component placement**: `deadline-card.tsx` in same directory or `/components/deadlines/`
4. **RLS critical**: Verify all 4 policies are active before going live
5. **Error handling**: Both API routes and UI handle Supabase errors gracefully
6. **Icons**: Ensure `lucide-react` is installed for `AlertCircle`, `Calendar`, etc.
7. **Date locale**: Uses `fil` locale from `date-fns` for Filipino-friendly dates

## Testing Checklist
- [ ] Create deadline via POST /api/deadlines
- [ ] View unfiled deadlines on page.tsx
- [ ] Verify color changes at 7-day and 3-day marks
- [ ] Mark deadline as filed (check filed_date is set)
- [ ] Delete deadline
- [ ] Verify RLS blocks access to other users' deadlines
- [ ] Test loading and error states
- [ ] Mobile responsiveness on small screens
