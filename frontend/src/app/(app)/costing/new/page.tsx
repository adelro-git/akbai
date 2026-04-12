'use client';

/**
 * Bagong Costing Card — Create page
 *
 * Renders the CostingCardForm in create mode (no existing card).
 */

import CostingCardForm from '@/components/costing/costing-card-form';

export default function NewCostingCardPage() {
  return (
    <div data-testid="new-costing-page">
      <CostingCardForm />
    </div>
  );
}
