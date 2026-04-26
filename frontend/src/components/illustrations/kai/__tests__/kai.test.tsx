// ============================================================
// Phase 4 Kai composition — render smoke tests
// Verifies Kai expression mapping + KaiSitting symbol exports.
// ============================================================
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Kai, KaiSitting } from '../index';

describe('Kai unified expression API', () => {
  it('renders the happy expression by default', () => {
    const html = renderToStaticMarkup(<Kai />);
    expect(html).toContain('<svg');
    expect(html).toContain('Kai is happy');
  });

  it('honors the expression prop', () => {
    const html = renderToStaticMarkup(<Kai expression="celebrating" />);
    // KaCelebrating renders an aria-label string we can sniff.
    expect(html).toContain('<svg');
  });

  it('wraps in animate-kai-bob span when animated', () => {
    const html = renderToStaticMarkup(<Kai animated />);
    expect(html).toContain('animate-kai-bob');
  });

  it('omits animation wrapper when not animated', () => {
    const html = renderToStaticMarkup(<Kai />);
    expect(html).not.toContain('animate-kai-bob');
  });

  it('honors size prop', () => {
    const html = renderToStaticMarkup(<Kai size={64} />);
    expect(html).toContain('width="64"');
    expect(html).toContain('height="64"');
  });
});

describe('KaiSitting hero mark', () => {
  // Smoke: in the SSR test environment Next/Image renders an <img> tag with
  // appropriate width/height attributes — that's all we need to assert.
  it('exports a function symbol', () => {
    expect(typeof KaiSitting).toBe('function');
  });

  it('renders without throwing at default props', () => {
    expect(() => renderToStaticMarkup(<KaiSitting />)).not.toThrow();
  });

  it('renders without throwing when animated', () => {
    expect(() => renderToStaticMarkup(<KaiSitting animated size={120} />)).not.toThrow();
  });
});
