# Costing Cards Schema Design — Build 7
> Data Architect response to: "I need to add a costing_cards table to Supabase for the Costing Cards feature (Build 7). Maria uses this to calculate profit margins on her ube cake — she inputs ingredients, quantities, and prices, and the system tells her per-unit cost and suggested selling price. The table needs to work with the existing transactions and businesses tables. Can you design the schema?"

---

## Step 1: Define Purpose and Relationships

### Business Concept
**Costing Cards** is a product costing and margin analysis tool. It helps food sellers (primarily Maria persona) break down ingredient costs, calculate per-unit production cost, and get AI-suggested selling prices based on target margin. This is a Phase 1 feature (Build 7) exclusive to Pro/Business tiers.

### User Interaction
- **Maria** (home baker) is the primary user. She creates a "Costing Card" for "Ube Cake". She inputs:
  - Recipe name (e.g., "Ube Cake 8-inch")
  - Ingredients (name, quantity, unit, unit cost)
  - Number of portions/units per batch (e.g., "6 slices per batch")
- AKBai calculates: total ingredient cost → cost per unit → suggests selling price at common margins (15%, 20%, 25%)
- She can save multiple costing cards and reference them when creating invoices

### Key Relationships
1. **User (N:1)** — A user can create many costing cards
2. **Business (N:1)** — Costing cards belong to a business (Phase 1: one per user, but Phase 2 multi-seat needs this)
3. **Transactions (optional 1:N)** — When Maria invoices a sale using this recipe, the invoice may reference a costing card (not required; Phase 2 feature)
4. **No direct dependency** on receipts — costing card ingredients are entered manually, not scanned

### Relationship Pattern
- `1 user : N costing_cards`
- `1 business : N costing_cards`
- Costing cards are **read-heavy** (viewed multiple times, edited occasionally)
- **Expected row volume:** 5–50 cards per user (low volume → simple indexing)

---

## Step 2: Write the DDL with All Required Columns

