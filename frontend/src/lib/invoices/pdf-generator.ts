/**
 * Invoice PDF Generator — server-side HTML-to-PDF conversion
 * Feature: Invoice Cards (Build 8)
 * Role: Generate downloadable PDF invoices from invoice data
 *
 * Approach: Build an HTML template, render to PDF using the browser's
 * print-to-PDF capability via a simple HTML response that the client
 * can print. For MVP, we generate clean HTML that renders well when
 * printed (CSS @media print). A future iteration can use Puppeteer
 * or a PDF library for server-side generation.
 *
 * Includes: Business name (from profile), customer details, line items,
 * totals, invoice number, dates, BIR disclaimer.
 *
 * Dependencies: Invoice data (passed in), business profile data
 */

import type { InvoiceWithItems } from './types';

// ============================================================
// Types
// ============================================================

interface BusinessInfo {
  business_name: string | null;
  owner_name: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
}

// ============================================================
// Currency Formatter (server-side, no import cycle)
// ============================================================

function formatPeso(centavos: number): string {
  return `₱${(centavos / 100).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ============================================================
// HTML Template — clean, printable invoice
// ============================================================

export function generateInvoiceHtml(
  invoice: InvoiceWithItems,
  business: BusinessInfo
): string {
  const businessName = business.business_name ?? 'My Business';
  const activeItems = invoice.items.filter((item) => !item.deleted_at);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.invoice_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #1c1c18;
      background: #ffffff;
      padding: 40px;
      font-size: 14px;
      line-height: 1.6;
    }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
    .business-name { font-size: 24px; font-weight: 800; color: #855300; }
    .business-detail { font-size: 12px; color: #534434; margin-top: 2px; overflow-wrap: anywhere; }
    .invoice-title { font-size: 32px; font-weight: 800; color: #1c1c18; text-align: right; }
    .invoice-number { font-size: 14px; color: #534434; text-align: right; margin-top: 4px; }
    .meta-row { display: flex; justify-content: space-between; margin-bottom: 32px; }
    .meta-block h3 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #867461; margin-bottom: 4px; }
    .meta-block p { font-size: 14px; color: #1c1c18; overflow-wrap: anywhere; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead th {
      text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.05em; color: #867461; padding: 8px 12px;
      border-bottom: 2px solid #f59e0b;
    }
    thead th:last-child, thead th:nth-child(3), thead th:nth-child(4) { text-align: right; }
    tbody td { padding: 10px 12px; font-size: 14px; border-bottom: 1px solid #f7f3ec; overflow-wrap: anywhere; word-break: break-word; }
    tbody td:last-child, tbody td:nth-child(3), tbody td:nth-child(4) { text-align: right; }
    .totals { display: flex; justify-content: flex-end; margin-bottom: 32px; }
    .totals-table { width: 280px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
    .totals-row.total { font-weight: 800; font-size: 18px; color: #855300; border-top: 2px solid #f59e0b; padding-top: 10px; margin-top: 4px; }
    .notes { background: #fdf9f2; padding: 16px; border-radius: 8px; margin-bottom: 24px; }
    .notes h3 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #867461; margin-bottom: 6px; }
    .notes p { font-size: 13px; color: #534434; overflow-wrap: anywhere; }
    .footer { text-align: center; font-size: 11px; color: #867461; margin-top: 40px; padding-top: 16px; border-top: 1px solid #f7f3ec; }
    .bir-disclaimer { font-style: italic; color: #867461; font-size: 11px; margin-top: 8px; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="business-name">${escapeHtml(businessName)}</div>
      ${business.owner_name ? `<div class="business-detail">${escapeHtml(business.owner_name)}</div>` : ''}
      ${business.address ? `<div class="business-detail">${escapeHtml(business.address)}</div>` : ''}
      ${business.phone ? `<div class="business-detail">${escapeHtml(business.phone)}</div>` : ''}
      ${business.email ? `<div class="business-detail">${escapeHtml(business.email)}</div>` : ''}
    </div>
    <div>
      <div class="invoice-title">INVOICE</div>
      <div class="invoice-number">${escapeHtml(invoice.invoice_number)}</div>
    </div>
  </div>

  <div class="meta-row">
    <div class="meta-block">
      <h3>Bill To</h3>
      <p><strong>${escapeHtml(invoice.client_name)}</strong></p>
      ${invoice.client_email ? `<p>${escapeHtml(invoice.client_email)}</p>` : ''}
      ${invoice.client_phone ? `<p>${escapeHtml(invoice.client_phone)}</p>` : ''}
      ${invoice.client_address ? `<p>${escapeHtml(invoice.client_address)}</p>` : ''}
    </div>
    <div class="meta-block" style="text-align: right;">
      <h3>Invoice Date</h3>
      <p>${formatDate(invoice.invoice_date)}</p>
      ${invoice.due_date ? `<h3 style="margin-top: 12px;">Due Date</h3><p>${formatDate(invoice.due_date)}</p>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 45%;">Description</th>
        <th style="width: 15%;">Qty</th>
        <th style="width: 20%;">Unit Price</th>
        <th style="width: 20%;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${activeItems.map((item) => `
      <tr>
        <td>${escapeHtml(item.description)}</td>
        <td>${item.quantity}${item.unit ? ` ${escapeHtml(item.unit)}` : ''}</td>
        <td>${formatPeso(item.unit_price_centavos)}</td>
        <td>${formatPeso(item.total_centavos)}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-table">
      <div class="totals-row">
        <span>Subtotal</span>
        <span>${formatPeso(invoice.subtotal_centavos)}</span>
      </div>
      ${invoice.discount_centavos > 0 ? `
      <div class="totals-row">
        <span>Discount</span>
        <span>-${formatPeso(invoice.discount_centavos)}</span>
      </div>` : ''}
      ${invoice.tax_amount_centavos > 0 ? `
      <div class="totals-row">
        <span>Tax (${invoice.tax_rate_pct}%)</span>
        <span>${formatPeso(invoice.tax_amount_centavos)}</span>
      </div>` : ''}
      <div class="totals-row total">
        <span>Total</span>
        <span>${formatPeso(invoice.total_centavos)}</span>
      </div>
    </div>
  </div>

  ${invoice.notes ? `
  <div class="notes">
    <h3>Notes</h3>
    <p>${escapeHtml(invoice.notes)}</p>
  </div>` : ''}

  <div class="footer">
    <p>Generated by AKBai</p>
    <p class="bir-disclaimer">Ito ay gabay lamang, hindi tax advice. Para sa opisyal na resibo, kumonsulta sa BIR-accredited CPA.</p>
  </div>
</body>
</html>`;
}

// ============================================================
// HTML Escaping — prevent XSS in generated HTML
// ============================================================

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
