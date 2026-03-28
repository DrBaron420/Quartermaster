import Dexie, { type EntityTable } from "dexie";

/**
 * SyncMeta tracks when each data source was last synced.
 * Modules add their own tables by extending this database.
 */
export interface SyncMeta {
  id: string; // e.g. "tarkov-items", "tarkov-ammo"
  lastSyncedAt: number; // Unix timestamp (ms)
  recordCount: number; // How many records were in the last sync
}

/**
 * The shared Dexie database instance.
 * This is the "desk" — fast reads for the UI.
 *
 * Each game module will add its own tables in future versions.
 * For now, we just have the sync metadata table.
 */
class QuartermasterDB extends Dexie {
  syncMeta!: EntityTable<SyncMeta, "id">;

  constructor() {
    super("quartermaster");

    this.version(1).stores({
      syncMeta: "id",
    });
  }
}

export const db = new QuartermasterDB();
