import { describe, it, expect } from 'vitest';
import { assembleSystemPrompt } from '../assemble';

/**
 * Sprint 2 Task 5 — Integration test prompts
 *
 * Verifies that the enriched TAX_SCOPE contains the domain knowledge
 * needed for KA to give substantive, persona-aware BIR guidance.
 *
 * Test cases from sprint-2-plan.md:
 * 1. Maria asks about BIR deadlines → KA should mention 1701Q
 * 2. Jose asks about profit → KA should mention platform fees
 * 3. Ana asks about tax → KA should mention 8% flat tax
 */
describe('TAX_SCOPE enrichment — persona-aware BIR knowledge', () => {
  const taxPrompt = assembleSystemPrompt({
    feature: 'general_chat',
    scopes: ['tax'],
    userContext: null,
  });

  it('Test 1: Maria (food/baking) — system prompt contains 1701Q deadline knowledge', () => {
    // Maria asks about BIR deadlines → KA should have 1701Q context
    expect(taxPrompt).toContain('1701Q');
    expect(taxPrompt).toContain('May 15');
    expect(taxPrompt).toContain('Aug 15');
    expect(taxPrompt).toContain('Nov 15');
    // Maria-specific mistake awareness
    expect(taxPrompt).toContain('Maria');
    expect(taxPrompt).toContain('forgets quarterly deadlines');
  });

  it('Test 2: Jose (online seller) — system prompt contains platform fee awareness', () => {
    // Jose asks about profit → KA should know about platform fee confusion
    expect(taxPrompt).toContain('Jose');
    expect(taxPrompt).toContain('platform fees');
    expect(taxPrompt).toContain('gross');
    // Jose VAT-registered path
    expect(taxPrompt).toContain('2550Q');
  });

  it('Test 3: Ana (freelancer) — system prompt contains 8% flat tax rules', () => {
    // Ana asks about tax → KA should mention 8% flat tax specifics
    expect(taxPrompt).toContain('Ana');
    expect(taxPrompt).toContain('8% flat');
    expect(taxPrompt).toContain('EXEMPT from 2551Q');
    // Ana-specific mistake: thinking 8% allows deductions
    expect(taxPrompt).toContain('does NOT');
  });

  it('includes BIR form decision tree by business type', () => {
    expect(taxPrompt).toContain('BIR FORM DECISION TREE');
    expect(taxPrompt).toContain('1701Q');
    expect(taxPrompt).toContain('1701A');
    expect(taxPrompt).toContain('2551Q');
  });

  it('includes VAT threshold alert trigger', () => {
    expect(taxPrompt).toContain('₱3M');
    expect(taxPrompt).toContain('₱2.4M');
  });

  it('always includes BIR disclaimer instruction', () => {
    expect(taxPrompt).toContain(
      'Ito ay gabay lamang, hindi tax advice. Kumonsulta sa CPA para sa opisyal na payo.'
    );
  });
});
