export type Rarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary" | "Mythic";

export interface BitcraftItem {
  id: string;
  name: string;
  iconAssetName: string;
  rarity: number;
  rarityStr: Rarity;
  tier: number;
  tag: string;
}

export interface CraftingRecipeIngredient {
  itemId: string;
  itemName: string;
  quantity: number;
}

export interface CraftingRecipe {
  recipeId: string;
  resultItemId: string;
  resultItemName: string;
  resultQuantity: number;
  ingredients: CraftingRecipeIngredient[];
  skillName: string;
  levelRequired: number;
  xpReward: number;
}

/** A live craft happening on the server (from /api/crafts) */
export interface LiveCraft {
  recipeId: string;
  resultItemId: string;
  resultItemName: string;
  resultQuantity: number;
  skillName: string;
  levelRequired: number;
  buildingName: string;
  ownerUsername: string;
  claimName: string;
  completed: boolean;
}

export interface BitcraftItemDetail extends BitcraftItem {
  craftingRecipes: CraftingRecipe[];
  extractionRecipes: { recipeId: string; resultItemName: string; skillName: string }[];
  relatedSkills: { skillName: string; levelRequired: number }[];
  recipesUsingItem: { recipeId: string; resultItemName: string }[];
}

export type Profession =
  | "Foraging" | "Hunting" | "Mining" | "Farming" | "Fishing" | "Forestry"
  | "Carpentry" | "Leatherworking" | "Masonry" | "Smithing" | "Tailoring"
  | "Scholar" | "Cooking" | "Construction" | "Merchanting" | "Slayer"
  | "Taming" | "Sailing";

export const GATHERING_PROFESSIONS: Profession[] = [
  "Foraging", "Hunting", "Mining", "Farming", "Fishing", "Forestry",
];

export const CRAFTING_PROFESSIONS: Profession[] = [
  "Carpentry", "Leatherworking", "Masonry", "Smithing", "Tailoring",
];

export const SKILLS: Profession[] = [
  "Cooking", "Construction", "Merchanting", "Slayer", "Taming", "Sailing",
];

export const ALL_PROFESSIONS: Profession[] = [
  ...GATHERING_PROFESSIONS, ...CRAFTING_PROFESSIONS, "Scholar", ...SKILLS,
];
