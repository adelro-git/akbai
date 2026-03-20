---
name: Supabase Schema Viewer & Manager
description: View, modify, validate Supabase schema. Commands — view [table], add [table], migrate [change], validate. Ensure RLS, soft-delete, audit columns, user_id FK on every table. Tagging — schema, DDL, database, RLS, migration, Supabase
trigger: /schema
skills: data-architect
---

# Supabase Schema Viewer & Manager

Before Starting
- Read `/AKBai/akbai-delivery/shared/tech-stack.md` — focus on Database section (Supabase rules, RLS pattern, core tables list)
- Read `/AKBai/akbai-delivery/shared/gap-registry.md` — data-related gaps (D5: backup strategy, D2: webhook idempotency)
- Read `/AKBai/akbai-delivery/shared/glossary.md` — technical terms (RLS, soft-delete, audit columns, user_id FK, 4-Layer data isolation)

---

## Purpose

This skill manages the AKBai Supabase schema end-to-end. It enforces **5 non-negotiable Supabase rules** on every table:

1. **RLS on every table** — Row-level security policies scoped to `auth.uid() = user_id`
2. **Soft-delete only** — Every table has `deleted_at TIMESTAMPTZ NULL`, never hard-delete
3. **Audit columns** — Every table has `created_at` and `updated_at` (auto-updated via trigger)
4. **user_id FK** — Every user-owned table references `auth.users(id)` with cascade behavior
5. **NPC compliance** — PII columns flagged, encryption-at-rest, retention policies noted

The skill also maintains **4-Layer Data Isolation** (RLS + user-scoped system prompt + conversation isolation + profile versioning) as a pre-launch design gate.

---

## Workflow

### Action: `view [table]`

Display current DDL for specified table(s) with full RLS policies, indexes, relationships, and compliance notes.

**Execution:**
1. Request table name(s) from user (e.g., `view transactions` or `view users, transactions`)
2. Query Supabase schema information (via PostgreSQL `information_schema`):
   ```sql
   SELECT
     c.column_name,
     c.data_type,
     c.is_nullable,
     c.column_default,
     tc.constraint_type
   FROM information_schema.columns c
   LEFT JOIN information_schema.key_column_usage kcu USING (table_name, column_name)
   LEFT JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
   WHERE c.table_name = '[table]'
   ORDER BY c.ordinal_position;
   ```
3. Fetch RLS policies:
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
   FROM pg_policies
   WHERE tablename = '[table]'
   ORDER BY policyname;
   ```
4. Fetch indexes:
   ```sql
   SELECT indexname, indexdef
   FROM pg_indexes
   WHERE tablename = '[table]'
   ORDER BY indexname;
   ```
5. Output in readable format:

```
TABLE: transactions
═══════════════════════════════════════════════════════════════════

COLUMNS:
─────────────
id                 | uuid         | NOT NULL | PRIMARY KEY
user_id            | uuid         | NOT NULL | FK → auth.users(id)
business_id        | uuid         | NOT NULL | FK → businesses(id)
amount_cents       | integer      | NOT NULL | (in centavos)
category           | text         | NOT NULL | e.g., 'expense', 'income'
created_at         | timestamptz  | NOT NULL | DEFAULT now()
updated_at         | timestamptz  | NOT NULL | DEFAULT now() + trigger
deleted_at         | timestamptz  | NULL     | Soft-delete marker

RLS POLICIES:
─────────────
[policy_name]      | FOR [SELECT/INSERT/UPDATE/DELETE]
  USING: auth.uid() = user_id
  WITH CHECK: auth.uid() = user_id

INDEXES:
─────────
transactions_user_id_idx         | ON (user_id)
transactions_business_id_idx     | ON (business_id)
transactions_created_at_idx      | ON (created_at DESC)
transactions_deleted_at_idx      | ON (deleted_at) WHERE deleted_at IS NULL

RELATIONSHIPS:
──────────────
← users (user_id FK)
← businesses (business_id FK)
← receipts (transaction_id FK)

