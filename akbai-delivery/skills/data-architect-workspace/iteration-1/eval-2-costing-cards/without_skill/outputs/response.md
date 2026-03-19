# Costing Cards Schema Design — AKBai Build 7

## Overview
This document specifies the database schema for the **costing_cards** feature, enabling Maria and other MSME owners to calculate per-unit production costs and suggested selling prices for their products (ube cakes, sinigang, lumpia, etc.).

---

## Table Structure

### `costing_cards`

**Purpose:** Stores metadata and configuration for each costing card (product/recipe).

```sql
CREATE TABLE costing_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  -- Core product information
  product_name VARCHAR(255) NOT NULL,
  description TEXT,
  sku VARCHAR(100),
  unit_of_measure VARCHAR(50) NOT NULL DEFAULT 'piece', -- 'piece', 'kg', 'liter', 'pack', etc.

  -- Costing parameters
  batch_quantity DECIMAL(10, 2) NOT NULL, -- How many units this card produces per batch
  batch_unit_of_measure VARCHAR(50) NOT NULL DEFAULT 'piece', -- Unit for batch_quantity

  -- Cost breakdown (calculated)
  total_ingredients_cost DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_labor_cost DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_packaging_cost DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_utilities_cost DECIMAL(12, 2) NOT NULL DEFAULT 0, -- Gas, electricity per batch
  total_overhead_cost DECIMAL(12, 2) NOT NULL DEFAULT 0, -- Rent allocation, depreciation

  -- Per-unit calculations
  per_unit_total_cost DECIMAL(12, 4) NOT NULL DEFAULT 0, -- Total cost ÷ batch_quantity

  -- Pricing strategy
  desired_profit_margin_percent DECIMAL(5, 2) NOT NULL DEFAULT 30, -- Target margin %
  per_unit_suggested_price DECIMAL(12, 2) NOT NULL DEFAULT 0, -- With margin applied
  per_unit_minimum_price DECIMAL(12, 2), -- Floor price (optional, for reference)

  -- Status & metadata
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Audit columns (required per AKBai standards)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,

  -- Soft-delete constraint
  CONSTRAINT costing_cards_user_business_active_unique
    UNIQUE (user_id, business_id, product_name, deleted_at)
);

CREATE INDEX idx_costing_cards_user_id ON costing_cards(user_id);
CREATE INDEX idx_costing_cards_business_id ON costing_cards(business_id);
CREATE INDEX idx_costing_cards_deleted_at ON costing_cards(deleted_at);
```

---

### `costing_card_ingredients`

**Purpose:** Line items for each ingredient in a costing card.

```sql
CREATE TABLE costing_card_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  costing_card_id UUID NOT NULL REFERENCES public.costing_cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  -- Ingredient details
  ingredient_name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10, 4) NOT NULL, -- Amount used per batch
  unit_of_measure VARCHAR(50) NOT NULL, -- 'kg', 'g', 'cup', 'tbsp', 'liter', 'ml', 'piece', etc.

  -- Sourcing & cost
  cost_per_unit DECIMAL(12, 4) NOT NULL, -- Price per unit_of_measure
  currency VARCHAR(3) NOT NULL DEFAULT 'PHP',
  supplier VARCHAR(255), -- Optional: track where sourced (e.g., "Puregold", "Iloilo market")

  -- Cost subtotal
  ingredient_cost DECIMAL(12, 2) NOT NULL DEFAULT 0, -- quantity × cost_per_unit

  -- Tracking
  notes TEXT,
  last_price_update TIMESTAMP WITH TIME ZONE,

  -- Audit columns
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT costing_card_ingredients_unique
    UNIQUE (costing_card_id, ingredient_name, deleted_at)
);

CREATE INDEX idx_costing_card_ingredients_costing_card_id ON costing_card_ingredients(costing_card_id);
CREATE INDEX idx_costing_card_ingredients_user_id ON costing_card_ingredients(user_id);
```

---

### `costing_card_labor_entries`

**Purpose:** Track labor hours/rates applied to a costing card (optional, for detailed labor costing).

