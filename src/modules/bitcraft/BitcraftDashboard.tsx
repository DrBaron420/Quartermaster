import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router-dom";
import { bitcraftDb } from "./data/bitcraftDb";
import { db } from "@/shared/db/dexieInstance";
import { useBitcraftStore } from "./stores/bitcraftStore";
import { xpBetweenLevels, xpForLevel, formatXp } from "./utils/xpCalculator";
import Collapsible from "@/shared/ui/Collapsible";
import { SkeletonList } from "@/shared/ui/Skeleton";

function BitcraftDashboard() {
  const navigate = useNavigate();

  const allItems = useLiveQuery(() => bitcraftDb.items.count());
  const allRecipes = useLiveQuery(() => bitcraftDb.recipes.count());
  const syncMeta = useLiveQuery(() => db.syncMeta.get("bitcraft-items"));

  const xpGoals = useBitcraftStore((s) => s.xpGoals);
  const craftList = useBitcraftStore((s) => s.craftList);
  const removeXpGoal = useBitcraftStore((s) => s.removeXpGoal);
  const toggleXpGoalPin = useBitcraftStore((s) => s.toggleXpGoalPin);
  const removeFromCraftList = useBitcraftStore((s) => s.removeFromCraftList);

  const pinnedGoals = useMemo(
    () => xpGoals.filter((g) => g.pinned),
    [xpGoals]
  );

  const isLoading = allItems === undefined;

  if (isLoading) {
    return <SkeletonList count={4} />;
  }

  const lastSync = syncMeta?.lastSyncedAt
    ? new Date(syncMeta.lastSyncedAt).toLocaleString()
    : "Never";

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">BitCraft Dashboard</h1>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 mb-6 lg:grid-cols-4">
        <button
          onClick={() => navigate("items")}
          className="rounded-lg border border-border bg-bg-secondary p-3 text-left transition-colors hover:border-border-hover"
        >
          <p className="text-xl font-bold font-mono">{allItems ?? 0}</p>
          <p className="text-xs text-text-muted">Items Cached</p>
        </button>
        <button
          onClick={() => navigate("crafting")}
          className="rounded-lg border border-border bg-bg-secondary p-3 text-left transition-colors hover:border-border-hover"
        >
          <p className="text-xl font-bold font-mono">{allRecipes ?? 0}</p>
          <p className="text-xs text-text-muted">Recipes</p>
        </button>
        <button
          onClick={() => navigate("calculators")}
          className="rounded-lg border border-border bg-bg-secondary p-3 text-left transition-colors hover:border-border-hover"
        >
          <p className="text-xl font-bold font-mono">{xpGoals.length}</p>
          <p className="text-xs text-text-muted">XP Goals</p>
        </button>
        <div className="rounded-lg border border-border bg-bg-secondary p-3">
          <p className="text-sm font-bold truncate">{lastSync}</p>
          <p className="text-xs text-text-muted">Last Sync</p>
        </div>
      </div>

      {/* Pinned XP Goals */}
      <Collapsible title="Pinned XP Goals" count={pinnedGoals.length}>
        {pinnedGoals.length === 0 ? (
          <p className="text-sm text-text-muted py-4 text-center">
            No pinned goals. Use the Calculators page to add XP goals.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {pinnedGoals.map((goal) => {
              const xpNeeded = xpBetweenLevels(goal.currentLevel, goal.targetLevel);
              const totalXpRange = xpForLevel(goal.targetLevel) - xpForLevel(goal.currentLevel);
              const progress = totalXpRange > 0 ? 0 : 100; // progress tracked externally
              return (
                <div
                  key={goal.id}
                  className="rounded-lg border border-border bg-bg-secondary p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">{goal.profession}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => toggleXpGoalPin(goal.id)}
                        className="text-xs text-warning hover:text-warning/80"
                        title="Unpin"
                      >
                        ★
                      </button>
                      <button
                        onClick={() => removeXpGoal(goal.id)}
                        className="text-xs text-error hover:text-error/80"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-text-secondary">
                    Level {goal.currentLevel} → {goal.targetLevel}
                  </p>
                  <p className="text-xs text-text-muted font-mono">
                    {formatXp(xpNeeded)} XP needed
                  </p>
                  <div className="mt-2 h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Collapsible>

      {/* Craft List */}
      <div className="mt-4">
        <Collapsible title="Craft List" count={craftList.length}>
          {craftList.length === 0 ? (
            <p className="text-sm text-text-muted py-4 text-center">
              No items in craft list. Use the Crafting page to add items.
            </p>
          ) : (
            <div className="space-y-2">
              {craftList.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-bg-secondary p-3"
                >
                  <div>
                    <p className="text-sm font-semibold">{item.itemName}</p>
                    <p className="text-xs text-text-muted">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCraftList(item.id)}
                    className="text-xs text-error hover:text-error/80"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </Collapsible>
      </div>
    </div>
  );
}

export default BitcraftDashboard;
