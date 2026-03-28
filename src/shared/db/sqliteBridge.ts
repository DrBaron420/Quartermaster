/**
 * SQLite bridge — wraps Tauri's SQL plugin commands.
 * This is the "filing cabinet" — durable storage on disk.
 *
 * In dev mode (browser only, no Tauri), operations are no-ops
 * so the app can still run with just Dexie.
 */

/** Check if we're running inside Tauri (native app) vs plain browser */
function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

interface SqliteDB {
  execute: (query: string, bindValues?: unknown[]) => Promise<unknown>;
  select: <T>(query: string, bindValues?: unknown[]) => Promise<T[]>;
}

let dbInstance: SqliteDB | null = null;

/**
 * Get or create the SQLite database connection.
 * Returns null if not running in Tauri (e.g., browser dev mode).
 */
export async function getSqlite(): Promise<SqliteDB | null> {
  if (!isTauri()) {
    return null;
  }

  if (dbInstance) {
    return dbInstance;
  }

  try {
    const { default: Database } = await import("@tauri-apps/plugin-sql");
    dbInstance = await Database.load("sqlite:quartermaster.db");
    return dbInstance;
  } catch (err) {
    console.error("Failed to load SQLite:", err);
    return null;
  }
}

/**
 * Initialize the SQLite schema.
 * Creates tables if they don't exist yet.
 */
export async function initSqliteSchema(): Promise<void> {
  const sqlite = await getSqlite();
  if (!sqlite) return;

  // Sync metadata table — mirrors Dexie's syncMeta
  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS sync_meta (
      id TEXT PRIMARY KEY,
      last_synced_at INTEGER NOT NULL DEFAULT 0,
      record_count INTEGER NOT NULL DEFAULT 0
    )
  `);

  // Settings table — persists user preferences across cache clears
  await sqlite.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
}

/**
 * Read a setting from SQLite.
 */
export async function getSetting(key: string): Promise<string | null> {
  const sqlite = await getSqlite();
  if (!sqlite) return null;

  const rows = await sqlite.select<{ value: string }>(
    "SELECT value FROM settings WHERE key = ?",
    [key]
  );
  return rows.length > 0 ? rows[0].value : null;
}

/**
 * Write a setting to SQLite.
 */
export async function setSetting(key: string, value: string): Promise<void> {
  const sqlite = await getSqlite();
  if (!sqlite) return;

  await sqlite.execute(
    "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
    [key, value]
  );
}
