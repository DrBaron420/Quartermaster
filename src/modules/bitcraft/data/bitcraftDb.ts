import Dexie, { type EntityTable } from "dexie";
import type { BitcraftItem, CraftingRecipe } from "../types/items";

class BitcraftDB extends Dexie {
  items!: EntityTable<BitcraftItem, "id">;  // id is string
  recipes!: EntityTable<CraftingRecipe, "recipeId">;  // recipeId is string

  constructor() {
    super("bitcraft");

    this.version(3).stores({
      items: "id, name, tier, tag, rarity, rarityStr",
      recipes: "recipeId, resultItemId, skillName, levelRequired",
    });
  }
}

export const bitcraftDb = new BitcraftDB();
