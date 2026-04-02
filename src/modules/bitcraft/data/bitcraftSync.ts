import { fetchItems, fetchRecipes } from "./bitcraftApi";
import { bitcraftDb } from "./bitcraftDb";
import { db } from "@/shared/db/dexieInstance";
import { getSqlite } from "@/shared/db/sqliteBridge";

export async function initBitcraftSqlite(): Promise<void> {
  const sqlite = await getSqlite();
  if (!sqlite) return;

  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS bitcraft_items (
      id TEXT PRIMARY KEY, data TEXT NOT NULL
    )
  `);
  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS bitcraft_recipes (
      id TEXT PRIMARY KEY, data TEXT NOT NULL
    )
  `);
}

export async function hydrateBitcraftFromSqlite(): Promise<void> {
  const sqlite = await getSqlite();
  if (!sqlite) return;

  try {
    const tables = [
      { name: "bitcraft_items", store: bitcraftDb.items },
      { name: "bitcraft_recipes", store: bitcraftDb.recipes },
    ] as const;

    for (const { name, store } of tables) {
      const rows = await sqlite.select<{ id: string; data: string }>(
        `SELECT id, data FROM ${name}`
      );
      if (rows.length > 0) {
        const parsed = rows.map((row) => JSON.parse(row.data));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (store as any).bulkPut(parsed);
        console.log(`[BitCraft] Hydrated ${rows.length} records from ${name}`);
      }
    }
  } catch (err) {
    console.error("[BitCraft] Hydration failed:", err);
  }
}

export async function syncBitcraftData(): Promise<void> {
  console.log("[BitCraft] Starting sync...");

  const [items, recipes] = await Promise.all([
    fetchItems(),
    fetchRecipes(),
  ]);
  console.log(
    `[BitCraft] Fetched ${items.length} items, ${recipes.length} recipes`
  );

  const sqlite = await getSqlite();
  if (sqlite) {
    const bulkSqlite = async (
      table: string,
      records: { id?: number | string; recipeId?: string }[]
    ) => {
      for (const record of records) {
        const id = String(
          "recipeId" in record ? record.recipeId : record.id
        );
        await sqlite.execute(
          `INSERT OR REPLACE INTO ${table} (id, data) VALUES (?, ?)`,
          [id, JSON.stringify(record)]
        );
      }
    };

    await bulkSqlite("bitcraft_items", items);
    await bulkSqlite("bitcraft_recipes", recipes);
    console.log("[BitCraft] Saved to SQLite");
  }

  await bitcraftDb.items.bulkPut(items);
  await bitcraftDb.recipes.bulkPut(recipes);
  console.log("[BitCraft] Updated Dexie cache");

  const now = Date.now();
  await db.syncMeta.bulkPut([
    { id: "bitcraft-items", lastSyncedAt: now, recordCount: items.length },
    { id: "bitcraft-recipes", lastSyncedAt: now, recordCount: recipes.length },
  ]);
}
