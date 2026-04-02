import type { Rarity } from "../types/items";

/**
 * BitCraft rarity roll rates.
 * Each tier upgrade rolls for a rarity bump.
 * Rarity never decreases once achieved.
 */
export const RARITY_ROLL_RATES: Record<Rarity, number> = {
  Common: 1.0,
  Uncommon: 0.30,
  Rare: 0.15,
  Epic: 0.075,
  Legendary: 0.0375,
  Mythic: 0.01875,
};

export const RARITY_ORDER: Rarity[] = [
  "Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic",
];

/** Probability of achieving at least the target rarity in N rolls */
export function probabilityAtLeast(targetRarity: Rarity, rolls: number): number {
  if (targetRarity === "Common") return 1;
  const rate = RARITY_ROLL_RATES[targetRarity];
  return 1 - Math.pow(1 - rate, rolls);
}

/** Expected rolls needed to get the target rarity (1/rate) */
export function expectedRolls(targetRarity: Rarity): number {
  if (targetRarity === "Common") return 1;
  return 1 / RARITY_ROLL_RATES[targetRarity];
}

/** Rolls needed for a given confidence level (e.g. 0.90 = 90%) */
export function rollsForConfidence(targetRarity: Rarity, confidence: number): number {
  if (targetRarity === "Common") return 1;
  const rate = RARITY_ROLL_RATES[targetRarity];
  return Math.ceil(Math.log(1 - confidence) / Math.log(1 - rate));
}

/**
 * Full tier distribution table.
 * Returns the probability of ending at each rarity after N tier upgrades.
 */
export function tierDistribution(upgrades: number): Record<Rarity, number> {
  const result: Record<Rarity, number> = {
    Common: 1, Uncommon: 0, Rare: 0, Epic: 0, Legendary: 0, Mythic: 0,
  };

  for (let i = 0; i < upgrades; i++) {
    const newDist: Record<Rarity, number> = {
      Common: 0, Uncommon: 0, Rare: 0, Epic: 0, Legendary: 0, Mythic: 0,
    };

    for (let r = 0; r < RARITY_ORDER.length; r++) {
      const rarity = RARITY_ORDER[r];
      const prob = result[rarity];
      if (prob === 0) continue;

      if (r === RARITY_ORDER.length - 1) {
        // Already Mythic, stays Mythic
        newDist[rarity] += prob;
      } else {
        const nextRarity = RARITY_ORDER[r + 1];
        const upgradeChance = RARITY_ROLL_RATES[nextRarity];
        newDist[nextRarity] += prob * upgradeChance;
        newDist[rarity] += prob * (1 - upgradeChance);
      }
    }

    Object.assign(result, newDist);
  }

  return result;
}