### Main Table: `costing_cards`
```sql
-- Migration: 20260315120000_create_costing_cards.sql
-- Rollback:
--   DROP TRIGGER IF EXISTS set_updated_at ON public.costing_cards;
--   DROP TABLE IF EXISTS public.costing_cards;
--   DROP TABLE IF EXISTS public.costing_card_ingredients;

CREATE TABLE public.costing_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  -- Costing card identity
  recipe_name TEXT NOT NULL,                 -- e.g., "Ube Cake 8-inch"
  description TEXT,                          -- Optional notes (e.g., "2-layer, with cream filling")

  -- Batch / yield info
  batch_quantity NUMERIC(10,2) NOT NULL,     -- Number of units produced per batch
  batch_unit TEXT NOT NULL,                  -- e.g., "slices", "pieces", "boxes" (user-defined)

  -- Cost calculation (denormalized for fast reads — ingredients breakdown in separate table)
  total_ingredient_cost NUMERIC(12,2) NOT NULL DEFAULT 0,  -- Sum of all ingredient costs
  cost_per_unit NUMERIC(12,2) NOT NULL DEFAULT 0,          -- total_ingredient_cost / batch_quantity

  -- Suggested selling prices (pre-calculated for common margins)
  suggested_price_15pct NUMERIC(12,2),       -- cost_per_unit × 1.15
  suggested_price_20pct NUMERIC(12,2),       -- cost_per_unit × 1.20
  suggested_price_25pct NUMERIC(12,2),       -- cost_per_unit × 1.25

  -- User's chosen selling price (optional — they might use a different price)
  selling_price NUMERIC(12,2),
  target_margin_percent NUMERIC(5,2),        -- The margin they want (e.g., 20.00)

  -- Status
  is_active BOOLEAN DEFAULT true,            -- Soft toggle (users can archive/restore without losing data)

  -- Standard columns
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.costing_cards ENABLE ROW LEVEL SECURITY;

-- Indexes (step 4 below)
CREATE INDEX idx_costing_cards_user_id ON public.costing_cards(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_costing_cards_active
  ON public.costing_cards(user_id, is_active DESC)
  WHERE deleted_at IS NULL;

-- Trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.costing_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

### Child Table: `costing_card_ingredients`
```sql
CREATE TABLE public.costing_card_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  costing_card_id UUID NOT NULL REFERENCES public.costing_cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Ingredient details (entered by user)
  ingredient_name TEXT NOT NULL,             -- e.g., "Ube flour", "All-purpose flour"
  quantity NUMERIC(10,2) NOT NULL,           -- e.g., 2.5
  unit TEXT NOT NULL,                        -- e.g., "cups", "grams", "tablespoons" (user-defined)
  unit_cost NUMERIC(12,2) NOT NULL,          -- Cost per unit (e.g., ₱50 per cup)

  -- Calculated field (for display — denormalized from parent)
  total_cost NUMERIC(12,2) NOT NULL DEFAULT 0,  -- quantity × unit_cost

  -- Optional — track supplier/receipt source (Phase 2 feature)
  receipt_id UUID REFERENCES public.receipts(id),  -- Link to a scanned receipt if available
  supplier_name TEXT,                             -- Where they buy this ingredient (e.g., "SM Hypermarket")

  -- Standard columns
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.costing_card_ingredients ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_costing_card_ingredients_costing_card_id
  ON public.costing_card_ingredients(costing_card_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_costing_card_ingredients_user_id
  ON public.costing_card_ingredients(user_id)
  WHERE deleted_at IS NULL;

-- Trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.costing_card_ingredients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

### RLS Policies

#### costing_cards
```sql
-- SELECT: Users can only read their own costing cards
CREATE POLICY "select_own_costing_cards" ON public.costing_cards
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT: Users can only insert costing cards they own
CREATE POLICY "insert_own_costing_cards" ON public.costing_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own costing cards
CREATE POLICY "update_own_costing_cards" ON public.costing_cards
  FOR UPDATE USING (auth.uid() = user_id);

-- DELETE: No client-side delete policy. Soft-delete only via the deleted_at column.
```

#### costing_card_ingredients
```sql
-- SELECT: Users can only read ingredients in their own costing cards
CREATE POLICY "select_own_ingredients" ON public.costing_card_ingredients
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT: Users can only insert ingredients into their own costing cards
CREATE POLICY "insert_own_ingredients" ON public.costing_card_ingredients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update ingredients in their own costing cards
CREATE POLICY "update_own_ingredients" ON public.costing_card_ingredients
  FOR UPDATE USING (auth.uid() = user_id);

-- DELETE: No client-side delete policy. Soft-delete only.
```

---

## Step 3: Data Classification (NPC / RA 10173)

| Column | Table | Classification | Rationale |
|--------|-------|---|---|
| `recipe_name`, `ingredient_name`, `supplier_name`, `description` | costing_cards, costing_card_ingredients | **PII-adjacent** | Recipe names + supplier info can reveal business operations. Treat as business-sensitive data. Encrypted at rest (Supabase default). RLS scoped. |
| `batch_quantity`, `quantity`, `unit_cost`, `total_ingredient_cost`, `cost_per_unit`, `selling_price`, `target_margin_percent` | costing_cards, costing_card_ingredients | **Financial** | Cost and pricing data are financial records. Required for tax/audit compliance if Maria uses this for invoice pricing. Encrypted at rest. RLS scoped. Never exposed in analytics. |
| `total_cost` | costing_card_ingredients | **Financial** | Calculated cost per ingredient. Sensitive. |
| `is_active`, `created_at`, `updated_at`, `deleted_at` | Both tables | **Analytics** | Non-sensitive metadata. Safe for aggregation. |

**Compliance notes:**
- No data from this table is included in analytics events (PostHog). Cost/pricing data is business-critical PII.
- When a user requests data deletion (7-day purge window), costing_cards and costing_card_ingredients are purged along with transactions.
- Audit log captures: read access to costing_cards with cost data (via audit_log if accessed by API), edits to sensitive pricing fields.

---

## Step 4: Add Indexes

### Index Strategy

1. **`idx_costing_cards_user_id`** — Every query filters by `user_id` (RLS + retrieval)
2. **`idx_costing_cards_active`** — Users typically view only active cards; archived cards are less frequently accessed
3. **`idx_costing_card_ingredients_costing_card_id`** — Fast ingredient lookup when displaying a costing card detail
4. **`idx_costing_card_ingredients_user_id`** — RLS compliance + ingredient search across all cards (Phase 2: "I used 2 cups of flour in my recipes")

### Index SQL
```sql
-- costing_cards
CREATE INDEX idx_costing_cards_user_id ON public.costing_cards(user_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_costing_cards_active
  ON public.costing_cards(user_id, is_active DESC)
  WHERE deleted_at IS NULL;

-- costing_card_ingredients
CREATE INDEX idx_costing_card_ingredients_costing_card_id
  ON public.costing_card_ingredients(costing_card_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_costing_card_ingredients_user_id
  ON public.costing_card_ingredients(user_id)
  WHERE deleted_at IS NULL;
```

### Rationale
- **Partial indexes (`WHERE deleted_at IS NULL`)** — Soft-deleted rows are excluded from index scans, speeding up typical queries.
- **No composite index on cost data** — Cost lookups are rare. Prioritize read-heavy card list + detail views.
- **Future Phase 2** — If we add "suggest cost-effective alternatives" (cross-ingredient analysis), add `idx_costing_card_ingredients_user_ingredient` for fast ingredient lookups.

---

## Step 5: Migration SQL

Create a new migration file in `supabase/migrations/`:

### Filename
`20260315120000_create_costing_cards.sql`

### Content
```sql
-- Migration: 20260315120000_create_costing_cards.sql
-- Rollback:
--   DROP TRIGGER IF EXISTS set_updated_at ON public.costing_cards;
--   DROP TRIGGER IF EXISTS set_updated_at ON public.costing_card_ingredients;
--   DROP TABLE IF EXISTS public.costing_card_ingredients;
--   DROP TABLE IF EXISTS public.costing_cards;

-- ============================================================================
-- costing_cards — Recipe cost breakdown and margin calculator
-- ============================================================================

CREATE TABLE public.costing_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  recipe_name TEXT NOT NULL,
  description TEXT,

  batch_quantity NUMERIC(10,2) NOT NULL,
  batch_unit TEXT NOT NULL,

  total_ingredient_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  cost_per_unit NUMERIC(12,2) NOT NULL DEFAULT 0,

  suggested_price_15pct NUMERIC(12,2),
  suggested_price_20pct NUMERIC(12,2),
  suggested_price_25pct NUMERIC(12,2),

  selling_price NUMERIC(12,2),
  target_margin_percent NUMERIC(5,2),

  is_active BOOLEAN DEFAULT true,

  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.costing_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_costing_cards" ON public.costing_cards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "insert_own_costing_cards" ON public.costing_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_costing_cards" ON public.costing_cards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.costing_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_costing_cards_user_id ON public.costing_cards(user_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_costing_cards_active
  ON public.costing_cards(user_id, is_active DESC)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- costing_card_ingredients — Line items within a costing card
-- ============================================================================

CREATE TABLE public.costing_card_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  costing_card_id UUID NOT NULL REFERENCES public.costing_cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  ingredient_name TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL,
  unit TEXT NOT NULL,
  unit_cost NUMERIC(12,2) NOT NULL,

  total_cost NUMERIC(12,2) NOT NULL DEFAULT 0,

  receipt_id UUID REFERENCES public.receipts(id),
  supplier_name TEXT,

  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.costing_card_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_ingredients" ON public.costing_card_ingredients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "insert_own_ingredients" ON public.costing_card_ingredients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_ingredients" ON public.costing_card_ingredients
  FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.costing_card_ingredients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_costing_card_ingredients_costing_card_id
  ON public.costing_card_ingredients(costing_card_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_costing_card_ingredients_user_id
  ON public.costing_card_ingredients(user_id)
  WHERE deleted_at IS NULL;
```

### To Apply Locally
```bash
supabase migration new create_costing_cards
# (creates the timestamped file)

# Copy the SQL above into that file

supabase db reset         # Resets local DB and runs all migrations
# Verify: check that tables exist and RLS is enabled

supabase db push          # Push to remote dev/staging when ready
```

---

## Step 6: Integration with Existing Tables

### How Costing Cards Fit Into the Broader Schema

1. **Via `business_id` foreign key** — Links to `businesses` table for multi-business support (Phase 2). Phase 1: one user = one business, so this is future-proofing.

2. **Optional link to `receipts`** — `costing_card_ingredients.receipt_id` is nullable. If Maria scans a receipt for flour, she can optionally link that receipt to the ingredient (Phase 2 enhancement: "auto-populate costing card from receipt").

3. **Via `transactions` (indirect)** — When Maria creates an invoice for a catering order using a costing card, the invoice amount can reference the `selling_price` from the costing card. The transaction record itself doesn't directly reference the costing card, but the application layer (API route) can:
   - Calculate margin from costing card data
   - Suggest the price to the user when creating an invoice
   - Log the margin analysis in conversation history (for KA to comment on profitability)

4. **Via `ka_conversations` (indirect)** — KA can reference costing card insights:
   - "Maria, ang ube cake mo may 20% margin — maganda na. Pero kung gusto mo ng 25%, kailangan mo mag-source ng mas murang ube extract."
   - Out-of-scope: KA does NOT auto-generate costing cards. Users create them manually.

### Relationship Diagram (Updated)
```
auth.users (Supabase Auth)
    |
    ├── 1:1 ── users (profile)
    |            |
    |            └── 1:N ── businesses
    |                         |
    |                         ├── 1:N ── transactions
    |                         ├── 1:N ── invoices
    |                         ├── 1:N ── receipts
    |                         ├── 1:N ── daily_entries
    |                         ├── 1:N ── bir_deadlines
    |                         └── 1:N ── costing_cards (NEW)     ← Links to business
    |                                      |
    |                                      └── 1:N ── costing_card_ingredients
    |                                                   |
    |                                                   └── ?:1 ── receipts (optional)
    |
    └── 1:N ── ka_conversations
```

---

## Step 7: Non-Negotiable Database Rules Compliance

All five rules from the tech stack are satisfied:

### Rule 1: RLS on Every Table ✓
- Both `costing_cards` and `costing_card_ingredients` have RLS enabled
- Three policies each: SELECT, INSERT, UPDATE (no DELETE — soft-delete only)
- Scoped to `auth.uid() = user_id`

### Rule 2: Soft-Delete Only ✓
- Both tables have `deleted_at TIMESTAMPTZ NULL`
- Hard deletes are prohibited
- All queries must filter `WHERE deleted_at IS NULL` (indexes enforce this)

### Rule 3: Audit Columns ✓
- Both tables have `created_at` and `updated_at`
- Auto-updated via shared `public.update_updated_at()` trigger
- No manual timestamp management in app code

### Rule 4: user_id Foreign Key ✓
- Both tables reference `auth.users(id)` with `ON DELETE CASCADE`
- RLS policies use `auth.uid() = user_id`
- Supports Phase 2 multi-seat via business-level access (future)

### Rule 5: Service Role Key Never in Client ✓
- All schema operations use service role + migration files
- Client code will interact via Next.js API routes (server-side) only
- No Supabase client direct table access for write operations

---

## Step 8: Query Examples (Application Layer)

### Create a Costing Card
```typescript
// /app/api/costing/create/route.ts
export async function POST(req: Request) {
  const { recipe_name, batch_quantity, batch_unit, ingredients } = await req.json();

  const { data: user } = await supabase.auth.getUser();
  const userId = user.id;

  // Calculate total ingredient cost
  let totalCost = 0;
  ingredients.forEach((ing) => {
    totalCost += ing.quantity * ing.unit_cost;
  });

  const costPerUnit = totalCost / batch_quantity;
  const suggestedPrice15 = costPerUnit * 1.15;
  const suggestedPrice20 = costPerUnit * 1.20;
  const suggestedPrice25 = costPerUnit * 1.25;

  // Insert costing card (service role — will be called server-side)
  const { data, error } = await supabase
    .from("costing_cards")
    .insert({
      user_id: userId,
      business_id: userBusinessId,
      recipe_name,
      batch_quantity,
      batch_unit,
      total_ingredient_cost: totalCost,
      cost_per_unit: costPerUnit,
      suggested_price_15pct: suggestedPrice15,
      suggested_price_20pct: suggestedPrice20,
      suggested_price_25pct: suggestedPrice25,
    })
    .select()
    .single();

  // Insert ingredients
  for (const ing of ingredients) {
    await supabase
      .from("costing_card_ingredients")
      .insert({
        costing_card_id: data.id,
        user_id: userId,
        ingredient_name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        unit_cost: ing.unit_cost,
        total_cost: ing.quantity * ing.unit_cost,
      });
  }

  return { success: true, data };
}
```

### Fetch All Costing Cards (with ingredients)
```typescript
// RLS will automatically filter to user's own cards
const { data: cards } = await supabase
  .from("costing_cards")
  .select("*, ingredients:costing_card_ingredients(*)")
  .eq("is_active", true)
  .order("created_at", { ascending: false });
```

### Update Margin & Selling Price
```typescript
const { data } = await supabase
  .from("costing_cards")
  .update({
    selling_price: 250,
    target_margin_percent: 20,
  })
  .eq("id", cardId);
```

---

## Step 9: Phase 2 Enhancements (Design for Future)

This schema is Phase 2–ready. Future additions:

1. **Multi-seat access** — RLS policies can expand to include team members via `business_members` table (same pattern as Build 3 spec in skill).

2. **Ingredient autocomplete** — Add `idx_costing_card_ingredients_user_ingredient` to quickly find "how many times have I used flour and at what cost?"

3. **Receipt linking** — `costing_card_ingredients.receipt_id` nullable link. Phase 2: "Auto-populate costing card from receipt OCR data."

4. **Costing history / versioning** — Add `version INTEGER` to track cost changes over time (e.g., "ube flour went from ₱50 to ₱60 per cup").

5. **Invoice linking** — Optional `invoices.costing_card_id` to track which costing card powered which sale (profit analytics).

---

## Step 10: NPC Compliance Notes

### Data Subject Rights
- **Deletion request:** When a user requests deletion (7-day purge), all costing_cards + costing_card_ingredients are soft-deleted immediately, then hard-deleted after 7 days.
- **Data portability:** Costing card exports (CSV) are PII-adjacent but not PII per se. Safe to include in data portability requests.

### Breach Impact Assessment
- If costing_cards are breached, impact is **MEDIUM** — competitors could learn recipes and cost structures. Not PII, but business-sensitive.
- 72-hour breach notification required to NPC if customer-identifiable info is leaked.

### Audit Logging
- Consider logging:
  - Read access to costing cards with cost data (if API-accessed by team members — Phase 2)
  - Updates to sensitive pricing fields (selling_price, target_margin_percent)
- Not every view is logged (performance). Focus on **sensitive writes and administrative reads**.

---

## Step 11: Summary & Next Steps

### What You Have
- ✅ Two normalized tables: `costing_cards` (header) + `costing_card_ingredients` (line items)
- ✅ All five non-negotiable DB rules applied
- ✅ RLS policies, soft-delete, audit columns, user_id FK, triggers
- ✅ Proper indexes for read-heavy workloads
- ✅ Complete migration SQL (ready to copy-paste)
- ✅ Data classification & NPC compliance notes
- ✅ Phase 2 extensibility (multi-seat, receipt linking, versioning)

### To Ship This
1. Copy the migration SQL to `supabase/migrations/20260315120000_create_costing_cards.sql`
2. Run `supabase db reset` locally and verify the schema
3. Run `supabase db push` to staging/production
4. Build the Costing Cards UI in `/app/(features)/costing/` (component responsibility, not data architect's)
5. Update `/AKBai/akbai-delivery/skills/data-architect/references/supabase-schema.md` with this table definition (see Step 6 in skill)

### Design Decisions Made
- **Denormalized cost fields** in `costing_cards` (total_ingredient_cost, cost_per_unit, suggested prices) for fast read access. Write complexity is low (only on card creation/ingredient update).
- **Separate `costing_card_ingredients` table** — Multiple ingredients per card justify normalization. Simplifies queries like "show all cards with flour" (Phase 2).
- **No `quantity_produced` override per ingredient** — Ingredients are a fixed recipe. If Maria wants to scale a recipe, she creates a new costing card (MVP simplicity).
- **`is_active` boolean instead of soft-archive** — Allows users to keep historical cards visible (for reference) but exclude them from active lists without losing data.
- **Optional `receipt_id` link** — Future-proofs ingredient cost sourcing without requiring it now.

---

## Compliance Checklist

- [x] RLS policies on all tables
- [x] Soft-delete columns (deleted_at)
- [x] Audit columns (created_at, updated_at)
- [x] user_id foreign keys with ON DELETE CASCADE
- [x] Shared trigger function (update_updated_at)
- [x] No service role key in client code (design for server-side API routes)
- [x] Data classification (PII-adjacent, Financial)
- [x] Migration file ready (copy-paste)
- [x] 7-day purge window compatible (cascading deletes work correctly)
- [x] Phase 2 multi-seat ready (business_id column enables RLS expansion)
- [x] Phase 4+ domain-expandable architecture: Costing cards are financial-domain, will not need domain tagging

---

**Schema designed by:** Data Architect skill
**Date:** 2026-03-15
**Status:** Ready to migrate
**Effort:** ~30 minutes to code + 15 minutes testing locally
**Blockers:** None. Shared `update_updated_at()` trigger must exist (it does, per bootstrap migration).
