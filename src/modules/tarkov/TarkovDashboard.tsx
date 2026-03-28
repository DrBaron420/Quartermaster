import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router-dom";
import { tarkovDb } from "./data/tarkovDb";
import { db } from "@/shared/db/dexieInstance";
import { syncManager } from "@/shared/sync/SyncManager";
import { SkeletonList } from "@/shared/ui/Skeleton";
import type { TarkovItem } from "./types/items";

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function bestFleaPrice(item: TarkovItem): number {
  const flea = item.sellFor.find((p) => p.vendor === "Flea Market");
  return flea?.price ?? 0;
}

function StatCard({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string | number;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`rounded-lg bg-bg-secondary p-4 border border-border text-left
        ${onClick ? "hover:border-accent/50 cursor-pointer" : "cursor-default"}
        transition-colors`}
    >
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-sm text-text-muted">{label}</p>
    </button>
  );
}

function TarkovDashboard() {
  const navigate = useNavigate();
  const allItems = useLiveQuery(() => tarkovDb.items.toArray());
  const ammoCount = useLiveQuery(() => tarkovDb.ammo.count());
  const syncMeta = useLiveQuery(() => db.syncMeta.get("tarkov-items"));

  const isLoading = allItems === undefined;
  const items = allItems ?? [];

  // Top 5 most expensive items on flea
  const topItems = useMemo(() => {
    return [...items]
      .sort((a, b) => bestFleaPrice(b) - bestFleaPrice(a))
      .slice(0, 5);
  }, [items]);

  // Category breakdown
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      const cat = item.categories[0] ?? "Unknown";
      counts[cat] = (counts[cat] ?? 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [items]);

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Escape from Tarkov</h1>
        <SkeletonList count={4} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Escape from Tarkov</h1>
        <button
          onClick={() => syncManager.sync()}
          className="rounded-md bg-bg-secondary border border-border px-4 py-2
                     text-sm text-text-secondary hover:bg-bg-tertiary hover:text-text-primary
                     transition-colors"
        >
          Sync Now
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6 max-w-2xl lg:grid-cols-4">
        <StatCard
          label="Items cached"
          value={items.length.toLocaleString()}
          onClick={() => navigate("items")}
        />
        <StatCard
          label="Ammo types"
          value={(ammoCount ?? 0).toLocaleString()}
          onClick={() => navigate("ammo")}
        />
        <StatCard
          label="Categories"
          value={categoryCounts.length.toString()}
        />
        <StatCard
          label="Last sync"
          value={syncMeta ? formatTimeAgo(syncMeta.lastSyncedAt) : "Never"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 max-w-4xl">
        {/* Top flea market items */}
        {topItems.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
              Most Expensive (Flea)
            </h2>
            <div className="space-y-2">
              {topItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg bg-bg-secondary border border-border p-3"
                >
                  <img
                    src={item.iconLink}
                    alt={item.shortName}
                    className="h-8 w-8 object-contain rounded bg-bg-tertiary p-0.5"
                    loading="lazy"
                  />
                  <span className="flex-1 text-sm text-text-primary truncate">
                    {item.shortName}
                  </span>
                  <span className="text-sm font-medium text-text-primary">
                    {"₽" + bestFleaPrice(item).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category breakdown */}
        {categoryCounts.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
              Top Categories
            </h2>
            <div className="space-y-1">
              {categoryCounts.map(([cat, count]) => {
                const pct = Math.round((count / items.length) * 100);
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-sm text-text-secondary w-32 truncate">
                      {cat}
                    </span>
                    <div className="flex-1 h-5 rounded bg-bg-tertiary overflow-hidden">
                      <div
                        className="h-full rounded bg-accent/60"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-text-muted w-12 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TarkovDashboard;
