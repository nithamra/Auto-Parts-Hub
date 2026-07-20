/**
 * Format a price value as Saudi Riyals.
 * e.g. 149.99 → "⃁149.99"
 */
export function formatPrice(amount: number, decimals = 2): string {
  return `⃁${amount.toFixed(decimals)}`;
}