COMPLIANCE:
───────────
✓ RLS: 3 policies (SELECT, INSERT, UPDATE/DELETE combined)
✓ Soft-delete: deleted_at column present
✓ Audit columns: created_at, updated_at with auto-update trigger
✓ user_id FK: Present, ON DELETE CASCADE
⚠ PII: None (financial data encrypted at Supabase level)
✓ Retention: 7-year retention per BIR, implemented via scheduled job

NOTES:
──────
All amount fields stored as integers (centavos). Division by 100 at display layer only.
Soft-deleted rows hidden from all queries via deleted_at IS NULL filter.
```

---

### Action: `add [table]`

Design and output DDL for a new table with full compliance.

**Execution:**
1. Gather requirements from user:
   - Table name (snake_case, plural preferred)
   - Purpose (what business data does it store?)
   - User-scoped? (does every row belong to a user? → require user_id FK)
   - PII present? (if yes, which columns? → flag for encryption-at-rest)
   - Relationships (FK to which tables?)
   - Indexes needed (on which columns for query performance?)

2. Generate table scaffold:

```sql
-- Create new table: [table_name]
CREATE TABLE [table_name] (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys (if user-scoped)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Business columns
  -- [Define columns here based on requirements]

  -- Audit columns (required on all tables)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Soft-delete column (required on all tables)
  deleted_at TIMESTAMPTZ NULL
);

-- Enable RLS
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

-- RLS policy: Users can read own rows
CREATE POLICY "Users can read own [table_name]"
  ON [table_name]
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS policy: Users can insert own rows
CREATE POLICY "Users can insert own [table_name]"
  ON [table_name]
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS policy: Users can update own rows (also covers DELETE via soft-delete)
CREATE POLICY "Users can update own [table_name]"
  ON [table_name]
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes for query performance
CREATE INDEX [table_name]_user_id_idx ON [table_name](user_id);
CREATE INDEX [table_name]_created_at_idx ON [table_name](created_at DESC);
CREATE INDEX [table_name]_deleted_at_idx ON [table_name](deleted_at) WHERE deleted_at IS NULL;

-- Create trigger for auto-update of updated_at
CREATE TRIGGER [table_name]_updated_at_trigger
  BEFORE UPDATE ON [table_name]
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);

-- Grant permissions
GRANT ALL ON [table_name] TO authenticated;
```

3. Validate against the 5 rules:
   - ✓ RLS: 3 policies (SELECT, INSERT, UPDATE) all scoped to `user_id`
   - ✓ Soft-delete: `deleted_at` column present
   - ✓ Audit columns: `created_at`, `updated_at` with trigger
   - ✓ user_id FK: Present with ON DELETE CASCADE
   - ✓ NPC compliance: PII columns noted

4. Output DDL + compliance checklist

5. **Next step:** Suggest migration file format (see `migrate` action below)

---

### Action: `migrate [change]`

Generate migration SQL for schema changes (ALTER, RLS updates, index changes) with rollback statements.

**Execution:**
1. Gather change request:
   - Table(s) affected
   - Type of change: Add column? Modify constraint? Add index? Update RLS policy?
   - Rationale (why this change?)

2. Generate timestamped migration file (`YYYYMMDDHHMMSS_description.sql`):

```sql
-- Migration: [YYYYMMDDHHMMSS]_[description].sql
-- Author: [skill name]
-- Date: [ISO 8601 timestamp]
-- Description: [What is changing and why?]

-- ============================================================================
-- FORWARD MIGRATION
-- ============================================================================

-- Add new column to transactions table
ALTER TABLE transactions
ADD COLUMN notes TEXT NULL,
ADD COLUMN flag_for_review BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index on new column
CREATE INDEX transactions_flag_for_review_idx ON transactions(flag_for_review) WHERE deleted_at IS NULL;

-- Add RLS policy for admin review queue
CREATE POLICY "Admins can read flagged transactions"
  ON transactions
  FOR SELECT
  USING (
    flag_for_review = TRUE
    AND (auth.uid()::text = current_setting('app.admin_user') OR auth.role() = 'service_role')
  );

