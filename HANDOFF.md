# AKBai — Handoff Document for Claude Code

**Last Updated:** 2026-03-19
**Owner:** Anton del Rosario
**Repo:** https://github.com/adelro-git/akbai

---

## What Is AKBai?

AKBai is a mobile-first Progressive Web App (PWA) — an AI business partner called **"Kai"** for Filipino MSMEs (Micro, Small, and Medium Enterprises). Kai speaks in **Taglish** (Filipino-English mix), is warm, competent, and proactive. The target users are micro/small business owners in the Philippines who need help with BIR compliance, income tracking, and cash flow.

---

## Current State (What Emergent Built)

### Completed Features

| Feature | Status | Notes |
|---|---|---|
| Next.js 16 PWA scaffold | Done | App Router, TypeScript, Turbopack |
| Supabase Auth (Email OTP) | Done | Magic link + OTP code flow |
| Login page (2-step) | Done | Email → OTP code entry |
| Auth callback route | Done | Handles magic link redirects |
| Auth middleware (proxy.ts) | Done | Redirects unauthenticated users |
| Chat interface UI | Done | Mobile-first, full-height, typing indicator |
| AI Chat endpoint (`/api/chat`) | Done | Claude Sonnet 4-6 via Emergent LLM key |
| Kai system prompt | Done | Taglish personality, BIR scope, disclaimers |
| Conversation persistence | Done | Stored in Supabase `ka_conversations` table |
| PWA manifest + service worker | Done | `manifest.json`, `sw.js`, app icons |
| Dashboard placeholder | Done | Redirects to chat for now |
| FastAPI backend proxy | Done | Routes `/api/*` to Next.js, handles `/api/chat` directly |
| SQL migration file | Done | All tables, RLS policies, triggers |

### Not Yet Built

- Build 1: Kilala Kita (User Onboarding) — business profile collection
- Build 2: Dashboard — transaction list, income/expense summary
- Builds 3-8: BIR calendar, PDF reports, offline support, payments, etc.

---

## Architecture

```
Browser (Mobile PWA)
  │
  ├── Static assets → Next.js (port 3000)
  ├── /api/chat → FastAPI (port 8001) → Claude Sonnet via emergentintegrations
  └── /api/* (other) → FastAPI (port 8001) → proxies to Next.js (port 3000)
```

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16.2.0 (App Router, Turbopack), React 19, TypeScript |
| Styling | Tailwind CSS 3.4 + Shadcn/UI components |
| Font | Plus Jakarta Sans (via next/font/google) |
| Auth | Supabase Auth (Email OTP / Magic Link) |
| Database | Supabase PostgreSQL with Row-Level Security |
| AI | Claude `claude-sonnet-4-6` via `emergentintegrations` Python library |
| Backend | FastAPI (Python) — handles AI chat + proxies other routes to Next.js |
| PWA | Custom `manifest.json` + `sw.js` |
| Deployment Target | Vercel (frontend), or self-hosted |

### Key Architectural Decisions

1. **AI chat runs on FastAPI (Python), not Next.js** — The Emergent LLM integration library (`emergentintegrations`) is Python-only. The FastAPI `/api/chat` endpoint handles authentication, conversation history, and AI calls. This is registered BEFORE the catch-all proxy route so it takes priority.

2. **Login form uses uncontrolled inputs (refs) instead of React state** — React 19 + Next.js 16 has issues with controlled inputs where `onChange`/`onInput` don't reliably update state. The login form uses `useRef` and `type="button"` + `onClick` (no `<form onSubmit>`) to completely avoid form submission/hydration issues.

3. **Next.js middleware uses `proxy.ts`** — Next.js 16 convention requires `proxy.ts` (not `middleware.ts`) with a `proxy()` export (not `middleware()`).

4. **Route groups for page organization** — Pages are organized under `(app)/` (authenticated) and `(auth)/` (public) route groups. Previous routing conflicts with flat routes were resolved by using route groups exclusively and removing flat route duplicates.

---

## File Structure

