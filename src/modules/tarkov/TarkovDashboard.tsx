import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router-dom";
import { tarkovDb } from "./data/tarkovDb";
import { db } from "@/shared/db/dexieInstance";
import { useTarkovStore } from "./stores/tarkovStore";
import { EDITIONS, GAME_MODES, type GameEdition, type GameMode } from "./utils/editions";
import { setApiGameMode } from "./data/tarkovApi";
import { syncManager } from "@/shared/sync/SyncManager";
import { formatPrice, FLEA_MARKET } from "./utils/currency";
import { SkeletonList } from "@/shared/ui/Skeleton";
import Collapsible from "@/shared/ui/Collapsible";
import ExternalLink from "@/shared/ui/ExternalLink";
import { showToast } from "@/shared/ui/Toast";
import { getAvailableTasks } from "./utils/taskStatus";
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
  const [showProfileModal, setShowProfileModal] = useState(false);

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
  const edition = useTarkovStore((s) => s.edition);
  const gameMode = useTarkovStore((s) => s.gameMode);
  const playerLevel = useTarkovStore((s) => s.playerLevel);

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
      getAvailableTasks(tasks, completedTasks, playerLevel)
        .sort((a, b) => a.minPlayerLevel - b.minPlayerLevel)
        .slice(0, 8),
    [tasks, completedTasks, playerLevel]
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
          onClick={() => setShowProfileModal(true)}
          className="rounded-md bg-bg-secondary border border-border px-4 py-2
                     text-sm text-text-secondary hover:bg-bg-tertiary hover:text-text-primary
                     transition-colors flex items-center gap-2"
        >
          <span>{EDITIONS[edition].label}</span>
          <span className="text-text-muted">·</span>
          <span>{GAME_MODES[gameMode]}</span>
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
                      className="flex items-center gap-3 rounded-lg bg-bg-secondary border border-border px-3 py-2"
                    >
                      <img src={item.iconLink} alt={item.shortName} className="h-8 w-8 object-contain rounded bg-bg-tertiary p-0.5" loading="lazy" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary truncate">{item.shortName}</p>
                        <p className="text-xs text-text-muted">{buy ? `${buy.vendor} · ${formatPrice(buy.price, buy.currency)}` : "Flea only"}</p>
                      </div>
                      <button
                        onClick={() => togglePinItem(item.id)}
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

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal onClose={() => setShowProfileModal(false)} />
      )}
    </div>
  );
}

function ProfileModal({ onClose }: { onClose: () => void }) {
  const edition = useTarkovStore((s) => s.edition);
  const gameMode = useTarkovStore((s) => s.gameMode);
  const playerLevel = useTarkovStore((s) => s.playerLevel);
  const setEdition = useTarkovStore((s) => s.setEdition);
  const setGameMode = useTarkovStore((s) => s.setGameMode);
  const setPlayerLevel = useTarkovStore((s) => s.setPlayerLevel);

  const handleEditionChange = (newEdition: GameEdition) => {
    setEdition(newEdition);
    showToast(`Edition set to ${EDITIONS[newEdition].label}`, "success");
  };

  const handleModeChange = (newMode: GameMode) => {
    setGameMode(newMode);
    setApiGameMode(newMode);
    showToast(`Switched to ${GAME_MODES[newMode]}. Syncing...`, "info", 3000);
    syncManager.sync();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-50 w-full max-w-lg max-h-[80vh] overflow-y-auto
                      rounded-xl bg-bg-primary border border-border shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between p-5 bg-bg-primary border-b border-border">
          <h2 className="text-lg font-bold text-text-primary">Tarkov Profile</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary text-lg transition-colors">✕</button>
        </div>

        <div className="p-5 space-y-6">
          {/* Player Level */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-2">Player Level</h3>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={79}
                value={playerLevel}
                onChange={(e) => setPlayerLevel(parseInt(e.target.value))}
                className="flex-1 accent-accent"
              />
              <input
                type="number"
                min={1}
                max={79}
                value={playerLevel}
                onChange={(e) => setPlayerLevel(parseInt(e.target.value) || 1)}
                className="w-16 rounded-md bg-bg-secondary border border-border px-2 py-1
                           text-sm text-text-primary text-center focus:outline-none focus:border-accent"
              />
            </div>
            <p className="text-[10px] text-text-muted mt-1">
              Affects which tasks are available to you.
            </p>
          </div>

          {/* Game Mode */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-2">Game Mode</h3>
            <div className="flex gap-3">
              {(Object.entries(GAME_MODES) as [GameMode, string][]).map(([mode, label]) => (
                <button
                  key={mode}
                  onClick={() => handleModeChange(mode)}
                  className={`flex-1 rounded-lg border p-3 text-center transition-colors ${
                    gameMode === mode
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-border bg-bg-secondary text-text-secondary hover:border-border-hover"
                  }`}
                >
                  <p className="text-sm font-bold">{label}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">
                    {mode === "regular" ? "Standard mode" : "Separate progression"}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Edition */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-2">Game Edition</h3>
            <div className="space-y-1.5">
              {(Object.entries(EDITIONS) as [GameEdition, (typeof EDITIONS)[GameEdition]][]).map(
                ([key, config]) => (
                  <button
                    key={key}
                    onClick={() => handleEditionChange(key)}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 transition-colors text-left ${
                      edition === key
                        ? "border-accent bg-accent-soft"
                        : "border-border bg-bg-secondary hover:border-border-hover"
                    }`}
                  >
                    <div>
                      <p className={`text-sm ${edition === key ? "text-accent font-medium" : "text-text-primary"}`}>
                        {config.label}
                      </p>
                      <p className="text-[10px] text-text-muted">
                        Stash Lvl {config.stashLevel} · {config.container}
                        {config.traderRepBonus > 0 && ` · +${config.traderRepBonus} rep`}
                      </p>
                    </div>
                    {edition === key && <span className="text-accent text-xs">✓</span>}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TarkovDashboard;
