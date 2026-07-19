/**
 * Format a price value as Saudi Riyals.
 * e.g. 149.99 → "149.99 ر.س"
 */
export function formatPrice(amount: number, decimals = 2): string {
  return `${amount.toFixed(decimals)} ر.س`;
}
