import { describe, it, expect } from 'vitest';
import { checkEmailProvider } from '../verify';

describe('checkEmailProvider', () => {
  describe('Yahoo Mail detection', () => {
    it('detects yahoo.com', () => {
      const result = checkEmailProvider('juan@yahoo.com');
      expect(result.provider).toBe('Yahoo Mail');
      expect(result.warning).toBeDefined();
      expect(result.warning).toContain('Yahoo Mail');
      expect(result.warning).toContain('spam folder');
    });

    it('detects yahoo.com.ph', () => {
      const result = checkEmailProvider('maria@yahoo.com.ph');
      expect(result.provider).toBe('Yahoo Mail');
      expect(result.warning).toBeDefined();
    });

    it('detects ymail.com', () => {
      const result = checkEmailProvider('test@ymail.com');
      expect(result.provider).toBe('Yahoo Mail');
      expect(result.warning).toBeDefined();
    });

    it('detects rocketmail.com', () => {
      const result = checkEmailProvider('user@rocketmail.com');
      expect(result.provider).toBe('Yahoo Mail');
      expect(result.warning).toBeDefined();
    });
  });

  describe('Gmail detection', () => {
    it('detects gmail.com', () => {
      const result = checkEmailProvider('user@gmail.com');
      expect(result.provider).toBe('Gmail');
      expect(result.warning).toBeUndefined();
    });

    it('detects googlemail.com', () => {
      const result = checkEmailProvider('user@googlemail.com');
      expect(result.provider).toBe('Gmail');
    });
  });

  describe('Outlook detection', () => {
    it('detects outlook.com', () => {
      const result = checkEmailProvider('user@outlook.com');
      expect(result.provider).toBe('Outlook');
      expect(result.warning).toBeUndefined();
    });

    it('detects hotmail.com', () => {
      const result = checkEmailProvider('user@hotmail.com');
      expect(result.provider).toBe('Outlook');
    });

    it('detects live.com', () => {
      const result = checkEmailProvider('user@live.com');
      expect(result.provider).toBe('Outlook');
    });
  });

  describe('PH ISP email detection', () => {
    it('detects PLDT', () => {
      const result = checkEmailProvider('user@pldtdsl.net');
      expect(result.provider).toBe('PLDT/Smart');
    });

    it('detects Globe', () => {
      const result = checkEmailProvider('user@globe.com.ph');
      expect(result.provider).toBe('Globe');
    });

    it('detects Converge', () => {
      const result = checkEmailProvider('user@convergeict.com');
      expect(result.provider).toBe('Converge ICT');
    });
  });

  describe('Other providers', () => {
    it('detects iCloud', () => {
      const result = checkEmailProvider('user@icloud.com');
      expect(result.provider).toBe('iCloud');
    });

    it('detects ProtonMail', () => {
      const result = checkEmailProvider('user@protonmail.com');
      expect(result.provider).toBe('ProtonMail');
    });

    it('detects Zoho', () => {
      const result = checkEmailProvider('user@zohomail.com');
      expect(result.provider).toBe('Zoho Mail');
    });
  });

  describe('Generic .ph domain', () => {
    it('returns PH Email Provider for unknown .ph domain', () => {
      const result = checkEmailProvider('admin@mybusiness.ph');
      expect(result.provider).toBe('PH Email Provider');
      expect(result.warning).toBeUndefined();
    });
  });

  describe('Unknown / other domains', () => {
    it('returns Other for unrecognized domains', () => {
      const result = checkEmailProvider('user@customdomain.co');
      expect(result.provider).toBe('Other');
      expect(result.warning).toBeUndefined();
    });
  });

  describe('Edge cases', () => {
    it('handles email with no @ sign', () => {
      const result = checkEmailProvider('notanemail');
      expect(result.provider).toBe('Unknown');
    });

    it('handles empty string', () => {
      const result = checkEmailProvider('');
      expect(result.provider).toBe('Unknown');
    });

    it('handles email ending with @', () => {
      const result = checkEmailProvider('user@');
      expect(result.provider).toBe('Unknown');
    });

    it('handles uppercase emails (case-insensitive)', () => {
      const result = checkEmailProvider('USER@YAHOO.COM.PH');
      expect(result.provider).toBe('Yahoo Mail');
      expect(result.warning).toBeDefined();
    });

    it('handles emails with whitespace', () => {
      const result = checkEmailProvider('  user@gmail.com  ');
      expect(result.provider).toBe('Gmail');
    });

    it('handles email with multiple @ signs (uses last one)', () => {
      const result = checkEmailProvider('user@name@gmail.com');
      expect(result.provider).toBe('Gmail');
    });
  });
});
