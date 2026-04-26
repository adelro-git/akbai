// ============================================================
// Phase 4 decorative motifs — render smoke tests
// Confirm each motif renders without throwing and produces expected markup.
// ============================================================
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  CapizPattern,
  FloatingPetals,
  WovenDivider,
  Squiggle,
  TapeStrip,
  SwayingLeaf,
  Sunburst,
  DoodleArrow,
} from '../../index';

describe('Phase 4 motifs — render smoke tests', () => {
  it('CapizPattern renders an svg with a pattern element', () => {
    const html = renderToStaticMarkup(<CapizPattern />);
    expect(html).toContain('<svg');
    expect(html).toContain('<pattern');
  });

  it('CapizPattern honors opacity prop', () => {
    const html = renderToStaticMarkup(<CapizPattern opacity={0.5} />);
    expect(html).toContain('opacity:0.5');
  });

  it('FloatingPetals renders the requested count of petals', () => {
    const html = renderToStaticMarkup(<FloatingPetals count={6} />);
    // Each petal is a span — count occurrences of animate-petal-drift class.
    const matches = html.match(/animate-petal-drift/g) ?? [];
    expect(matches.length).toBe(6);
  });

  it('FloatingPetals defaults to 10 petals', () => {
    const html = renderToStaticMarkup(<FloatingPetals />);
    const matches = html.match(/animate-petal-drift/g) ?? [];
    expect(matches.length).toBe(10);
  });

  it('FloatingPetals caps count at 16 to protect perf budget', () => {
    const html = renderToStaticMarkup(<FloatingPetals count={50} />);
    const matches = html.match(/animate-petal-drift/g) ?? [];
    expect(matches.length).toBe(16);
  });

  it('WovenDivider renders an svg with viewBox 0 0 400 10', () => {
    const html = renderToStaticMarkup(<WovenDivider />);
    expect(html).toContain('<svg');
    expect(html).toContain('viewBox="0 0 400 10"');
  });

  it('WovenDivider renders all 32 zigzag segments', () => {
    const html = renderToStaticMarkup(<WovenDivider />);
    const matches = html.match(/<line/g) ?? [];
    expect(matches.length).toBe(32);
  });

  it('Squiggle renders an svg with the bezier path', () => {
    const html = renderToStaticMarkup(<Squiggle />);
    expect(html).toContain('<svg');
    expect(html).toContain('M2 5');
  });

  it('Squiggle defaults width 120 (FIL)', () => {
    const html = renderToStaticMarkup(<Squiggle />);
    expect(html).toContain('width="120"');
  });

  it('Squiggle accepts a 130 width for English', () => {
    const html = renderToStaticMarkup(<Squiggle width={130} />);
    expect(html).toContain('width="130"');
  });

  it('TapeStrip renders a span with default rotation -6deg', () => {
    const html = renderToStaticMarkup(<TapeStrip />);
    expect(html).toContain('<span');
    expect(html).toContain('rotate(-6deg)');
  });

  it('TapeStrip honors rotation prop', () => {
    const html = renderToStaticMarkup(<TapeStrip rotation={3} />);
    expect(html).toContain('rotate(3deg)');
  });

  it('SwayingLeaf renders an svg with viewBox 0 0 60 80', () => {
    const html = renderToStaticMarkup(<SwayingLeaf />);
    expect(html).toContain('<svg');
    expect(html).toContain('viewBox="0 0 60 80"');
  });

  it('SwayingLeaf applies gentle-float animation class', () => {
    const html = renderToStaticMarkup(<SwayingLeaf />);
    expect(html).toContain('animate-gentle-float');
  });

  it('Sunburst renders an svg with viewBox 0 0 200 200', () => {
    const html = renderToStaticMarkup(<Sunburst />);
    expect(html).toContain('<svg');
    expect(html).toContain('viewBox="0 0 200 200"');
  });

  it('Sunburst renders all 12 ray lines', () => {
    const html = renderToStaticMarkup(<Sunburst />);
    const matches = html.match(/<line/g) ?? [];
    expect(matches.length).toBe(12);
  });

  it('DoodleArrow renders right-pointing by default (rotate 0)', () => {
    const html = renderToStaticMarkup(<DoodleArrow />);
    expect(html).toContain('<svg');
    expect(html).toContain('rotate(0deg)');
  });

  it('DoodleArrow rotates 180deg when direction=left', () => {
    const html = renderToStaticMarkup(<DoodleArrow direction="left" />);
    expect(html).toContain('rotate(180deg)');
  });
});