-- ============================================================================
-- VALIDATION CHECK
-- ============================================================================

SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'transactions'
  AND column_name IN ('notes', 'flag_for_review');

-- ============================================================================
-- ROLLBACK MIGRATION
-- ============================================================================

-- Revert: Remove columns and index
DROP POLICY IF EXISTS "Admins can read flagged transactions" ON transactions;
DROP INDEX IF EXISTS transactions_flag_for_review_idx;
ALTER TABLE transactions
DROP COLUMN IF EXISTS notes,
DROP COLUMN IF EXISTS flag_for_review;
```

3. **Validation rules:**
   - If adding a column to a user-scoped table, ensure it's nullable or has a sensible DEFAULT
   - If modifying RLS, test the new policy against auth scenarios (authenticated user, service role, public)
   - If adding an index, ensure it filters by `deleted_at IS NULL` to avoid dead rows

4. Output:
   - Migration file (copy-paste ready)
   - Validation queries (to run before/after)
   - Rollback statement (for safety)
   - Estimated downtime (if table is large, ALTER may lock)

---

### Action: `validate`

Audit current schema against 5 rules + NPC compliance + 4-Layer isolation.

**Execution:**
1. Scan all user-facing tables in Supabase:
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```

2. For each table, check:

   **Rule 1: RLS present?**
   ```sql
   SELECT schemaname, tablename, policyname
   FROM pg_policies
   WHERE tablename = '[table]'
   LIMIT 1;
   ```
   - ✓ PASS: ≥1 policy exists for each operation (SELECT, INSERT, UPDATE)
   - ✗ FAIL: No policies → red flag, add RLS immediately

   **Rule 2: Soft-delete column?**
   ```sql
   SELECT column_name
   FROM information_schema.columns
   WHERE table_name = '[table]' AND column_name = 'deleted_at';
   ```
   - ✓ PASS: `deleted_at TIMESTAMPTZ NULL` exists
   - ✗ FAIL: Missing → migration needed

   **Rule 3: Audit columns?**
   ```sql
   SELECT column_name
   FROM information_schema.columns
   WHERE table_name = '[table]'
   AND column_name IN ('created_at', 'updated_at');
   ```
   - ✓ PASS: Both present
   - ⚠ WARN: Only one present → check for auto-update trigger

   **Rule 4: user_id FK?**
   ```sql
   SELECT constraint_name, column_name, referenced_table_name
   FROM information_schema.referential_constraints rc
   JOIN information_schema.key_column_usage kcu ON rc.constraint_name = kcu.constraint_name
   WHERE kcu.table_name = '[table]' AND kcu.column_name = 'user_id';
   ```
   - ✓ PASS: FK exists, ON DELETE CASCADE
   - ✗ FAIL: Missing user_id FK on user-scoped table → data isolation broken

   **Rule 5: NPC Compliance?**
   - PII columns (name, email, phone, business_name) encrypted at rest? (Supabase standard)
   - Retention policy documented? (e.g., "Delete after 1 year of inactivity")

3. Generate compliance report:

```
SCHEMA VALIDATION REPORT
═══════════════════════════════════════════════════════════════════
Date: [ISO 8601]
Environment: [prod/staging]

RULE COMPLIANCE:
─────────────────
Rule 1 (RLS on all tables):        [6 PASS] [0 FAIL] → ✓ GREEN
Rule 2 (Soft-delete on all):       [6 PASS] [0 FAIL] → ✓ GREEN
Rule 3 (Audit columns):            [6 PASS] [0 FAIL] → ✓ GREEN
Rule 4 (user_id FK user-scoped):   [5 PASS] [0 FAIL] → ✓ GREEN
Rule 5 (NPC Compliance):           [PASS] PII encrypted, retention policy documented

OVERALL: ✓ ALL RULES PASS — READY FOR PRODUCTION

CRITICAL ISSUES:
─────────────────
(none)

WARNINGS:
──────────
⚠ daily_api_spend table missing deleted_at index optimization
  → Recommendation: Add index on (deleted_at) WHERE deleted_at IS NULL for faster soft-delete queries

AUDIT TRAIL:
─────────────
Last validation: [previous date]
Last schema change: [previous date/migration]
Service role key exposure scan: ✓ PASS (no NEXT_PUBLIC_ keys in schema)

NPC COMPLIANCE CHECKLIST:
────────────────────────
✓ RLS on all user-scoped tables (data isolation)
✓ soft-delete implemented (data restoration capability)
✓ audit columns present (audit trail)
✓ PII column encryption enforced at Supabase level
✓ retention policy documented (see retention_policy table)
```

