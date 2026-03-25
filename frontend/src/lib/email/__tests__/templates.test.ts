import { describe, it, expect } from 'vitest';
import { magicLinkTemplate, confirmationTemplate } from '../templates';

describe('magicLinkTemplate', () => {
  const testLink = 'https://app.akbai.ph/auth/callback?token=abc123';

  it('returns a valid HTML document', () => {
    const html = magicLinkTemplate(testLink);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('</html>');
  });

  it('includes the OTP link in the CTA button', () => {
    const html = magicLinkTemplate(testLink);
    expect(html).toContain(`href="${testLink}"`);
  });

  it('includes the raw link for copy-paste', () => {
    const html = magicLinkTemplate(testLink);
    // The link should appear as plain text for manual copy
    expect(html).toContain(testLink);
  });

  it('includes AKBai branding', () => {
    const html = magicLinkTemplate(testLink);
    expect(html).toContain('AKB');
    expect(html).toContain('#F59E0B'); // honey accent
    expect(html).toContain('#fdf9f2'); // surface background
  });

  it('includes Taglish copy', () => {
    const html = magicLinkTemplate(testLink);
    expect(html).toContain('Mag-sign in ka sa AKBai');
    expect(html).toContain('Mag-login sa AKBai');
  });

  it('uses generic greeting when no user name provided', () => {
    const html = magicLinkTemplate(testLink);
    expect(html).toContain('Hi!');
  });

  it('personalizes greeting when user name is provided', () => {
    const html = magicLinkTemplate(testLink, 'Maria');
    expect(html).toContain('Hi Maria!');
    expect(html).not.toMatch(/Hi!\s*</);
  });

  it('includes mobile-responsive viewport meta tag', () => {
    const html = magicLinkTemplate(testLink);
    expect(html).toContain('name="viewport"');
    expect(html).toContain('width=device-width');
  });

  it('uses table-based layout for email client compatibility', () => {
    const html = magicLinkTemplate(testLink);
    expect(html).toContain('role="presentation"');
  });

  it('includes Plus Jakarta Sans font stack', () => {
    const html = magicLinkTemplate(testLink);
    expect(html).toContain('Plus Jakarta Sans');
  });

  it('includes brand footer', () => {
    const html = magicLinkTemplate(testLink);
    expect(html).toContain('Katuwang ng Negosyo Mo');
  });
});

describe('confirmationTemplate', () => {
  const testLink = 'https://app.akbai.ph/auth/confirm?token=xyz789';

  it('returns a valid HTML document', () => {
    const html = confirmationTemplate(testLink);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('</html>');
  });

  it('includes the confirmation link in the CTA button', () => {
    const html = confirmationTemplate(testLink);
    expect(html).toContain(`href="${testLink}"`);
  });

  it('includes the raw link for copy-paste', () => {
    const html = confirmationTemplate(testLink);
    expect(html).toContain(testLink);
  });

  it('includes welcome Taglish copy', () => {
    const html = confirmationTemplate(testLink);
    expect(html).toContain('Welcome sa AKBai!');
    expect(html).toContain('I-confirm ang Email');
  });

  it('includes AKBai branding elements', () => {
    const html = confirmationTemplate(testLink);
    expect(html).toContain('AKB');
    expect(html).toContain('#F59E0B');
    expect(html).toContain('#fdf9f2');
  });

  it('includes motivational onboarding copy', () => {
    const html = confirmationTemplate(testLink);
    expect(html).toContain('katuwang mo sa negosyo');
  });
});
