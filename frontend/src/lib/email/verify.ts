/**
 * Email provider detection & deliverability pre-check.
 *
 * Informational only — never blocks signup. Detects Yahoo Mail PH
 * and other common PH email providers so the UI can show relevant
 * warnings about potential OTP delivery delays.
 */

export interface EmailProviderCheck {
  /** Detected provider name (e.g. "Yahoo Mail", "Gmail", "Outlook") */
  provider: string;
  /** Optional Taglish warning to surface in the UI */
  warning?: string;
}

/** Domains grouped by provider */
const PROVIDER_MAP: ReadonlyArray<{
  name: string;
  domains: ReadonlyArray<string>;
  warning?: string;
}> = [
  {
    name: 'Yahoo Mail',
    domains: ['yahoo.com', 'yahoo.com.ph', 'ymail.com', 'rocketmail.com'],
    warning:
      'Yahoo Mail minsan may delay sa OTP. Check spam folder mo rin.',
  },
  {
    name: 'Gmail',
    domains: ['gmail.com', 'googlemail.com'],
  },
  {
    name: 'Outlook',
    domains: [
      'outlook.com',
      'hotmail.com',
      'live.com',
      'msn.com',
      'outlook.ph',
    ],
  },
  {
    name: 'iCloud',
    domains: ['icloud.com', 'me.com', 'mac.com'],
  },
  {
    name: 'PLDT/Smart',
    domains: ['pldtdsl.net', 'smart.com.ph'],
  },
  {
    name: 'Globe',
    domains: ['globe.com.ph', 'tm.com.ph'],
  },
  {
    name: 'Converge ICT',
    domains: ['convergeict.com'],
  },
  {
    name: 'Zoho Mail',
    domains: ['zohomail.com', 'zoho.com'],
  },
  {
    name: 'ProtonMail',
    domains: ['protonmail.com', 'proton.me', 'pm.me'],
  },
];

/**
 * Detect the email provider and return an optional deliverability warning.
 *
 * @param email - User-entered email address
 * @returns Provider name and optional warning string
 *
 * @example
 * ```ts
 * const result = checkEmailProvider('juan@yahoo.com.ph');
 * // { provider: 'Yahoo Mail', warning: 'Yahoo Mail minsan may delay...' }
 * ```
 */
export function checkEmailProvider(email: string): EmailProviderCheck {
  const trimmed = email.trim().toLowerCase();
  const atIndex = trimmed.lastIndexOf('@');

  if (atIndex === -1 || atIndex === trimmed.length - 1) {
    return { provider: 'Unknown' };
  }

  const domain = trimmed.slice(atIndex + 1);

  for (const entry of PROVIDER_MAP) {
    if (entry.domains.includes(domain)) {
      return {
        provider: entry.name,
        ...(entry.warning ? { warning: entry.warning } : {}),
      };
    }
  }

  // Check for PH TLD as a generic catch
  if (domain.endsWith('.ph')) {
    return { provider: 'PH Email Provider' };
  }

  return { provider: 'Other' };
}