```sql
CREATE TABLE costing_card_labor_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  costing_card_id UUID NOT NULL REFERENCES public.costing_cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  -- Labor role & time
  labor_role VARCHAR(100) NOT NULL, -- 'mixing', 'baking', 'decorating', 'packing', 'owner labor'
  hours DECIMAL(5, 2) NOT NULL, -- Hours per batch
  hourly_rate DECIMAL(10, 2) NOT NULL, -- PHP/hour

  -- Cost subtotal
  labor_cost DECIMAL(12, 2) NOT NULL DEFAULT 0, -- hours × hourly_rate

  -- Metadata
  notes TEXT,

  -- Audit columns
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT costing_card_labor_entries_unique
    UNIQUE (costing_card_id, labor_role, deleted_at)
);

CREATE INDEX idx_costing_card_labor_entries_costing_card_id ON costing_card_labor_entries(costing_card_id);
CREATE INDEX idx_costing_card_labor_entries_user_id ON costing_card_labor_entries(user_id);
```

---

### `costing_card_packaging`

**Purpose:** Track packaging materials and costs per unit.

```sql
CREATE TABLE costing_card_packaging (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  costing_card_id UUID NOT NULL REFERENCES public.costing_cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  -- Packaging item
  item_name VARCHAR(255) NOT NULL, -- 'box', 'label', 'tissue', 'ribbon', 'sticker', 'bubble wrap'
  quantity_per_unit DECIMAL(10, 4) NOT NULL, -- How many per product unit
  unit_of_measure VARCHAR(50) NOT NULL, -- 'piece', 'meter', 'sheet', etc.

  -- Cost
  cost_per_unit DECIMAL(12, 4) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'PHP',
  supplier VARCHAR(255),

  -- Cost subtotal
  packaging_cost DECIMAL(12, 2) NOT NULL DEFAULT 0, -- quantity_per_unit × cost_per_unit

  -- Metadata
  notes TEXT,
  last_price_update TIMESTAMP WITH TIME ZONE,

  -- Audit columns
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT costing_card_packaging_unique
    UNIQUE (costing_card_id, item_name, deleted_at)
);

CREATE INDEX idx_costing_card_packaging_costing_card_id ON costing_card_packaging(costing_card_id);
CREATE INDEX idx_costing_card_packaging_user_id ON costing_card_packaging(user_id);
```

---

### `costing_card_overheads`

**Purpose:** Allocate fixed overhead costs to specific costing cards.

```sql
CREATE TABLE costing_card_overheads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  costing_card_id UUID NOT NULL REFERENCES public.costing_cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  -- Overhead item
  overhead_name VARCHAR(255) NOT NULL, -- 'rent allocation', 'depreciation', 'utilities', 'insurance'
  allocation_method VARCHAR(50) NOT NULL, -- 'per_batch', 'per_unit', 'percentage', 'fixed_amount'

  -- Amount
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'PHP',

  -- Frequency (optional, for tracking annually allocated costs)
  frequency VARCHAR(50), -- 'monthly', 'quarterly', 'yearly'

  -- Allocation basis (for reference)
  allocation_basis TEXT, -- e.g., "rent (₱3000/mo ÷ 3 products)"

  -- Metadata
  notes TEXT,

  -- Audit columns
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT costing_card_overheads_unique
    UNIQUE (costing_card_id, overhead_name, deleted_at)
);

CREATE INDEX idx_costing_card_overheads_costing_card_id ON costing_card_overheads(costing_card_id);
CREATE INDEX idx_costing_card_overheads_user_id ON costing_card_overheads(user_id);
```

---

## Row-Level Security (RLS) Policies

All costing tables must enforce user- and business-scoped access:

```sql
-- costing_cards RLS
ALTER TABLE costing_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own costing cards"
  ON costing_cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own costing cards"
  ON costing_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own costing cards"
  ON costing_cards FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own costing cards"
  ON costing_cards FOR DELETE
  USING (auth.uid() = user_id);

-- Apply same pattern to dependent tables (costing_card_ingredients, etc.)
-- Each must have: user_id check, and validate business_id matches auth.uid()
```

---

## Relationships & Integrity

### Foreign Key Hierarchy
```
users (auth.users)
  ├─ businesses
  │   ├─ costing_cards
  │   │   ├─ costing_card_ingredients
  │   │   ├─ costing_card_labor_entries
  │   │   ├─ costing_card_packaging
  │   │   └─ costing_card_overheads
  │   ├─ transactions
  │   ├─ receipts
  │   └─ invoices
```

