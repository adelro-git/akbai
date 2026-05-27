/**
 * Invoice Detail — server wrapper for Capacitor static export
 * Feature: Invoice Cards (Build 8) — Sprint 15 Capacitor conversion
 * Role: Server Component shell that supplies `generateStaticParams` so
 *       `output: 'export'` can produce a route shell. Delegates the actual
 *       rendering to the client component, which reads the real id via
 *       `useParams()` at runtime.
 *
 * Why a shell + 'placeholder' slug:
 *   Static export refuses to build dynamic routes without
 *   `generateStaticParams`. Real invoice ids only exist at run-time
 *   (per-user data) — we cannot enumerate them at build time. The
 *   'placeholder' entry produces one prerendered HTML shell; the SPA
 *   router (Capacitor WebView) handles client-side navigation to the
 *   actual slug, and the client component fetches the right invoice.
 */

import InvoiceDetailClientPage from './client-page';

export function generateStaticParams(): Array<{ id: string }> {
  return [{ id: 'placeholder' }];
}

export default function InvoiceDetailPage() {
  return <InvoiceDetailClientPage />;
}
