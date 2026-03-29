import { useTarkovStore } from "../stores/tarkovStore";
import { EDITIONS, GAME_MODES, type GameEdition, type GameMode } from "../utils/editions";
import { syncManager } from "@/shared/sync/SyncManager";
import { setApiGameMode } from "../data/tarkovApi";
import { showToast } from "@/shared/ui/Toast";

function ProfilePage() {
  const edition = useTarkovStore((s) => s.edition);
  const gameMode = useTarkovStore((s) => s.gameMode);
  const setEdition = useTarkovStore((s) => s.setEdition);
  const setGameMode = useTarkovStore((s) => s.setGameMode);
  const completedHideoutLevels = useTarkovStore((s) => s.completedHideoutLevels);
  const completedTasks = useTarkovStore((s) => s.completedTasks);

  const currentEdition = EDITIONS[edition];

  const handleEditionChange = (newEdition: GameEdition) => {
    setEdition(newEdition);
    showToast(`Edition set to ${EDITIONS[newEdition].label}`, "success");
  };

  const handleModeChange = (newMode: GameMode) => {
    setGameMode(newMode);
    setApiGameMode(newMode);
    showToast(`Switched to ${GAME_MODES[newMode]} mode. Syncing fresh data...`, "info", 3000);
    // Re-sync to get mode-specific data (different flea prices, task names)
    syncManager.sync();
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Profile</h1>
      <p className="text-text-secondary mb-6">
        Configure your Tarkov edition and game mode.
      </p>

      {/* Game Mode */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-text-primary">Game Mode</h2>
        <div className="flex gap-3">
          {(Object.entries(GAME_MODES) as [GameMode, string][]).map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => handleModeChange(mode)}
              className={`flex-1 rounded-lg border p-4 text-center transition-colors ${
                gameMode === mode
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-border bg-bg-secondary text-text-secondary hover:border-border-hover"
              }`}
            >
              <p className="text-lg font-bold">{label}</p>
              <p className="text-xs text-text-muted mt-1">
                {mode === "regular"
                  ? "Player vs Player — standard mode"
                  : "Player vs Environment — separate progression"}
              </p>
            </button>
          ))}
        </div>
        <p className="text-xs text-text-muted mt-2">
          PvP and PvE have separate economies and progression. Changing mode will re-sync data.
        </p>
      </section>

      {/* Game Edition */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-text-primary">Game Edition</h2>
        <div className="space-y-2">
          {(Object.entries(EDITIONS) as [GameEdition, typeof currentEdition][]).map(
            ([key, config]) => (
              <button
                key={key}
                onClick={() => handleEditionChange(key)}
                className={`flex w-full items-center justify-between rounded-lg border p-4 transition-colors text-left ${
                  edition === key
                    ? "border-accent bg-accent-soft"
                    : "border-border bg-bg-secondary hover:border-border-hover"
                }`}
              >
                <div>
                  <p className={`text-sm font-medium ${edition === key ? "text-accent" : "text-text-primary"}`}>
                    {config.label}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    Stash Lvl {config.stashLevel} · {config.container}
                    {config.traderRepBonus > 0 && ` · +${config.traderRepBonus} trader rep`}
                  </p>
                </div>
                {edition === key && (
                  <span className="text-accent text-sm">Selected</span>
                )}
              </button>
            )
          )}
        </div>
        <p className="text-xs text-text-muted mt-2">
          Your edition determines starting stash level and secure container.
          Hideout stash upgrades below your edition level will be auto-completed.
        </p>
      </section>

      {/* Progress Summary */}
      <section>
        <h2 className="text-lg font-semibold mb-3 text-text-primary">Progress Summary</h2>
        <div className="rounded-lg bg-bg-secondary border border-border p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Edition</span>
            <span className="text-text-primary">{currentEdition.label}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Mode</span>
            <span className="text-text-primary">{GAME_MODES[gameMode]}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Starting Container</span>
            <span className="text-text-primary">{currentEdition.container}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Tasks Completed</span>
            <span className="text-text-primary">{completedTasks.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Hideout Upgrades</span>
            <span className="text-text-primary">{completedHideoutLevels.length}</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ProfilePage;