### Data Consistency Rules
1. **Cascading deletes** on costing_cards cascade to all child tables (ingredients, labor, packaging, overheads).
2. **Soft deletes** via `deleted_at` ensure audit trail; hard deletes should not be used.
3. **Unique constraints** on product_name per user+business combo (ignoring soft-deleted records).
4. **Cost recalculation** trigger: When any ingredient/labor/packaging/overhead record is updated, `costing_cards.total_*_cost` and `per_unit_total_cost` must be recalculated.

---

## Application Logic (Next.js Service Layer)

### Calculation Flow
1. **User inputs:**
   - Product name, batch quantity, ingredients (with quantities and costs)
   - Optional: labor hours/rates, packaging, overhead allocations
   - Desired profit margin %

2. **System calculates (server-side):**
   ```
   total_ingredients_cost = SUM(ingredient_cost) for all ingredients
   total_labor_cost = SUM(labor_cost) for all labor entries
   total_packaging_cost = SUM(packaging_cost) for all packaging items
   total_utilities_cost = user-provided or sum of utility overhead rows
   total_overhead_cost = SUM(overhead) for allocated overheads

   per_unit_total_cost = (total_ingredients + labor + packaging + utilities + overhead) ÷ batch_quantity

   per_unit_suggested_price = per_unit_total_cost × (1 + desired_profit_margin_percent / 100)
   ```

3. **Maria's workflow (UI):**
   - Create new costing card for "Ube Cake"
   - Add 5 ingredients (flour ₱150, ube essence ₱200, eggs ₱90, etc.)
   - Add 2 hours labor @ ₱100/hr = ₱200
   - Add packaging (box ₱15, label ₱5)
   - Allocate ₱10 utilities per batch
   - Set profit margin: 35%
   - **System shows:** Per-unit cost ₱XX, suggested selling price ₱YY

---

## Integration with Existing AKBai Tables

### `transactions` → `costing_cards`
- When Maria sells a costing card product, the transaction references the costing_card_id (optional, for tracking).
- Enables linking actual revenue to calculated costs for profit margin validation.

```sql
-- Optional enhancement to transactions table:
ALTER TABLE transactions ADD COLUMN costing_card_id UUID REFERENCES public.costing_cards(id);
```

### `receipts` → Ingredient Updates
- When Maria scans a receipt (existing feature), the system can suggest matching ingredients in active costing cards.
- Enables real-world cost validation ("Did flour price change? Update your costing card.").

---

## Audit & Reporting

### Timestamps
- `created_at`: When the costing card was first created.
- `updated_at`: Last modification (triggers on ingredient, labor, packaging, overhead changes).
- `deleted_at`: Soft-delete marker; NULL = active record.

### Queries for Maria
1. **Active costing cards:** `SELECT * FROM costing_cards WHERE user_id = $1 AND deleted_at IS NULL`
2. **Cost breakdown for a card:** Join with ingredients, labor, packaging, overheads tables.
3. **Price comparison:** Show per-unit cost vs. actual transaction prices over time.

---

## Migration Strategy (Supabase SQL)

**Step 1:** Create costing_cards table
**Step 2:** Create dependent tables (ingredients, labor, packaging, overheads)
**Step 3:** Enable RLS and create policies
**Step 4:** Add trigger for cost recalculation
**Step 5:** (Optional) Add costing_card_id to transactions table for linking

---

## Notes & Considerations

1. **Currency:** Hardcoded to PHP; extend to ENUM if multi-currency support needed later.
2. **Profit margin:** Stored as a decimal (e.g., 35 for 35%); UI must handle % display.
3. **Batch quantity:** Flexible (e.g., "10 pieces", "1kg batch"); batch_unit_of_measure allows tracking.
4. **Price history:** Not currently tracked. If needed, add a `costing_card_price_history` table with versioning.
5. **Scalability:** All indexes support filtering by user_id and business_id for multi-tenant performance.

---

## Summary

The costing_cards schema provides Maria with a comprehensive, flexible way to calculate product costs and pricing. It integrates seamlessly with AKBai's existing audit standards (RLS, soft-delete, timestamps) and supports detailed cost breakdowns (ingredients, labor, packaging, overhead). The modular table structure allows for easy extension (e.g., seasonal adjustments, supplier tracking, recipe versions).
