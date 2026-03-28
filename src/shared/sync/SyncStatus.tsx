import { useState, useEffect } from "react";
import { syncManager, type SyncStatus as SyncStatusType } from "./SyncManager";

/**
 * Shows the current sync status with last sync time.
 * Designed to sit in the sidebar or status bar.
 */
function SyncStatusBadge() {
  const [status, setStatus] = useState<SyncStatusType>("idle");
  const [lastSynced, setLastSynced] = useState<number | null>(null);

  useEffect(() => {
    return syncManager.subscribe((state) => {
      setStatus(state.status);
      setLastSynced(state.lastSyncedAt);
    });
  }, []);

  const formatTime = (timestamp: number | null): string => {
    if (!timestamp) return "Never";
    const diff = Date.now() - timestamp;
    if (diff < 60_000) return "Just now";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    return `${Math.floor(diff / 3_600_000)}h ago`;
  };

  const statusConfig: Record<
    SyncStatusType,
    { color: string; label: string }
  > = {
    idle: { color: "bg-success", label: "Synced" },
    syncing: { color: "bg-accent", label: "Syncing..." },
    error: { color: "bg-error", label: "Sync error" },
    offline: { color: "bg-warning", label: "Offline" },
  };

  const { color, label } = statusConfig[status];

  return (
    <div className="flex items-center gap-2 text-xs text-text-muted">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <span>{label}</span>
      {lastSynced && (
        <span className="text-text-muted">· {formatTime(lastSynced)}</span>
      )}
    </div>
  );
}

export default SyncStatusBadge;
