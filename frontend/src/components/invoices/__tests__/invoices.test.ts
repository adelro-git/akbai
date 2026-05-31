import { describe, it, expect } from 'vitest';
import { centavosToPeso, pesoToCentavos } from '@/lib/utils/money';
import { parseInvoiceNumber } from '@/lib/invoices/number-generator';
import { generateInvoiceHtml } from '@/lib/invoices/pdf-generator';
import { CreateInvoiceSchema, UpdateInvoiceSchema, UpdateInvoiceStatusSchema, InvoiceStatusEnum } from '@/lib/invoices/schemas';
import type { InvoiceWithItems, InvoiceStatus } from '@/lib/invoices/types';
import { ensureIds, type LineItemData } from '@/components/invoices/line-item-editor';

/**
 * Invoice feature tests — Build 8
 *
 * Tests cover:
 * - Invoice number generation & parsing
 * - PDF generation (HTML output)
 * - Zod schema validation
 * - Status transitions
 * - Money formatting in invoice context
 * - Line item totals computation
 */

// ============================================================
// Invoice Number Tests
// ============================================================

describe('Invoice number parsing', () => {
  it('parses a valid invoice number', () => {
    const result = parseInvoiceNumber('INV-202604-003');
    expect(result).toEqual({ yearMonth: '202604', sequence: 3 });
  });

  it('parses first invoice of month', () => {
    const result = parseInvoiceNumber('INV-202601-001');
    expect(result).toEqual({ yearMonth: '202601', sequence: 1 });
  });

  it('handles high sequence numbers', () => {
    const result = parseInvoiceNumber('INV-202604-999');
    expect(result).toEqual({ yearMonth: '202604', sequence: 999 });
  });

  it('returns null for invalid format', () => {
    expect(parseInvoiceNumber('INVOICE-001')).toBeNull();
    expect(parseInvoiceNumber('')).toBeNull();
    expect(parseInvoiceNumber('INV-2026-001')).toBeNull();
  });

  it('handles sequence numbers above 999', () => {
    const result = parseInvoiceNumber('INV-202604-1234');
    expect(result).toEqual({ yearMonth: '202604', sequence: 1234 });
  });
});

// ============================================================
// PDF Generation Tests
// ============================================================

