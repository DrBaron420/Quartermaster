import { fetchItems, fetchAmmo } from "./tarkovApi";
import { tarkovDb } from "./tarkovDb";
import { db } from "@/shared/db/dexieInstance";
import { getSqlite } from "@/shared/db/sqliteBridge";

/**
 * Initialize SQLite tables for the Tarkov module.
 * Called when the module is enabled.
 */
export async function initTarkovSqlite(): Promise<void> {
  const sqlite = await getSqlite();
  if (!sqlite) return;

  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS tarkov_items (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated TEXT
    )
  `);

  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS tarkov_ammo (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL
    )
  `);
}

/**
 * Hydrate Tarkov Dexie tables from SQLite.
 * Called on app startup if the module is enabled.
 */
export async function hydrateTarkovFromSqlite(): Promise<void> {
  const sqlite = await getSqlite();
  if (!sqlite) return;

  try {
    // Hydrate items
    const itemRows = await sqlite.select<{ id: string; data: string }>(
      "SELECT id, data FROM tarkov_items"
    );
    if (itemRows.length > 0) {
      const items = itemRows.map((row) => JSON.parse(row.data));
      await tarkovDb.items.bulkPut(items);
      console.log(`[Tarkov] Hydrated ${itemRows.length} items from SQLite`);
    }

    // Hydrate ammo
    const ammoRows = await sqlite.select<{ id: string; data: string }>(
      "SELECT id, data FROM tarkov_ammo"
    );
    if (ammoRows.length > 0) {
      const ammo = ammoRows.map((row) => JSON.parse(row.data));
      await tarkovDb.ammo.bulkPut(ammo);
      console.log(`[Tarkov] Hydrated ${ammoRows.length} ammo from SQLite`);
    }
  } catch (err) {
    console.error("[Tarkov] Hydration failed:", err);
  }
}

/**
 * Full sync: fetch from API → save to SQLite → update Dexie.
 * This is the handler registered with the SyncManager.
 */
export async function syncTarkovData(): Promise<void> {
  console.log("[Tarkov] Starting sync...");

  // Fetch from API
  const [items, ammo] = await Promise.all([fetchItems(), fetchAmmo()]);
  console.log(`[Tarkov] Fetched ${items.length} items, ${ammo.length} ammo`);

  // Save to SQLite (durable storage)
  const sqlite = await getSqlite();
  if (sqlite) {
    // Items: upsert each row
    for (const item of items) {
      await sqlite.execute(
        "INSERT OR REPLACE INTO tarkov_items (id, data, updated) VALUES (?, ?, ?)",
        [item.id, JSON.stringify(item), item.updated]
      );
    }

    // Ammo: upsert each row
    for (const round of ammo) {
      await sqlite.execute(
        "INSERT OR REPLACE INTO tarkov_ammo (id, data) VALUES (?, ?)",
        [round.id, JSON.stringify(round)]
      );
    }
    console.log("[Tarkov] Saved to SQLite");
  }

  // Update Dexie (UI cache)
  await tarkovDb.items.bulkPut(items);
  await tarkovDb.ammo.bulkPut(ammo);
  console.log("[Tarkov] Updated Dexie cache");

  // Update sync metadata
  await db.syncMeta.put({
    id: "tarkov-items",
    lastSyncedAt: Date.now(),
    recordCount: items.length,
  });
  await db.syncMeta.put({
    id: "tarkov-ammo",
    lastSyncedAt: Date.now(),
    recordCount: ammo.length,
  });
}
