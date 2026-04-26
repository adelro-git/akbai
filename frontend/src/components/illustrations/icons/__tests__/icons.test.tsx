// ============================================================
// Phase 4 brand icon set — render smoke tests
// Vitest is configured with `environment: 'node'`. We use react-dom/server's
// `renderToStaticMarkup` to assert markup contains expected viewBox and that
// the component does not throw at default props.
// ============================================================
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  IconResibo,
  IconUsap,
  IconPera,
  IconKalendaryo,
  IconPrecio,
  IconInvoice,
  IconCheckin,
  IconSundayStory,
  IconDrafts,
  IconSampaguita,
  IconHomeNav,
  IconChatNav,
  IconScanNav,
  IconMoneyNav,
  IconMoreNav,
} from '../index';

const BRAND_VIEWBOX = '0 0 60 60';
const SAMPAGUITA_VIEWBOX = '0 0 20 20';
const NAV_VIEWBOX = '0 0 28 28';

const brandCases: Array<[string, () => string, string]> = [
  ['IconResibo', () => renderToStaticMarkup(<IconResibo />), BRAND_VIEWBOX],
  ['IconUsap', () => renderToStaticMarkup(<IconUsap />), BRAND_VIEWBOX],
  ['IconPera', () => renderToStaticMarkup(<IconPera />), BRAND_VIEWBOX],
  ['IconKalendaryo', () => renderToStaticMarkup(<IconKalendaryo />), BRAND_VIEWBOX],
  ['IconPrecio', () => renderToStaticMarkup(<IconPrecio />), BRAND_VIEWBOX],
  ['IconInvoice', () => renderToStaticMarkup(<IconInvoice />), BRAND_VIEWBOX],
  ['IconCheckin', () => renderToStaticMarkup(<IconCheckin />), BRAND_VIEWBOX],
  ['IconSundayStory', () => renderToStaticMarkup(<IconSundayStory />), BRAND_VIEWBOX],
  ['IconDrafts', () => renderToStaticMarkup(<IconDrafts />), BRAND_VIEWBOX],
  ['IconSampaguita', () => renderToStaticMarkup(<IconSampaguita />), SAMPAGUITA_VIEWBOX],
];

const navCases: Array<[string, () => string]> = [
  ['IconHomeNav', () => renderToStaticMarkup(<IconHomeNav />)],
  ['IconChatNav', () => renderToStaticMarkup(<IconChatNav />)],
  ['IconScanNav', () => renderToStaticMarkup(<IconScanNav />)],
  ['IconMoneyNav', () => renderToStaticMarkup(<IconMoneyNav />)],
  ['IconMoreNav', () => renderToStaticMarkup(<IconMoreNav />)],
];

describe('Phase 4 brand icons — render smoke tests', () => {
  brandCases.forEach(([name, render, viewBox]) => {
    it(`${name} renders an svg with viewBox ${viewBox}`, () => {
      const html = render();
      expect(html).toContain('<svg');
      expect(html).toContain(`viewBox="${viewBox}"`);
    });
  });

  it('IconResibo honors the size prop', () => {
    const html = renderToStaticMarkup(<IconResibo size={48} />);
    expect(html).toContain('width="48"');
    expect(html).toContain('height="48"');
  });

  it('IconKalendaryo honors the day prop', () => {
    const html = renderToStaticMarkup(<IconKalendaryo day={7} />);
    expect(html).toContain('>7<');
  });

  it('IconKalendaryo defaults to day 25', () => {
    const html = renderToStaticMarkup(<IconKalendaryo />);
    expect(html).toContain('>25<');
  });
});

describe('Phase 4 nav icons — render smoke tests', () => {
  navCases.forEach(([name, render]) => {
    it(`${name} renders an svg with viewBox ${NAV_VIEWBOX}`, () => {
      const html = render();
      expect(html).toContain('<svg');
      expect(html).toContain(`viewBox="${NAV_VIEWBOX}"`);
    });
  });

  it('IconHomeNav inactive uses cream fill, active uses honey', () => {
    const inactive = renderToStaticMarkup(<IconHomeNav />);
    const active = renderToStaticMarkup(<IconHomeNav active />);
    expect(inactive).toContain('#fef3d9');
    expect(active).toContain('#f5b347');
  });

  it('IconMoneyNav switches coin palette in active state', () => {
    const inactive = renderToStaticMarkup(<IconMoneyNav />);
    const active = renderToStaticMarkup(<IconMoneyNav active />);
    expect(inactive).toContain('#fde8c0');
    expect(active).toContain('#c87b14');
  });
});
