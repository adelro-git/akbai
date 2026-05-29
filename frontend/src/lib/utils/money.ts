/**
 * Money Utilities — centavo/peso conversion
 *
 * All monetary amounts in AKBai are stored and transmitted as integers
 * in centavos. Display conversion to peso format happens at the UI layer only.
 * This module is the single source of truth for those conversions.
 */

/** Convert centavos integer to formatted peso string (e.g., 345000 → "₱3,450.00") */
export function centavosToPeso(centavos: number): string {
  return `₱${(centavos / 100).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Convert peso number to centavos integer (e.g., 34.50 → 3450) */
export function pesoToCentavos(peso: number): number {
  return Math.round(peso * 100);
}

/**
 * Convert centavos integer to a plain fixed-2-decimal peso string — no ₱
 * glyph, no thousands grouping, sign preserved (e.g. 3450 → "34.50",
 * -3450 → "-34.50", 5 → "0.05"). For machine-friendly output such as CSV
 * exports that must re-import cleanly into Excel / Google Sheets.
 *
 * Works in integer space (truncate → split whole/fraction) so float drift can
 * never produce e.g. "34.4999...".
 */
export function centavosToPlainDecimal(centavos: number): string {
  const sign = centavos < 0 ? '-' : '';
  const abs = Math.abs(Math.trunc(centavos));
  const whole = Math.floor(abs / 100);
  const frac = abs % 100;
  return `${sign}${whole}.${String(frac).padStart(2, '0')}`;
}
