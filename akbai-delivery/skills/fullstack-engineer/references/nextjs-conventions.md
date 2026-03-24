# AKBai — Next.js Conventions
> Reference for fullstack-engineer skill. File structure, naming, server/client split, Tailwind config.
> Last updated: 2026-03-24 | Stack: Next.js 16 App Router, TypeScript strict, Tailwind CSS, Plus Jakarta Sans

---

## Table of Contents

1. [File Structure](#file-structure)
2. [Naming Conventions](#naming-conventions)
3. [Server vs Client Components](#server-vs-client-components)
4. [Page and Layout Patterns](#page-and-layout-patterns)
5. [Loading and Error States](#loading-and-error-states)
6. [Tailwind Configuration](#tailwind-configuration)
7. [PWA Configuration](#pwa-configuration)

---

## File Structure

```
/
├── app/
│   ├── layout.tsx                    # Root layout — Plus Jakarta Sans, metadata, Supabase provider
│   ├── (auth)/                       # Unauthenticated routes
│   │   ├── login/page.tsx            # Email OTP login (Supabase Auth magic link)
│   │   ├── signup/page.tsx           # Registration
│   │   └── onboarding/              # Kilala Kita 5-step onboarding
│   │       ├── layout.tsx            # Onboarding shell (progress bar, back/next)
│   │       ├── [step]/page.tsx       # Dynamic route for steps 1–5
│   │       └── components/           # Step-specific components
│   ├── (app)/                        # Authenticated app shell
│   │   ├── layout.tsx                # App shell — bottom nav, KA chat FAB, auth guard
│   │   ├── dashboard/                # Home tab — Ang Umaga Mo morning briefing
│   │   │   ├── page.tsx
│   │   │   ├── loading.tsx
│   │   │   └── error.tsx
│   │   └── (features)/              # Feature group — no layout of its own
│   │       ├── resibo/               # Resibo Scanner
│   │       ├── saan-napunta/         # Expense Dashboard
│   │       ├── deadlines/            # Deadline Watcher
│   │       ├── invoices/             # Invoice Cards
│   │       ├── costing/              # Costing Cards
│   │       └── reply/                # Reply Drafter
│   └── api/                          # API routes (all server-side)
│       ├── ka/
│       │   ├── chat/route.ts         # KA conversation — Claude API
│       │   └── briefing/route.ts     # Morning briefing generation
│       ├── resibo/
│       │   └── scan/route.ts         # Receipt OCR — Claude Haiku Vision
│       ├── transactions/route.ts     # CRUD transactions
│       ├── invoices/
│       │   ├── route.ts              # CRUD invoices
│       │   └── [id]/pdf/route.ts     # Invoice PDF export
│       ├── deadlines/route.ts        # BIR deadline list
│       ├── payments/
│       │   └── subscribe/route.ts    # Xendit subscription creation
│       └── user/
│           ├── profile/route.ts      # User profile CRUD
│           └── onboarding/route.ts   # Onboarding step submission
├── components/
│   ├── ui/                           # Atomic / shared UI
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── input.tsx
│   │   ├── loading-skeleton.tsx
│   │   ├── empty-state.tsx
│   │   ├── error-card.tsx
│   │   ├── chat-bubble.tsx
│   │   ├── bottom-nav.tsx
│   │   └── feature-gated.tsx
│   └── features/                     # Feature-specific components
│       ├── resibo/
│       │   ├── scan-button.tsx
│       │   ├── receipt-card.tsx
│       │   └── receipt-detail-modal.tsx
│       ├── dashboard/
│       │   ├── briefing-card.tsx
│       │   ├── cash-position-card.tsx
│       │   └── deadline-summary.tsx
│       └── ...
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Browser client (NEXT_PUBLIC_ keys only)
│   │   ├── server.ts                 # Server client (uses cookies for auth)
│   │   ├── admin.ts                  # Service role client (admin only, never imported in client)
│   │   └── types.ts                  # Generated types from Supabase CLI: `supabase gen types typescript`
│   ├── claude/
│   │   ├── client.ts                 # Anthropic SDK wrapper
│   │   ├── circuit-breaker.ts        # Daily spend cap logic
│   │   ├── prompts/                  # System prompt templates
│   │   │   ├── ka-persona.ts         # Core KA identity
│   │   │   ├── resibo-ocr.ts         # Receipt scanning prompt
│   │   │   └── reply-drafter.ts      # DM reply generation prompt
│   │   └── schemas/                  # Zod schemas for Claude structured output
│   │       ├── receipt-output.ts
│   │       ├── briefing-output.ts
│   │       └── reply-output.ts
│   ├── xendit/
│   │   ├── client.ts                 # Xendit API wrapper
│   │   └── verify-webhook.ts         # Signature verification
│   └── utils/
│       ├── api-response.ts           # apiSuccess() / apiError() helpers
│       ├── money.ts                  # centavosToPeso / pesoToCentavos
│       ├── timezone.ts               # Asia/Manila conversion helpers
│       └── zod-schemas/              # Shared Zod schemas (request/response bodies)
│           ├── transaction.ts
│           ├── receipt.ts
│           ├── invoice.ts
│           └── user.ts
├── public/
│   ├── manifest.json                 # PWA manifest
│   ├── icons/                        # App icons (192, 512)
│   └── sw.js                         # Service worker (generated by next-pwa)
├── supabase/
│   └── migrations/                   # SQL migration files
│       ├── 001_initial_schema.sql
│       └── ...
├── tailwind.config.ts
├── next.config.js
├── tsconfig.json
└── .env.local                        # Never committed
```

---

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Files & folders | kebab-case | `receipt-card.tsx`, `saan-napunta/` |
| React components | PascalCase export | `export function ReceiptCard()` |
| TypeScript types/interfaces | PascalCase | `type Transaction`, `interface UserProfile` |
| Zod schemas | PascalCase + "Schema" suffix | `const TransactionSchema = z.object(...)` |
| API route handlers | UPPERCASE HTTP method | `export async function POST(req: Request)` |
| Utility functions | camelCase | `centavosToPeso()`, `getServerUser()` |
| Constants | SCREAMING_SNAKE_CASE | `const MAX_SCANS_PRO = 50` |
| CSS classes | Tailwind utilities only | No custom class names |
| Database tables | snake_case, plural | `transactions`, `ka_conversations` |
| Database columns | snake_case | `user_id`, `deleted_at`, `created_at` |
| Environment variables | SCREAMING_SNAKE_CASE | `ANTHROPIC_API_KEY` |
| Public env vars | Prefix with `NEXT_PUBLIC_` | `NEXT_PUBLIC_SUPABASE_URL` |

**File naming rule:** One component per file. The file name matches the component name in kebab-case. `ReceiptCard` lives in `receipt-card.tsx`. No `index.tsx` barrel exports — they make searching harder for a solo dev.

---

## Server vs Client Components

Next.js 16 App Router defaults to Server Components. This is important for AKBai because it keeps the client JS bundle small (target < 200KB), which matters on Philippine LTE networks.

### When to Use Server Components (default)

- Pages that fetch data from Supabase
- Layouts (app shell, navigation structure)
- Components that only render HTML (no interactivity)
- Anything that accesses server-only resources (env vars, Supabase service role)

```typescript
// app/(app)/(features)/deadlines/page.tsx — Server Component (no 'use client')
import { createClient } from '@/lib/supabase/server';

export default async function DeadlinesPage() {
  const supabase = createClient();
  const { data: deadlines } = await supabase
    .from('bir_deadlines')
    .select('*')
    .is('deleted_at', null)
    .order('due_date', { ascending: true });

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-bold text-white">BIR Deadlines</h1>
      {deadlines?.map((d) => (
        <DeadlineCard key={d.id} deadline={d} />
      ))}
    </div>
  );
}
```

### When to Use Client Components ('use client')

Add `'use client'` at the top of the file only when the component needs:
- Event handlers (onClick, onChange, onSubmit)
- React hooks (useState, useEffect, useRef)
- Browser APIs (camera, geolocation, localStorage)
- Real-time subscriptions (Supabase Realtime)
- Animations or transitions that depend on state

```typescript
// components/features/resibo/scan-button.tsx — Client Component
'use client';

import { useState } from 'react';

export function ScanButton() {
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = async () => {
    setIsScanning(true);
    // Camera access, image capture, upload to Supabase Storage
    // Then call POST /api/resibo/scan
    setIsScanning(false);
  };

  return (
    <button
      onClick={handleScan}
      disabled={isScanning}
      className="w-full min-h-[44px] rounded-xl bg-gradient-to-r from-amber-500 to-amber-600
                 font-semibold text-white disabled:opacity-50"
    >
      {isScanning ? 'Nag-i-scan...' : 'I-scan ang Resibo'}
    </button>
  );
}
```

### The Boundary Pattern

Keep Client Components as small and leaf-level as possible. A page should be a Server Component that passes data down to small Client Components for interactivity.

```
Page (Server) → fetches data
  └── InteractiveCard (Client) → handles tap, swipe, expand
        └── StaticContent (Server-compatible) → just renders props
```

---

## Page and Layout Patterns

### Root Layout

```typescript
// app/layout.tsx
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
});

export const metadata = {
  title: 'AKBai — Katuwang ng Negosyo Mo',
  description: 'Your AI Business Partner. In Taglish.',
  manifest: '/manifest.json',
  themeColor: '#07101e',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tl" className={jakarta.variable}>
      <body className="bg-ink text-white font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
```

### App Shell Layout (Authenticated)

```typescript
// app/(app)/layout.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BottomNav } from '@/components/ui/bottom-nav';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
```

### Feature Page Template

```typescript
// app/(app)/(features)/[feature]/page.tsx
import { createClient } from '@/lib/supabase/server';
import { FeatureComponent } from '@/components/features/[feature]/feature-component';
import { EmptyState } from '@/components/ui/empty-state';

export default async function FeaturePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .eq('user_id', user!.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error; // Caught by error.tsx

  if (!data || data.length === 0) {
    return <EmptyState message_tl="Wala pang records dito. Simulan natin!" />;
  }

  return <FeatureComponent data={data} />;
}
```

---

## Loading and Error States

Every feature folder should have `loading.tsx` and `error.tsx` files. These are Next.js conventions that automatically wrap the page in Suspense/ErrorBoundary.

### loading.tsx

```typescript
// app/(app)/(features)/resibo/loading.tsx
export default function ResiboLoading() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-card" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl bg-card" />
      ))}
    </div>
  );
}
```

### error.tsx

```typescript
// app/(app)/(features)/resibo/error.tsx
'use client';

export default function ResiboError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 p-8 text-center">
      <p className="text-lg font-semibold text-red-400">May problema sa pag-load</p>
      <p className="text-sm text-gray-400">
        Subukan ulit. Kung tuloy-tuloy ang error, i-refresh ang page.
      </p>
      <button
        onClick={reset}
        className="min-h-[44px] rounded-xl bg-gradient-to-r from-amber-500 to-amber-600
                   px-6 font-semibold text-white"
      >
        Subukan Ulit
      </button>
    </div>
  );
}
```

---

## Tailwind Configuration

AKBai uses Tailwind CSS exclusively. The configuration extends the default theme with AKBai brand tokens.

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-jakarta)', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Brand identity
        honey: {
          light: '#F59E0B',   // Primary — CTAs, highlights, logo
          DEFAULT: '#F59E0B',
          deep: '#D97706',    // Hover states, gradient end
        },
        teal: {
          light: '#20C9A0',   // Financial data, success
          DEFAULT: '#20C9A0',
          cyan: '#0FB8D9',    // Positive alerts, trust signals
        },
        // Backgrounds
        ink: '#07101e',       // Page background (dark primary)
        card: '#0d1a2e',     // Card backgrounds
        'card-alt': '#111f36', // Alternate card backgrounds
        // Semantic
        'warm-white': '#F5F0E8', // Light mode alternative
      },
      minHeight: {
        touch: '44px',        // Minimum touch target
      },
      minWidth: {
        touch: '44px',
      },
    },
  },
  plugins: [],
};

export default config;
```

### Tailwind Usage Rules

- Use brand color tokens (`text-honey`, `bg-ink`, `text-teal-light`) instead of raw hex or Tailwind default colors
- Touch targets: `min-h-touch min-w-touch` on all tappable elements (buttons, links, cards)
- Mobile-first: write base styles for 375px, use `sm:` / `md:` / `lg:` to scale up
- Gradient buttons: `bg-gradient-to-r from-honey-light to-honey-deep`
- Card pattern: `rounded-xl bg-card p-4`
- No `@apply` in globals.css except for rare base-level resets
- No custom CSS classes — if Tailwind can't express it, rethink the design

---

## PWA Configuration

```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      // Cache Morning Briefing data for offline access
      urlPattern: /\/api\/ka\/briefing/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'ka-briefing',
        expiration: { maxEntries: 1, maxAgeSeconds: 86400 },
      },
    },
  ],
});

module.exports = withPWA({
  reactStrictMode: true,
  // ... other Next.js config
});
```

### Offline Behavior

Users pack orders in bodegas with intermittent LTE. The app must degrade gracefully:
- Morning Briefing: cached, show last known briefing with "offline" badge
- Chat: queue messages, sync when back online
- Receipt scan: camera still works, upload queues for sync
- All other screens: show cached data with timestamp of last sync
