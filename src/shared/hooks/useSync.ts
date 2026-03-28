import { useEffect, useState } from "react";
import { syncManager, type SyncStatus } from "../sync/SyncManager";
import { useOnlineStatus } from "./useOnlineStatus";
import { useSettingsStore } from "@/core/settings/settingsStore";

/**
 * Hook that manages the sync lifecycle:
 * - Initializes the SyncManager on mount
 * - Runs sync when coming online
 * - Runs periodic sync based on settings interval
 * - Returns current sync status
 */
export function useSync() {
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [lastSynced, setLastSynced] = useState<number | null>(null);
  const isOnline = useOnlineStatus();
  const syncIntervalMinutes = useSettingsStore((s) => s.syncIntervalMinutes);

  // Initialize on mount
  useEffect(() => {
    syncManager.initialize();
  }, []);

  // Subscribe to sync state changes
  useEffect(() => {
    return syncManager.subscribe((state) => {
      setStatus(state.status);
      setLastSynced(state.lastSyncedAt);
    });
  }, []);

  // Sync when coming online
  useEffect(() => {
    if (isOnline) {
      syncManager.sync();
    }
  }, [isOnline]);

  // Periodic sync
  useEffect(() => {
    if (!isOnline) return;

    const intervalMs = syncIntervalMinutes * 60 * 1000;
    const timer = setInterval(() => {
      syncManager.sync();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isOnline, syncIntervalMinutes]);

  return {
    status,
    lastSynced,
    isOnline,
    syncNow: () => syncManager.sync(),
  };
}