```
/app/
├── backend/
│   ├── .env                          # Backend env vars (Supabase, Emergent key)
│   ├── server.py                     # FastAPI: /api/chat handler + proxy to Next.js
│   ├── requirements.txt              # Python dependencies
│   └── tests/
│       └── test_akbai_api.py         # API tests
│
├── frontend/
│   ├── .env.local                    # Frontend env vars (Supabase keys)
│   ├── next.config.js                # Next.js config (Turbopack, origins, images)
│   ├── tailwind.config.js            # Tailwind with AKBai brand colors
│   ├── package.json                  # Node dependencies
│   ├── tsconfig.json                 # TypeScript config
│   ├── vercel.json                   # Vercel deployment config
│   │
│   ├── public/
│   │   ├── manifest.json             # PWA manifest
│   │   ├── sw.js                     # Service worker
│   │   └── icons/
│   │       ├── icon-192.png
│   │       └── icon-512.png
│   │
│   ├── supabase/
│   │   └── migrations/
│   │       └── 001_initial_schema.sql  # Full DB schema (already run)
│   │
│   └── src/
│       ├── proxy.ts                  # Next.js 16 middleware (auth redirects)
│       │
│       ├── app/
│       │   ├── layout.tsx            # Root layout (font, PWA meta, SW registration)
│       │   ├── page.tsx              # Root "/" — redirects to /chat or /login
│       │   ├── globals.css           # Tailwind base + AKBai CSS variables
│       │   │
│       │   ├── (auth)/
│       │   │   └── login/page.tsx    # Login page
│       │   │
│       │   ├── (app)/
│       │   │   ├── layout.tsx        # App group layout (passthrough)
│       │   │   ├── chat/page.tsx     # Chat page (server component, loads history)
│       │   │   └── dashboard/page.tsx # Dashboard placeholder
│       │   │
│       │   ├── api/
│       │   │   └── chat/route.ts     # Next.js API fallback (not primary — FastAPI handles /api/chat)
│       │   │
│       │   └── auth/
│       │       └── callback/route.ts # Supabase magic link callback handler
│       │
│       ├── components/
│       │   ├── auth/
│       │   │   └── login-form.tsx    # Login form (uncontrolled inputs, ref-based)
│       │   ├── chat/
│       │   │   ├── chat-interface.tsx # Main chat component (state, API calls, sign out)
│       │   │   ├── chat-input.tsx    # Message input textarea + send button
│       │   │   ├── chat-bubble.tsx   # Individual message bubble (user vs Kai)
│       │   │   └── message-list.tsx  # Scrollable message list + loading indicator
│       │   └── ui/                   # Shadcn/UI components
│       │
│       └── lib/
│           └── supabase/
│               ├── client.ts         # Browser Supabase client
│               ├── server.ts         # Server-side Supabase client (cookies)
│               └── middleware.ts      # Middleware Supabase client (auth session refresh)
```

---

## Environment Variables

### Backend (`/app/backend/.env`)

```env
MONGO_URL="mongodb://localhost:27017"     # Emergent platform requirement (not used by app)
DB_NAME="test_database"                    # Emergent platform requirement (not used by app)
CORS_ORIGINS="*"

# === AKBai-specific ===
SUPABASE_URL=https://naxjmwjrhzenjqburejl.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_vdo0T7PEMpeFWkT2iY8izg_7-EujaT3
SUPABASE_SERVICE_ROLE_KEY=sb_secret_urV6pg4nf1UpEZeyb-yKXg_nlubuThv

# Replace with your own Anthropic API key for production.
# Current key is Emergent Universal Key (works only inside Emergent platform).
EMERGENT_LLM_KEY=sk-emergent-d6153BeFcA37d01Fe8
```

### Frontend (`/app/frontend/.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://naxjmwjrhzenjqburejl.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_vdo0T7PEMpeFWkT2iY8izg_7-EujaT3
SUPABASE_SERVICE_ROLE_KEY=sb_secret_urV6pg4nf1UpEZeyb-yKXg_nlubuThv

