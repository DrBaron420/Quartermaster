/**
 * BitCraft XP formula:
 * X(L) = 10 * floor(64 * (2^(0.145*L) - 2^0.145) / (2^0.29 - 2^0.145))
 *
 * All 18 professions/skills use the same curve.
 * Soft cap: level 100 (~126.8M XP)
 * Hard cap: level 110 (~346.5M XP)
 */

const DENOM = Math.pow(2, 0.29) - Math.pow(2, 0.145);

/** Total cumulative XP needed to reach a given level */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level > 110) return -1; // hard cap
  return 10 * Math.floor(
    64 * (Math.pow(2, 0.145 * level) - Math.pow(2, 0.145)) / DENOM
  );
}

/** XP needed to go from one level to another */
export function xpBetweenLevels(from: number, to: number): number {
  if (from >= to) return 0;
  return xpForLevel(to) - xpForLevel(from);
}

/** XP needed just for the next level (from L to L+1) */
export function xpForNextLevel(level: number): number {
  return xpBetweenLevels(level, level + 1);
}

/** Given total cumulative XP, return the current level */
export function levelFromXp(xp: number): number {
  let lo = 1;
  let hi = 110;
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    if (xpForLevel(mid) <= xp) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/** How many items to craft to reach target level, given XP per item */
export function itemsToReachLevel(
  currentLevel: number,
  targetLevel: number,
  xpPerItem: number
): number {
  if (xpPerItem <= 0) return Infinity;
  const needed = xpBetweenLevels(currentLevel, targetLevel);
  return Math.ceil(needed / xpPerItem);
}

/** Format large XP numbers with commas */
export function formatXp(xp: number): string {
  return xp.toLocaleString();
}
