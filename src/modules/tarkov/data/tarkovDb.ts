import Dexie, { type EntityTable } from "dexie";
import type { TarkovItem } from "../types/items";
import type { TarkovAmmo } from "../types/ammo";

/**
 * Tarkov-specific Dexie database.
 * Separate from the shared DB so each module manages its own data.
 */
class TarkovDB extends Dexie {
  items!: EntityTable<TarkovItem, "id">;
  ammo!: EntityTable<TarkovAmmo, "id">;

  constructor() {
    super("tarkov");

    this.version(1).stores({
      // Index fields we'll search/filter on
      items: "id, name, shortName, normalizedName, basePrice, *types, *categories",
      ammo: "id, name, shortName, caliber, damage, penetrationPower",
    });
  }
}

export const tarkovDb = new TarkovDB();