# Replace with your own Anthropic API key for production.
# The Next.js /api/chat route is a fallback — primary chat is handled by FastAPI backend.
ANTHROPIC_API_KEY=sk-emergent-d6153BeFcA37d01Fe8
```

### IMPORTANT: What to change for production / Claude Code

1. **`EMERGENT_LLM_KEY`** in `backend/.env` → Replace with your Anthropic API key (`sk-ant-api03-...`). Then update `server.py` line 159 to use `ANTHROPIC_API_KEY` instead of `EMERGENT_LLM_KEY`.
2. **`ANTHROPIC_API_KEY`** in `frontend/.env.local` → Replace with your real key if you want the Next.js fallback route to work.
3. The **`emergentintegrations`** Python library is Emergent-platform-specific. For production, replace the chat call in `server.py` (lines 200-208) with the official **Anthropic Python SDK** (`anthropic` package).

---

## Database Schema (Supabase PostgreSQL)

Already created via `001_initial_schema.sql`. All tables have RLS enabled.

### Tables

**`users`** — Mirrors `auth.users`, auto-created on signup via trigger
```sql
id UUID PRIMARY KEY REFERENCES auth.users(id)
display_name TEXT
phone TEXT
feature_flags JSONB DEFAULT '{}'
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
deleted_at TIMESTAMPTZ
```

**`business_profiles`** — User's business info (for Build 1 onboarding)
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
business_name TEXT
business_type TEXT
income_range TEXT
bir_registered BOOLEAN DEFAULT false
profile_version INTEGER DEFAULT 1
created_at, updated_at, deleted_at TIMESTAMPTZ
```

