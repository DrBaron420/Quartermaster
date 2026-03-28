import { db } from "../db/dexieInstance";
import { getSqlite, initSqliteSchema, getSetting, setSetting } from "../db/sqliteBridge";
import { showToast } from "../ui/Toast";

export type SyncStatus = "idle" | "syncing" | "error" | "offline";

interface SyncState {
  status: SyncStatus;
  lastSyncedAt: number | null;
  error: string | null;
}

type SyncListener = (state: SyncState) => void;

/**
 * SyncManager orchestrates the online/offline data flow:
 *
 * 1. On app launch: SQLite → Dexie (hydrate UI cache from disk)
 * 2. When online: API → SQLite → Dexie (fetch fresh data, persist, update UI)
 * 3. When offline: Dexie serves cached data (no API calls)
 * 4. On reconnect: delta sync (fetch only what changed)
 *
 * This is the skeleton — individual modules register their own sync
 * handlers that know how to fetch and store their specific data.
 */
class SyncManager {
  private state: SyncState = {
    status: "idle",
    lastSyncedAt: null,
    error: null,
  };

  private listeners: Set<SyncListener> = new Set();
  private syncHandlers: Map<string, () => Promise<void>> = new Map();

  /** Subscribe to sync state changes */
  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  /** Get current sync state */
  getState(): SyncState {
    return this.state;
  }

  /**
   * Register a sync handler for a specific data source.
   * Modules call this to plug their own sync logic into the manager.
   */
  registerHandler(sourceId: string, handler: () => Promise<void>): void {
    this.syncHandlers.set(sourceId, handler);
  }

  /** Unregister a sync handler */
  unregisterHandler(sourceId: string): void {
    this.syncHandlers.delete(sourceId);
  }

  /**
   * Initialize: set up SQLite schema and hydrate Dexie from SQLite.
   * Called once on app startup.
   */
  async initialize(): Promise<void> {
    try {
      await initSqliteSchema();
      await this.hydrateFromSqlite();

      // Restore last sync timestamp from SQLite
      const lastSync = await getSetting("lastSyncedAt");
      if (lastSync) {
        this.updateState({ lastSyncedAt: parseInt(lastSync, 10) });
      }
    } catch (err) {
      console.error("SyncManager init failed:", err);
      this.updateState({
        status: "error",
        error: err instanceof Error ? err.message : "Init failed",
      });
    }
  }

  /**
   * Run a full sync cycle: call all registered sync handlers.
   * Only runs when online.
   */
  async sync(): Promise<void> {
    if (!navigator.onLine) {
      this.updateState({ status: "offline" });
      return;
    }

    if (this.syncHandlers.size === 0) {
      // Nothing to sync yet
      return;
    }

    this.updateState({ status: "syncing", error: null });

    try {
      for (const [sourceId, handler] of this.syncHandlers) {
        console.log(`[Sync] Running handler: ${sourceId}`);
        await handler();
      }

      const now = Date.now();
      this.updateState({ status: "idle", lastSyncedAt: now });
      await setSetting("lastSyncedAt", now.toString());
      showToast("Data synced successfully", "success");
    } catch (err) {
      console.error("[Sync] Error:", err);
      const message = err instanceof Error ? err.message : "Sync failed";
      this.updateState({ status: "error", error: message });
      showToast(`Sync failed: ${message}. Using cached data.`, "error", 6000);
    }
  }

  /**
   * Hydrate Dexie (UI cache) from SQLite (disk storage).
   * For now this handles syncMeta. Modules will add their own
   * hydration logic when they register.
   */
  private async hydrateFromSqlite(): Promise<void> {
    const sqlite = await getSqlite();
    if (!sqlite) return; // Not in Tauri, skip hydration

    try {
      const rows = await sqlite.select<{
        id: string;
        last_synced_at: number;
        record_count: number;
      }>("SELECT * FROM sync_meta");

      if (rows.length > 0) {
        await db.syncMeta.bulkPut(
          rows.map((row) => ({
            id: row.id,
            lastSyncedAt: row.last_synced_at,
            recordCount: row.record_count,
          }))
        );
        console.log(`[Sync] Hydrated ${rows.length} sync_meta records from SQLite`);
      }
    } catch (err) {
      console.error("[Sync] Hydration failed:", err);
    }
  }

  private updateState(partial: Partial<SyncState>): void {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((fn) => fn(this.state));
  }
}

/** Singleton instance */
export const syncManager = new SyncManager();
