/** Supported in-game currencies */
export type Currency = "RUB" | "USD" | "EUR";

/** Vendor name for the flea market (used for filtering) */
export const FLEA_MARKET = "Flea Market";

/** Format a price with the correct currency symbol */
export function formatPrice(price: number | undefined, currency: Currency | string = "RUB"): string {
  if (price == null || price === 0) return "—";
  if (currency === "USD") return `$${price.toLocaleString()}`;
  if (currency === "EUR") return `€${price.toLocaleString()}`;
  return `₽${price.toLocaleString()}`;
}