**`ka_conversations`** — Chat message history
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
role message_role ENUM ('user', 'assistant')
content TEXT NOT NULL
domain VARCHAR(50) DEFAULT 'general'
created_at TIMESTAMPTZ
deleted_at TIMESTAMPTZ
```

### RLS Policies
- All tables: users can only SELECT/INSERT/UPDATE their own rows (`auth.uid() = user_id`)
- The backend uses the **service role key** to bypass RLS for server-side operations

### Triggers
- `on_auth_user_created` → auto-inserts into `public.users` when a new auth user signs up
- `on_users_updated` / `on_business_profiles_updated` → auto-updates `updated_at`

---

## API Endpoints

### `POST /api/chat` (FastAPI — primary)
- **Auth:** Extracts Supabase JWT from SSR cookies (`sb-<ref>-auth-token`)
- **Body:** `{ "message": "string" }`
- **Response:** `{ "success": true, "data": { "message": "Kai's response" } }`
- **Errors:** 401 (no auth), 400 (empty message), 500 (server error)
- **AI:** Uses `emergentintegrations` → Claude Sonnet 4-6 with Taglish system prompt
- **Persistence:** Stores user message + Kai response in `ka_conversations`

### `GET /auth/callback` (Next.js)
- Handles Supabase magic link redirect (`?code=...`)
- Exchanges code for session, redirects to `/chat`

### Other `/api/*` routes
- Proxied from FastAPI to Next.js (catch-all handler)

---

## Brand / Design

| Token | Value |
|---|---|
| Background (Ink) | `#07101e` |
| Card | `#0d1a2e` |
| Card Alt | `#111f36` |
| Warm Honey (CTAs) | `#F59E0B` |
| Honey Deep | `#D97706` |
| User Bubble | `#1a2a42` |
| Teal | `#20C9A0` |
| Font | Plus Jakarta Sans |
| Language | Taglish (Filipino-English mix) |
| Theme | Dark only |

Logo images are loaded from GitHub: `https://raw.githubusercontent.com/adelro-git/akbai/main/brand/Logo%20Files/`

---

## Known Issues & Gotchas

1. **React 19 controlled inputs** — `<input value={state} onChange={...}>` does NOT reliably update state in Next.js 16 / React 19 production builds. The login form was rewritten to use uncontrolled refs (`useRef`) and `type="button"` + `onClick` instead of `<form onSubmit>`. Apply the same pattern if adding new forms.

2. **`emergentintegrations` is Emergent-only** — This Python library works only with the Emergent Universal Key inside the Emergent platform. For production, replace with the official `anthropic` Python SDK:
   ```python
   # Replace this (Emergent):
   from emergentintegrations.llm.chat import LlmChat, UserMessage
   chat = LlmChat(api_key=key, session_id=sid, system_message=prompt)
   chat.with_model("anthropic", "claude-sonnet-4-6")
   response = await chat.send_message(UserMessage(text=msg))

   # With this (official Anthropic SDK):
   import anthropic
   client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
   response = client.messages.create(
       model="claude-sonnet-4-6",
       max_tokens=512,
       system=system_prompt,
       messages=[{"role": "user", "content": msg}]
   )
   kai_response = response.content[0].text
   ```

3. **Supabase SSR cookies** — The project ref is `naxjmwjrhzenjqburejl`. Cookies are named `sb-naxjmwjrhzenjqburejl-auth-token` and may be chunked (`.0`, `.1`, etc.) for large sessions. The FastAPI backend handles both formats.

4. **Next.js middleware naming** — Must be `proxy.ts` with `export async function proxy()` (not `middleware.ts`). This is a Next.js 16 convention.

5. **Turbopack root** — `next.config.js` sets `turbopack.root` to `__dirname` to fix workspace root resolution issues.

6. **`allowedDevOrigins`** — Emergent uses dynamic cluster hostnames. If you see "Blocked cross-origin request" errors in dev, add the new hostname to `next.config.js`.

---

## Migration Guide: Emergent → Vercel / Self-Hosted

### Step 1: Replace AI integration
- Remove `emergentintegrations` from `requirements.txt`
- Install `anthropic` (`pip install anthropic`)
- Update `server.py` to use official Anthropic SDK (see snippet above)
- Set `ANTHROPIC_API_KEY` env var with your real key

### Step 2: Deploy frontend to Vercel
- Push the `/frontend` directory
- Set env vars in Vercel dashboard:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ANTHROPIC_API_KEY`
- A `vercel.json` is already included

### Step 3: Deploy backend separately (if needed)
- The FastAPI backend handles `/api/chat` with AI + Supabase
- Can be deployed to Railway, Render, Fly.io, etc.
- Or, move the chat logic back into the Next.js API route (`/api/chat/route.ts`) using the official Anthropic TypeScript SDK to keep it all in one deployment

### Step 4: Remove Emergent-specific config
- Remove `allowedDevOrigins` from `next.config.js`
- Remove `MONGO_URL`, `DB_NAME` from backend `.env` (Emergent platform only)
- Remove the FastAPI proxy catch-all if consolidating into Next.js

---

## Phased Roadmap (From AKBAI_MASTER_BRIEF.md)

| Phase | Name | Description | Status |
|---|---|---|---|
| Session 0 | Architecture | Stack alignment, DB schema, env setup | Done |
| Session 1 | Scaffold | PWA shell, auth, chat UI, API endpoint | Done |
| Session 2 | Fixes | Auth callback, login form, deployment config | Done |
| Build 0 | AI Scope | Kai's capabilities, system prompt, chat API | Done |
| Build 1 | Kilala Kita | User onboarding, business profile setup | Not started |
| Build 2 | Dashboard | Transaction list, income/expense summary | Not started |
| Build 3-8 | Features | BIR calendar, PDF reports, offline, payments | Not started |

---

## Testing

- **Test reports:** `/app/test_reports/iteration_1.json` through `iteration_4.json`
- **Backend tests:** `/app/backend/tests/test_akbai_api.py`
- **Latest results (iteration_4):** 100% backend (11/11), 100% frontend
- **Manual testing required:** Full OTP login flow (needs real email + Supabase)

---

## Quick Start (for Claude Code)

```bash
# Frontend
cd frontend
yarn install
yarn dev  # Starts on port 3000

# Backend
cd backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Open http://localhost:3000
```

For the AI chat to work, you MUST either:
1. Replace `EMERGENT_LLM_KEY` with a real Anthropic key, OR
2. Swap `emergentintegrations` for the official `anthropic` SDK
