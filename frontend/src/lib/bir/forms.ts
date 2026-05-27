// ============================================================
// BIR Form Allowlist — ADR-017 §1
// Single source of truth for the form_code values that may appear in
// `/chat?topic={form_code}&context=deadline-{N}d`. Both the chat page
// (server) and the chat API route (server) MUST validate against this
// list. Unknown values fall through to a context-free chat.
// ============================================================

/** Uppercase BIR form identifiers matching `bir_deadlines.form_name`. */
export const KNOWN_FORM_CODES = [
  '1701Q',
  '1701A',
  '2551Q',
  '2550Q',
  '2550M',
  '1601-EQ',
  '1601EQ',
  '1601C',
  '1604C',
] as const;

export type KnownFormCode = (typeof KNOWN_FORM_CODES)[number];

/** Friendly display names — used by the assembler context block. */
export const FORM_CODE_DESCRIPTIONS: Record<string, string> = {
  '1701Q': 'Quarterly Income Tax Return',
  '1701A': 'Annual Income Tax Return',
  '2551Q': 'Quarterly Percentage Tax',
  '2550Q': 'Quarterly VAT Return',
  '2550M': 'Monthly VAT Return',
  '1601-EQ': 'Quarterly Withholding Tax (Expanded)',
  '1601EQ': 'Quarterly Withholding Tax (Expanded)',
  '1601C': 'Monthly Withholding on Compensation',
  '1604C': 'Annual Information Return — Compensation',
};

export function isKnownFormCode(code: string): code is KnownFormCode {
  return (KNOWN_FORM_CODES as readonly string[]).includes(code);
}

// ============================================================
// Deadline-context URL parsing — ADR-017 §2
// ============================================================

export type DeadlineContext = {
  formCode: KnownFormCode;
  daysUntilDue: number;
};

/**
 * Parse `topic` + `context` query params into a typed DeadlineContext.
 * Returns null if either param is missing, the form code is unknown, or
 * the context string doesn't match `deadline-{N}d` with N in -30..30.
 */
export function parseDeadlineContext(
  topic: string | undefined | null,
  context: string | undefined | null,
): DeadlineContext | null {
  if (!topic || !context) return null;
  const upperTopic = topic.toUpperCase();
  if (!isKnownFormCode(upperTopic)) return null;
  const match = context.match(/^deadline(-?\d+)d$/);
  if (!match) return null;
  const parsed = parseInt(match[1], 10);
  if (Number.isNaN(parsed)) return null;
  const days = Math.max(-30, Math.min(30, parsed));
  return { formCode: upperTopic, daysUntilDue: days };
}

/** Sentinel sent by the chat page to trigger the "Kai opens" flow (ADR-017 §4). */
export const SENTINEL_DEADLINE_CONTEXT_OPEN = '__deadline_context_open__';
