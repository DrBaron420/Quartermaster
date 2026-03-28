import { fetchItems, fetchAmmo, fetchTasks, fetchHideout } from "./tarkovApi";
import { tarkovDb } from "./tarkovDb";
import { db } from "@/shared/db/dexieInstance";
import { getSqlite } from "@/shared/db/sqliteBridge";

/**
 * Initialize SQLite tables for the Tarkov module.
 */
export async function initTarkovSqlite(): Promise<void> {
  const sqlite = await getSqlite();
  if (!sqlite) return;

  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS tarkov_items (
      id TEXT PRIMARY KEY, data TEXT NOT NULL, updated TEXT
    )
  `);
  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS tarkov_ammo (
      id TEXT PRIMARY KEY, data TEXT NOT NULL
    )
  `);
  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS tarkov_tasks (
      id TEXT PRIMARY KEY, data TEXT NOT NULL
    )
  `);
  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS tarkov_hideout (
      id TEXT PRIMARY KEY, data TEXT NOT NULL
    )
  `);
}

/**
 * Hydrate Tarkov Dexie tables from SQLite.
 */
export async function hydrateTarkovFromSqlite(): Promise<void> {
  const sqlite = await getSqlite();
  if (!sqlite) return;

  try {
    const tables = [
      { name: "tarkov_items", store: tarkovDb.items },
      { name: "tarkov_ammo", store: tarkovDb.ammo },
      { name: "tarkov_tasks", store: tarkovDb.tasks },
      { name: "tarkov_hideout", store: tarkovDb.hideout },
    ] as const;

    for (const { name, store } of tables) {
      const rows = await sqlite.select<{ id: string; data: string }>(
        `SELECT id, data FROM ${name}`
      );
      if (rows.length > 0) {
        const parsed = rows.map((row) => JSON.parse(row.data));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (store as any).bulkPut(parsed);
        console.log(`[Tarkov] Hydrated ${rows.length} records from ${name}`);
      }
    }
  } catch (err) {
    console.error("[Tarkov] Hydration failed:", err);
  }
}

/**
 * Full sync: fetch from API → save to SQLite → update Dexie.
 */
export async function syncTarkovData(): Promise<void> {
  console.log("[Tarkov] Starting sync...");

  const [items, ammo, tasks, hideout] = await Promise.all([
    fetchItems(),
    fetchAmmo(),
    fetchTasks(),
    fetchHideout(),
  ]);
  console.log(
    `[Tarkov] Fetched ${items.length} items, ${ammo.length} ammo, ${tasks.length} tasks, ${hideout.length} stations`
  );

  // Save to SQLite
  const sqlite = await getSqlite();
  if (sqlite) {
    const bulkSqlite = async (table: string, records: { id: string }[]) => {
      for (const record of records) {
        await sqlite.execute(
          `INSERT OR REPLACE INTO ${table} (id, data) VALUES (?, ?)`,
          [record.id, JSON.stringify(record)]
        );
      }
    };

    // Items have an extra 'updated' column
    for (const item of items) {
      await sqlite.execute(
        "INSERT OR REPLACE INTO tarkov_items (id, data, updated) VALUES (?, ?, ?)",
        [item.id, JSON.stringify(item), item.updated]
      );
    }
    await bulkSqlite("tarkov_ammo", ammo);
    await bulkSqlite("tarkov_tasks", tasks);
    await bulkSqlite("tarkov_hideout", hideout);
    console.log("[Tarkov] Saved to SQLite");
  }

  // Update Dexie
  await tarkovDb.items.bulkPut(items);
  await tarkovDb.ammo.bulkPut(ammo);
  await tarkovDb.tasks.bulkPut(tasks);
  await tarkovDb.hideout.bulkPut(hideout);
  console.log("[Tarkov] Updated Dexie cache");

  // Update sync metadata
  const now = Date.now();
  await db.syncMeta.bulkPut([
    { id: "tarkov-items", lastSyncedAt: now, recordCount: items.length },
    { id: "tarkov-ammo", lastSyncedAt: now, recordCount: ammo.length },
    { id: "tarkov-tasks", lastSyncedAt: now, recordCount: tasks.length },
    { id: "tarkov-hideout", lastSyncedAt: now, recordCount: hideout.length },
  ]);
}
