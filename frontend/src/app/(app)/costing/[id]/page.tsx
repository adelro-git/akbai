/**
 * Costing Card Detail — server wrapper for Capacitor static export
 * Feature: Costing Cards (Build 7) — Sprint 15 Capacitor conversion
 * Role: Server Component shell that supplies `generateStaticParams` so
 *       `output: 'export'` can produce a route shell. Delegates the actual
 *       rendering to the client component, which reads the real id via
 *       `useParams()` at runtime.
 *
 * See sibling /invoices/[id]/page.tsx for the rationale on the
 * 'placeholder' slug pattern.
 */

import CostingCardDetailClientPage from './client-page';

export function generateStaticParams(): Array<{ id: string }> {
  return [{ id: 'placeholder' }];
}

export default function CostingCardDetailPage() {
  return <CostingCardDetailClientPage />;
}
