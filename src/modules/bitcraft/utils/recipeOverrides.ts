/**
 * Items that appear in Bitjita's recipe data but are NOT actual
 * crafting ingredients in-game. These are filtered out of recipe
 * ingredient lists.
 *
 * Add item names here as you find them. Once we have direct
 * SpacetimeDB access, this list can be removed.
 */
export const EXCLUDED_INGREDIENTS: Set<string> = new Set([
  "Clothmaker's Mordant",
]);

/** Check if an ingredient should be filtered out */
export function isExcludedIngredient(itemName: string): boolean {
  return EXCLUDED_INGREDIENTS.has(itemName);
}