4. If any FAIL found:
   - List affected table(s) and rule(s)
   - Suggest migration to fix
   - Estimate effort (hours)

---

## Core Tables Reference (14 Total)

From tech-stack.md:

| Table | Purpose | User-Scoped | PII | Key Columns |
|-------|---------|-------------|-----|-------------|
| **users** | User profile mirror + business info | ✓ | name, email | user_id, business_name, business_type, bir_registration |
| **businesses** | Business details per user | ✓ | name | user_id, business_type, bir_cor_number |
| **transactions** | All income/expense records | ✓ | (financial) | user_id, amount_cents, category, created_at |
| **receipts** | Scanned receipt metadata | ✓ | (financial) | user_id, transaction_id, s3_path, ocr_confidence |
| **invoices** | Invoice records | ✓ | (financial) | user_id, amount_cents, invoice_number, due_date |
| **bir_deadlines** | BIR filing schedule | ✓ | (none) | user_id, deadline_date, filing_type, status |
| **ka_conversations** | KA chat history | ✓ | (none) | user_id, message_text, role, domain |
| **subscriptions** | Xendit subscription state | ✓ | (none) | user_id, tier, status, renewal_date |
| **daily_entries** | Daily check-in records | ✓ | (none) | user_id, entry_date, sales_cents, expenses_cents |
| **webhook_events** | Idempotency table | (no) | (none) | payment_id, event_type, timestamp |
| **daily_api_spend** | Circuit breaker tracking | ✓ | (none) | user_id, spend_cents, date |
| **audit_log** | System-wide audit trail | (no) | (some) | table_name, action, record_id, user_id, timestamp |
| **redirect_logs** | Out-of-scope query logging | ✓ | (none) | user_id, query_text, category, timestamp |
| **cost_cards** | Ingredient costing (Build 8) | ✓ | (none) | user_id, item_name, cost_cents |

---

## Cross-Skill Delegation

- **Hand off to `/fullstack-engineer` skill** if DDL changes require app-layer schema migration (e.g., Zod validation updates)
- **Hand off to `/devops-engineer` skill** if migration requires zero-downtime deployment or data backfill
- **Hand off to `/security-compliance` skill** if PII handling or encryption-at-rest changes

---

## Key Outputs

1. **Table DDL** (copy-paste ready SQL)
2. **RLS policies** (complete, scoped to user_id)
3. **Migration file** (timestamped, with rollback)
4. **Compliance checklist** (RLS, soft-delete, audit, user_id FK, NPC)
5. **Cross-reference to data-flows.md** (if available)

---

## Notes

- **Service role key never in client:** All schema operations (INSERT, UPDATE, DELETE) via authenticated user RLS, never via service role in browser code
- **Money in centavos:** All monetary columns are integers (₱34.50 = 3450). UI conversion happens at display layer only
- **Timezone awareness:** All timestamps stored in UTC. Display conversion to Asia/Manila happens in app layer (See tech-stack.md §A3 timezone enforcement)
- **Soft-delete queries:** Always filter with `WHERE deleted_at IS NULL` in app queries. Use indexes on `(deleted_at) WHERE deleted_at IS NULL` to optimize
- **Profile versioning:** transactions table triggers `profile_version` increment on business info updates — required for Phase 4+ domain-expandable architecture