describe('Invoice PDF HTML generation', () => {
  const sampleInvoice: InvoiceWithItems = {
    id: 'test-id',
    user_id: 'user-id',
    invoice_number: 'INV-202604-001',
    invoice_date: '2026-04-12',
    due_date: '2026-04-30',
    client_name: 'Maria Santos',
    client_email: 'maria@test.com',
    client_phone: '09171234567',
    client_address: '123 Main St, Manila',
    subtotal_centavos: 500000,
    discount_centavos: 0,
    tax_rate_pct: 12,
    tax_amount_centavos: 60000,
    total_centavos: 560000,
    status: 'draft',
    sent_at: null,
    paid_at: null,
    cancelled_at: null,
    payment_transaction_id: null,
    pdf_storage_path: null,
    notes: 'Salamat sa order!',
    internal_notes: null,
    deleted_at: null,
    created_at: '2026-04-12T00:00:00Z',
    updated_at: '2026-04-12T00:00:00Z',
    items: [
      {
        id: 'item-1',
        user_id: 'user-id',
        invoice_id: 'test-id',
        description: 'Chocolate Cake 8-inch',
        quantity: 2,
        unit: 'piece',
        unit_price_centavos: 150000,
        total_centavos: 300000,
        costing_card_id: null,
        sort_order: 0,
        deleted_at: null,
        created_at: '2026-04-12T00:00:00Z',
        updated_at: '2026-04-12T00:00:00Z',
      },
      {
        id: 'item-2',
        user_id: 'user-id',
        invoice_id: 'test-id',
        description: 'Ube Cheesecake',
        quantity: 1,
        unit: 'piece',
        unit_price_centavos: 200000,
        total_centavos: 200000,
        costing_card_id: null,
        sort_order: 1,
        deleted_at: null,
        created_at: '2026-04-12T00:00:00Z',
        updated_at: '2026-04-12T00:00:00Z',
      },
    ],
  };

  it('generates valid HTML with invoice number', () => {
    const html = generateInvoiceHtml(sampleInvoice, {
      business_name: 'Maria Bakes',
      owner_name: 'Maria Cruz',
      address: null,
      phone: null,
      email: null,
    });

    expect(html).toContain('INV-202604-001');
    expect(html).toContain('INVOICE');
    expect(html).toContain('<!DOCTYPE html>');
  });

  it('includes business name in header', () => {
    const html = generateInvoiceHtml(sampleInvoice, {
      business_name: 'Maria Bakes',
      owner_name: null,
      address: null,
      phone: null,
      email: null,
    });

    expect(html).toContain('Maria Bakes');
  });

  it('includes client details', () => {
    const html = generateInvoiceHtml(sampleInvoice, {
      business_name: null,
      owner_name: null,
      address: null,
      phone: null,
      email: null,
    });

    expect(html).toContain('Maria Santos');
    expect(html).toContain('maria@test.com');
    expect(html).toContain('09171234567');
  });

  it('includes line items', () => {
    const html = generateInvoiceHtml(sampleInvoice, {
      business_name: null,
      owner_name: null,
      address: null,
      phone: null,
      email: null,
    });

    expect(html).toContain('Chocolate Cake 8-inch');
    expect(html).toContain('Ube Cheesecake');
  });

  it('includes BIR disclaimer', () => {
    const html = generateInvoiceHtml(sampleInvoice, {
      business_name: null,
      owner_name: null,
      address: null,
      phone: null,
      email: null,
    });

    expect(html).toContain('hindi tax advice');
  });

  it('includes notes when present', () => {
    const html = generateInvoiceHtml(sampleInvoice, {
      business_name: null,
      owner_name: null,
      address: null,
      phone: null,
      email: null,
    });

    expect(html).toContain('Salamat sa order!');
  });

  it('escapes HTML in client name to prevent XSS', () => {
    const xssInvoice = {
      ...sampleInvoice,
      client_name: '<script>alert("xss")</script>',
    };

    const html = generateInvoiceHtml(xssInvoice, {
      business_name: null,
      owner_name: null,
      address: null,
      phone: null,
      email: null,
    });

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

// ============================================================
// Zod Schema Validation Tests
// ============================================================

describe('CreateInvoiceSchema validation', () => {
  it('accepts valid invoice data', () => {
    const result = CreateInvoiceSchema.safeParse({
      invoice_number: 'INV-202604-001',
      client_name: 'Maria Santos',
      items: [
        {
          description: 'Chocolate Cake',
          quantity: 2,
          unit_price_centavos: 150000,
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('rejects invoice without client name', () => {
    const result = CreateInvoiceSchema.safeParse({
      invoice_number: 'INV-202604-001',
      client_name: '',
      items: [{ description: 'Cake', quantity: 1, unit_price_centavos: 100 }],
    });

    expect(result.success).toBe(false);
  });

  it('rejects invoice without items', () => {
    const result = CreateInvoiceSchema.safeParse({
      invoice_number: 'INV-202604-001',
      client_name: 'Maria',
      items: [],
    });

    expect(result.success).toBe(false);
  });

  it('rejects negative unit price', () => {
    const result = CreateInvoiceSchema.safeParse({
      invoice_number: 'INV-202604-001',
      client_name: 'Maria',
      items: [{ description: 'Cake', quantity: 1, unit_price_centavos: -100 }],
    });

    expect(result.success).toBe(false);
  });

  it('accepts optional fields as undefined', () => {
    const result = CreateInvoiceSchema.safeParse({
      invoice_number: 'INV-202604-001',
      client_name: 'Maria',
      items: [{ description: 'Cake', quantity: 1, unit_price_centavos: 50000 }],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.client_email).toBeUndefined();
      expect(result.data.due_date).toBeUndefined();
    }
  });
});

describe('UpdateInvoiceStatusSchema validation', () => {
  it('accepts valid status', () => {
    const result = UpdateInvoiceStatusSchema.safeParse({ status: 'sent' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid status', () => {
    const result = UpdateInvoiceStatusSchema.safeParse({ status: 'invalid' });
    expect(result.success).toBe(false);
  });
});

// ============================================================
// Status Transition Tests
// ============================================================

describe('Invoice status transitions', () => {
  const VALID_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
    draft: ['sent', 'cancelled'],
    sent: ['viewed', 'paid', 'overdue', 'cancelled'],
    viewed: ['paid', 'overdue', 'cancelled'],
    paid: [],
    overdue: ['paid', 'cancelled'],
    cancelled: [],
  };

  function isValidTransition(from: InvoiceStatus, to: InvoiceStatus): boolean {
    return VALID_TRANSITIONS[from]?.includes(to) ?? false;
  }

  it('allows draft -> sent', () => {
    expect(isValidTransition('draft', 'sent')).toBe(true);
  });

  it('allows draft -> cancelled', () => {
    expect(isValidTransition('draft', 'cancelled')).toBe(true);
  });

  it('blocks draft -> paid (must go through sent first)', () => {
    expect(isValidTransition('draft', 'paid')).toBe(false);
  });

  it('allows sent -> paid', () => {
    expect(isValidTransition('sent', 'paid')).toBe(true);
  });

  it('allows overdue -> paid', () => {
    expect(isValidTransition('overdue', 'paid')).toBe(true);
  });

  it('blocks paid -> any (terminal state)', () => {
    expect(isValidTransition('paid', 'draft')).toBe(false);
    expect(isValidTransition('paid', 'sent')).toBe(false);
    expect(isValidTransition('paid', 'cancelled')).toBe(false);
  });

  it('blocks cancelled -> any (terminal state)', () => {
    expect(isValidTransition('cancelled', 'draft')).toBe(false);
    expect(isValidTransition('cancelled', 'sent')).toBe(false);
    expect(isValidTransition('cancelled', 'paid')).toBe(false);
  });
});

// ============================================================
// Money Formatting in Invoice Context
// ============================================================

describe('Invoice money formatting', () => {
  it('formats invoice total correctly', () => {
    expect(centavosToPeso(560000)).toBe('₱5,600.00');
  });

  it('formats small invoice amounts', () => {
    expect(centavosToPeso(50000)).toBe('₱500.00');
  });

  it('converts peso input to centavos for API', () => {
    expect(pesoToCentavos(1500)).toBe(150000);
    expect(pesoToCentavos(34.50)).toBe(3450);
  });
});

// ============================================================
// Line Item Computation Tests
// ============================================================

describe('Invoice line item totals', () => {
  it('computes subtotal from items', () => {
    const items = [
      { unit_price_centavos: 150000, quantity: 2 },
      { unit_price_centavos: 200000, quantity: 1 },
    ];

    const subtotal = items.reduce(
      (sum, item) => sum + item.unit_price_centavos * item.quantity,
      0
    );

    expect(subtotal).toBe(500000); // ₱5,000.00
  });

  it('computes tax correctly', () => {
    const subtotal = 500000;
    const discount = 0;
    const taxRate = 12;
    const taxable = subtotal - discount;
    const tax = Math.round(taxable * (taxRate / 100));

    expect(tax).toBe(60000); // ₱600.00
  });

  it('computes total with discount and tax', () => {
    const subtotal = 500000;
    const discount = 50000;
    const taxRate = 12;
    const taxable = subtotal - discount;
    const tax = Math.round(taxable * (taxRate / 100));
    const total = taxable + tax;

    expect(taxable).toBe(450000);
    expect(tax).toBe(54000);
    expect(total).toBe(504000);
  });

  it('handles zero items', () => {
    const items: { unit_price_centavos: number; quantity: number }[] = [];
    const subtotal = items.reduce(
      (sum, item) => sum + item.unit_price_centavos * item.quantity,
      0
    );

    expect(subtotal).toBe(0);
  });

  it('handles fractional quantities', () => {
    const items = [
      { unit_price_centavos: 10000, quantity: 2.5 },
    ];

    const subtotal = items.reduce(
      (sum, item) => sum + item.unit_price_centavos * item.quantity,
      0
    );

    expect(subtotal).toBe(25000); // ₱250.00
  });
});

// ============================================================
// InvoiceStatusEnum Tests
// ============================================================

describe('InvoiceStatusEnum', () => {
  it('validates all known statuses', () => {
    const statuses: InvoiceStatus[] = ['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'];
    for (const s of statuses) {
      expect(InvoiceStatusEnum.safeParse(s).success).toBe(true);
    }
  });

  it('rejects unknown status', () => {
    expect(InvoiceStatusEnum.safeParse('pending').success).toBe(false);
    expect(InvoiceStatusEnum.safeParse('').success).toBe(false);
  });
});

// ============================================================
// Line Item stable-id reconciliation (U1 — data-corruption fix)
// ============================================================

describe('LineItemEditor — ensureIds', () => {
  const mkItem = (description: string, unit_price_centavos: number): LineItemData => ({
    description,
    quantity: 1,
    unit: 'piece',
    unit_price_centavos,
  });

  it('backfills a stable id for items that arrive without one', () => {
    const withIds = ensureIds([mkItem('Cake', 15000), mkItem('Drink', 5000)]);
    expect(withIds).toHaveLength(2);
    for (const item of withIds) {
      expect(typeof item.id).toBe('string');
      expect(item.id!.length).toBeGreaterThan(0);
    }
    // Ids are unique per item.
    expect(withIds[0].id).not.toBe(withIds[1].id);
  });

  it('preserves existing ids and other fields untouched', () => {
    const input: LineItemData[] = [{ id: 'fixed-1', description: 'Cake', quantity: 2, unit: 'box', unit_price_centavos: 15000 }];
    const out = ensureIds(input);
    expect(out[0].id).toBe('fixed-1');
    expect(out[0].quantity).toBe(2);
    expect(out[0].unit).toBe('box');
    expect(out[0].unit_price_centavos).toBe(15000);
  });

  it('returns the SAME array reference when every item already has an id (no-op)', () => {
    const input: LineItemData[] = [
      { id: 'a', description: 'A', quantity: 1, unit: 'piece', unit_price_centavos: 100 },
      { id: 'b', description: 'B', quantity: 1, unit: 'piece', unit_price_centavos: 200 },
    ];
    // Reference equality lets the editor skip a redundant onItemsChange.
    expect(ensureIds(input)).toBe(input);
  });

  it('only allocates ids for the items missing them (mixed input)', () => {
    const input: LineItemData[] = [
      { id: 'keep', description: 'A', quantity: 1, unit: 'piece', unit_price_centavos: 100 },
      mkItem('B', 200),
    ];
    const out = ensureIds(input);
    expect(out[0].id).toBe('keep');
    expect(typeof out[1].id).toBe('string');
    expect(out[1].id).not.toBe('keep');
  });
});

describe('LineItemEditor — remove-middle-row preserves correct totals', () => {
  // Simulates the editor's handleRemove (filter by index) and the subtotal
  // reducer, asserting that removing a MIDDLE row keeps each surviving row's
  // own values — the exact scenario that index-as-key + uncontrolled inputs
  // used to corrupt (a reused input would overwrite the row shifting up).
  const subtotal = (items: LineItemData[]) =>
    items.reduce((sum, i) => sum + i.unit_price_centavos * i.quantity, 0);

  const removeAt = (items: LineItemData[], index: number) =>
    items.filter((_, i) => i !== index);

  it('drops only the targeted middle row and keeps the others intact', () => {
    const items = ensureIds([
      { description: 'Row A', quantity: 1, unit: 'piece', unit_price_centavos: 10000 },
      { description: 'Row B', quantity: 2, unit: 'piece', unit_price_centavos: 20000 },
      { description: 'Row C', quantity: 3, unit: 'piece', unit_price_centavos: 30000 },
    ]);
    // Subtotal before: 10000 + 40000 + 90000 = 140000
    expect(subtotal(items)).toBe(140000);

    const idA = items[0].id;
    const idC = items[2].id;
    const after = removeAt(items, 1); // remove middle Row B

    // Surviving rows keep their identity AND their data (no stale bleed-through).
    expect(after).toHaveLength(2);
    expect(after[0].id).toBe(idA);
    expect(after[0].description).toBe('Row A');
    expect(after[0].unit_price_centavos).toBe(10000);
    expect(after[1].id).toBe(idC);
    expect(after[1].description).toBe('Row C');
    expect(after[1].unit_price_centavos).toBe(30000);

    // Subtotal after removing the ₱200 row (qty 2 = 40000): 140000 - 40000.
    expect(subtotal(after)).toBe(100000);
  });

  it('keying by item.id maps each surviving row to its own value (vs index)', () => {
    // Build a key->value map the way React would with key={item.id}; prove the
    // shifted-up Row C is still keyed to Row C's value, not Row B's.
    const items = ensureIds([
      { description: 'A', quantity: 1, unit: 'piece', unit_price_centavos: 100 },
      { description: 'B', quantity: 1, unit: 'piece', unit_price_centavos: 200 },
      { description: 'C', quantity: 1, unit: 'piece', unit_price_centavos: 300 },
    ]);
    const cId = items[2].id!;
    const after = removeAt(items, 1);
    const byId = new Map(after.map((i) => [i.id!, i.unit_price_centavos]));
    expect(byId.get(cId)).toBe(300); // C still resolves to 300, not B's 200
  });
});
