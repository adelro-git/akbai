// ============================================================
// <Money> primitive — unit tests (W2)
// Environment: vitest `node` + react-dom/server SSR markup, matching
// the repo convention (see illustrations/kai/__tests__/kai.test.tsx).
// SSR renders the FINAL value (count-up only starts in useEffect on the
// client), so these assertions validate formatting / sign / tone / a11y
// without needing jsdom or fake timers.
// ============================================================

import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Money from '../money';

describe('<Money> — formatting', () => {
  it('renders a centavo amount via centavosToPeso (₱ + grouping + .00)', () => {
    const html = renderToStaticMarkup(<Money centavos={345000} />);
    expect(html).toContain('₱3,450.00');
  });

  it('preserves the two-decimal centavo display', () => {
    const html = renderToStaticMarkup(<Money centavos={3450} />);
    expect(html).toContain('₱34.50');
  });

  it('renders zero correctly', () => {
    const html = renderToStaticMarkup(<Money centavos={0} />);
    expect(html).toContain('₱0.00');
  });

  it('keeps the minus OUTSIDE the ₱ for an unsigned negative (no ₱-34.50)', () => {
    const html = renderToStaticMarkup(<Money centavos={-3450} />);
    expect(html).toContain('-₱34.50');
    expect(html).not.toContain('₱-34.50');
  });
});

describe('<Money> — signed', () => {
  it('prepends + for a non-negative value when signed', () => {
    const html = renderToStaticMarkup(<Money centavos={345000} signed />);
    expect(html).toContain('+₱3,450.00');
  });

  it('prepends a single - for a negative value when signed (no double minus)', () => {
    const html = renderToStaticMarkup(<Money centavos={-3450} signed />);
    expect(html).toContain('-₱34.50');
    expect(html).not.toContain('--');
  });

  it('omits the sign when signed is false (default)', () => {
    const html = renderToStaticMarkup(<Money centavos={345000} />);
    expect(html).not.toContain('+₱');
  });
});

describe('<Money> — type/tone classes', () => {
  it('applies the .num base class', () => {
    const html = renderToStaticMarkup(<Money centavos={100} />);
    expect(html).toContain('num');
  });

  it('maps size to the Number type class', () => {
    expect(renderToStaticMarkup(<Money centavos={100} size="lg" />)).toContain('num-lg');
    expect(renderToStaticMarkup(<Money centavos={100} size="md" />)).toContain('num-md');
    expect(renderToStaticMarkup(<Money centavos={100} size="sm" />)).toContain('num-sm');
  });

  it('defaults to size md', () => {
    expect(renderToStaticMarkup(<Money centavos={100} />)).toContain('num-md');
  });

  it('teal tone (default) adds no ink-override class', () => {
    const html = renderToStaticMarkup(<Money centavos={100} tone="teal" />);
    expect(html).not.toContain('num-ink');
    expect(html).not.toContain('num-white');
  });

  it('ink tone applies num-ink', () => {
    expect(renderToStaticMarkup(<Money centavos={100} tone="ink" />)).toContain('num-ink');
  });

  it('white tone applies num-white', () => {
    expect(renderToStaticMarkup(<Money centavos={100} tone="white" />)).toContain('num-white');
  });

  it('passes through a custom className', () => {
    expect(renderToStaticMarkup(<Money centavos={100} className="mt-2" />)).toContain('mt-2');
  });
});

describe('<Money> — accessibility', () => {
  it('exposes a localized aria-label spelling whole pesos as "piso"', () => {
    // Exact pesos (no centavos) announce just the piso part.
    const html = renderToStaticMarkup(<Money centavos={345000} />);
    expect(html).toContain('aria-label="3,450 piso"');
  });

  it('announces centavos as "sentimo" so the label matches the visible value', () => {
    // 3450 centavos = ₱34.50 visible → "34 piso at 50 sentimo" (NOT "35 piso").
    const html = renderToStaticMarkup(<Money centavos={3450} />);
    expect(html).toContain('aria-label="34 piso at 50 sentimo"');
  });

  it('aria-label includes the sign when signed', () => {
    expect(renderToStaticMarkup(<Money centavos={345000} signed />)).toContain(
      'aria-label="+3,450 piso"',
    );
  });

  it('negative .50 amounts announce the magnitude with a single minus (no off-by-one)', () => {
    // Visible: -₱34.50 → label must agree: "-34 piso at 50 sentimo".
    // The old Math.round(centavos/100) path announced "-35 piso" — a value the
    // user never saw. Guard against that regression here.
    const html = renderToStaticMarkup(<Money centavos={-3450} signed />);
    expect(html).toContain('aria-label="-34 piso at 50 sentimo"');
    expect(html).not.toContain('35 piso');
  });

  it('negative amounts are sign-aware even when unsigned (minus reflects reality)', () => {
    const html = renderToStaticMarkup(<Money centavos={-3450} />);
    expect(html).toContain('aria-label="-34 piso at 50 sentimo"');
  });
});

describe('<Money> — SSR safety', () => {
  it('renders the final value on the server (count-up never runs in SSR)', () => {
    // With countUp default true, SSR must still show the real value, not 0.
    const html = renderToStaticMarkup(<Money centavos={500000} countUp />);
    expect(html).toContain('₱5,000.00');
    expect(html).not.toContain('₱0.00');
  });
});
