import Dexie, { type EntityTable } from "dexie";
import type { TarkovItem } from "../types/items";
import type { TarkovAmmo } from "../types/ammo";
import type { TarkovTask } from "../types/tasks";
import type { HideoutStation } from "../types/hideout";

/**
 * Tarkov-specific Dexie database.
 * Separate from the shared DB so each module manages its own data.
 */
class TarkovDB extends Dexie {
  items!: EntityTable<TarkovItem, "id">;
  ammo!: EntityTable<TarkovAmmo, "id">;
  tasks!: EntityTable<TarkovTask, "id">;
  hideout!: EntityTable<HideoutStation, "id">;

  constructor() {
    super("tarkov");

    this.version(2).stores({
      items: "id, name, shortName, normalizedName, basePrice, *types, *categories",
      ammo: "id, name, shortName, caliber, damage, penetrationPower",
      tasks: "id, name, trader, map, minPlayerLevel",
      hideout: "id, name",
    });
  }
}

export const tarkovDb = new TarkovDB();
