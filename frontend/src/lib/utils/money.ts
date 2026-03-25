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
