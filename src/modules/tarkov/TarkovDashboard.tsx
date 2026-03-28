import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router-dom";
import { tarkovDb } from "./data/tarkovDb";
import { db } from "@/shared/db/dexieInstance";
import { syncManager } from "@/shared/sync/SyncManager";
import { useTarkovStore } from "./stores/tarkovStore";
import { SkeletonList } from "@/shared/ui/Skeleton";
import Collapsible from "@/shared/ui/Collapsible";
import ExternalLink from "@/shared/ui/ExternalLink";
import ItemDetail from "./components/ItemDetail";
import { formatPrice, FLEA_MARKET } from "./utils/currency";
import type { TarkovItem } from "./types/items";

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function bestBuyInfo(item: TarkovItem): { price: number; priceRUB: number; vendor: string; currency: string; minTraderLevel: number | null } | null {
  const buys = item.buyFor.filter((p) => p.vendor !== FLEA_MARKET);
  if (buys.length === 0) return null;
  return buys.reduce((a, b) => ((a.priceRUB ?? a.price) < (b.priceRUB ?? b.price) ? a : b));
}

function TarkovDashboard() {
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState<TarkovItem | null>(null);

  const allItems = useLiveQuery(() => tarkovDb.items.toArray());
  const allAmmo = useLiveQuery(() => tarkovDb.ammo.toArray());
  const allTasks = useLiveQuery(() => tarkovDb.tasks.toArray());
  const allHideout = useLiveQuery(() => tarkovDb.hideout.toArray());
  const syncMeta = useLiveQuery(() => db.syncMeta.get("tarkov-items"));

  const pinnedItemIds = useTarkovStore((s) => s.pinnedItems);
  const pinnedAmmoIds = useTarkovStore((s) => s.pinnedAmmo);
  const completedTasks = useTarkovStore((s) => s.completedTasks);
  const completedHideoutLevels = useTarkovStore((s) => s.completedHideoutLevels);
  const togglePinItem = useTarkovStore((s) => s.togglePinItem);
  const togglePinAmmo = useTarkovStore((s) => s.togglePinAmmo);

  const isLoading = allItems === undefined;
  const items = allItems ?? [];
  const ammo = allAmmo ?? [];
  const tasks = allTasks ?? [];
  const hideout = allHideout ?? [];

  const pinnedItems = useMemo(
    () => items.filter((i) => pinnedItemIds.includes(i.id)),
    [items, pinnedItemIds]
  );
  const pinnedAmmo = useMemo(
    () => ammo.filter((a) => pinnedAmmoIds.includes(a.id)),
    [ammo, pinnedAmmoIds]
  );

  const activeTasks = useMemo(
    () =>
      tasks
        .filter((t) => !completedTasks.includes(t.id))
        .sort((a, b) => a.minPlayerLevel - b.minPlayerLevel)
        .slice(0, 8),
    [tasks, completedTasks]
  );

  const totalHideoutLevels = hideout.reduce((acc, s) => acc + s.levels.length, 0);
  const taskCompletedCount = tasks.filter((t) => completedTasks.includes(t.id)).length;

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <SkeletonList count={4} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button
          onClick={() => syncManager.sync()}
          className="rounded-md bg-bg-secondary border border-border px-4 py-2
                     text-sm text-text-secondary hover:bg-bg-tertiary hover:text-text-primary
                     transition-colors"
        >
          Sync Now
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 mb-6 max-w-3xl lg:grid-cols-4">
        <button onClick={() => navigate("tasks")} className="rounded-lg bg-bg-secondary border border-border p-3 text-left hover:border-accent/50 transition-colors">
          <p className="text-xl font-bold text-text-primary">{taskCompletedCount}/{tasks.length}</p>
          <p className="text-xs text-text-muted">Tasks done</p>
        </button>
        <button onClick={() => navigate("hideout")} className="rounded-lg bg-bg-secondary border border-border p-3 text-left hover:border-accent/50 transition-colors">
          <p className="text-xl font-bold text-text-primary">{completedHideoutLevels.length}/{totalHideoutLevels}</p>
          <p className="text-xs text-text-muted">Hideout upgrades</p>
        </button>
        <button onClick={() => navigate("items")} className="rounded-lg bg-bg-secondary border border-border p-3 text-left hover:border-accent/50 transition-colors">
          <p className="text-xl font-bold text-text-primary">{items.length.toLocaleString()}</p>
          <p className="text-xs text-text-muted">Items cached</p>
        </button>
        <div className="rounded-lg bg-bg-secondary border border-border p-3">
          <p className="text-xl font-bold text-text-primary">{syncMeta ? formatTimeAgo(syncMeta.lastSyncedAt) : "Never"}</p>
          <p className="text-xs text-text-muted">Last sync</p>
        </div>
      </div>

      <div className="space-y-6 max-w-5xl">

        {/* ── Pinned Ammo (top) ── */}
        <Collapsible
          title="Pinned Ammo"
          count={pinnedAmmo.length}
          action={
            <button onClick={() => navigate("ammo")} className="text-xs text-accent hover:text-accent-hover transition-colors">
              Browse ammo →
            </button>
          }
        >
          {pinnedAmmo.length === 0 ? (
            <div className="rounded-lg bg-bg-secondary border border-border p-4 text-sm text-text-muted italic">
              Pin ammo from the Ammo page to track your favorites here.
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {pinnedAmmo.map((round) => {
                const ammoItem = items.find((i) => i.id === round.id);
                const buy = ammoItem ? bestBuyInfo(ammoItem) : null;
                return (
                  <div key={round.id} className="rounded-lg bg-bg-secondary border border-border p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <img src={round.iconLink} alt={round.shortName} className="h-7 w-7 object-contain rounded bg-bg-tertiary p-0.5" loading="lazy" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{round.shortName}</p>
                        <p className="text-xs text-text-muted">
                          {buy
                            ? `${buy.vendor} LL${buy.minTraderLevel ?? "?"} · ${formatPrice(buy.price, buy.currency)}/rd`
                            : "Flea market only"}
                        </p>
                      </div>
                      <button onClick={() => togglePinAmmo(round.id)} className="text-warning hover:text-text-muted transition-colors text-sm">★</button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="rounded bg-bg-tertiary/50 py-1.5">
                        <p className="text-base font-mono font-bold text-text-primary">{round.penetrationPower}</p>
                        <p className="text-[10px] text-text-muted uppercase">Pen</p>
                      </div>
                      <div className="rounded bg-bg-tertiary/50 py-1.5">
                        <p className="text-base font-mono font-bold text-text-primary">{round.damage}</p>
                        <p className="text-[10px] text-text-muted uppercase">Dmg</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Collapsible>

        <div className="grid gap-6 lg:grid-cols-2">

          {/* ── Shopping List ── */}
          <Collapsible
            title="Shopping List"
            count={pinnedItems.length}
            action={
              <button onClick={() => navigate("items")} className="text-xs text-accent hover:text-accent-hover transition-colors">
                Browse items →
              </button>
            }
          >
            {pinnedItems.length === 0 ? (
              <div className="rounded-lg bg-bg-secondary border border-border p-4 text-sm text-text-muted italic">
                Pin items from the Items page to build your shopping list.
              </div>
            ) : (
              <div className="space-y-1.5">
                {pinnedItems.map((item) => {
                  const buy = bestBuyInfo(item);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-lg bg-bg-secondary border border-border px-3 py-2 cursor-pointer hover:border-border-hover transition-colors"
                      onClick={() => setSelectedItem(item)}
                    >
                      <img src={item.iconLink} alt={item.shortName} className="h-8 w-8 object-contain rounded bg-bg-tertiary p-0.5" loading="lazy" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary truncate">{item.shortName}</p>
                        <p className="text-xs text-text-muted">{buy ? `${buy.vendor} · ${formatPrice(buy.price)}` : "Flea only"}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePinItem(item.id); }}
                        className="text-warning hover:text-text-muted transition-colors text-sm shrink-0"
                      >
                        ★
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </Collapsible>

          {/* ── Active Tasks ── */}
          <Collapsible
            title="Active Tasks"
            count={activeTasks.length}
            action={
              <button onClick={() => navigate("tasks")} className="text-xs text-accent hover:text-accent-hover transition-colors">
                View all →
              </button>
            }
          >
            {activeTasks.length === 0 ? (
              <div className="rounded-lg bg-bg-secondary border border-border p-4 text-sm text-text-muted italic">
                {tasks.length === 0 ? "Waiting for sync..." : "All tasks completed!"}
              </div>
            ) : (
              <div className="space-y-1.5">
                {activeTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 rounded-lg bg-bg-secondary border border-border px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary truncate">{task.name}</p>
                      <p className="text-xs text-text-muted">
                        {task.trader} · Lvl {task.minPlayerLevel}+{task.map ? ` · ${task.map}` : ""}
                      </p>
                    </div>
                    {task.wikiLink && (
                      <ExternalLink href={task.wikiLink} className="text-xs text-accent hover:text-accent-hover shrink-0">
                        Wiki
                      </ExternalLink>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Collapsible>

        </div>
      </div>

      {selectedItem && (
        <ItemDetail item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
}

export default TarkovDashboard;
