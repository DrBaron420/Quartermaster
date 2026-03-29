import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { tarkovDb } from "../data/tarkovDb";
import { useTarkovStore } from "../stores/tarkovStore";
import { EDITIONS } from "../utils/editions";
import SearchInput from "@/shared/ui/SearchInput";
import LoadingSpinner from "@/shared/ui/LoadingSpinner";
import type { HideoutStation, HideoutLevel } from "../types/hideout";

function formatTime(seconds: number): string {
  if (seconds === 0) return "Instant";
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

type LevelStatus = "completed" | "available" | "locked";

function HideoutPage() {
  const [search, setSearch] = useState("");
  const [showCompleted, setShowCompleted] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"all" | "available" | "locked">("available");

  const completedLevels = useTarkovStore((s) => s.completedHideoutLevels);
  const toggleLevel = useTarkovStore((s) => s.toggleHideoutLevel);
  const edition = useTarkovStore((s) => s.edition);

  const editionConfig = EDITIONS[edition];

  const queryResult = useLiveQuery(() => tarkovDb.hideout.toArray());
  const isLoading = queryResult === undefined;
  const allStations = queryResult ?? [];

  /** Check if a specific station level is completed (manually or via edition) */
  const isLevelCompleted = (station: HideoutStation, level: number): boolean => {
    // Edition auto-completes stash levels
    if (station.name === "Stash" && level <= editionConfig.stashLevel) return true;
    return completedLevels.includes(`${station.id}:${level}`);
  };

  /** Check if a station level's prerequisites are met */
  const isLevelAvailable = (level: HideoutLevel): boolean => {
    // Check station prerequisites
    for (const req of level.stationLevelRequirements) {
      const reqStation = allStations.find((s) => s.name === req.stationName);
      if (!reqStation) return false;
      // Need all levels up to req.level to be completed
      for (let i = 1; i <= req.level; i++) {
        if (!isLevelCompleted(reqStation, i)) return false;
      }
    }
    return true;
  };

  /** Get the status of a level */
  const getLevelStatus = (station: HideoutStation, level: HideoutLevel): LevelStatus => {
    if (isLevelCompleted(station, level.level)) return "completed";
    if (isLevelAvailable(level)) return "available";
    return "locked";
  };

  const filtered = useMemo(() => {
    let result = allStations;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(q));
    }
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [allStations, search]);

  // Progress stats
  const totalLevels = allStations.reduce((acc, s) => acc + s.levels.length, 0);
  const completedCount = allStations.reduce(
    (acc, s) => acc + s.levels.filter((l) => isLevelCompleted(s, l.level)).length,
    0
  );

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Hideout Tracker</h1>
        <div className="flex justify-center py-12">
          <LoadingSpinner label="Loading hideout data..." />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Hideout Tracker</h1>
      <p className="text-text-secondary mb-1">
        {completedCount} / {totalLevels} upgrades completed
      </p>
      <p className="text-xs text-text-muted mb-4">
        Edition: {editionConfig.label} (Stash starts at Lvl {editionConfig.stashLevel})
      </p>

      {/* Progress bar */}
      <div className="mb-4 max-w-2xl">
        <div className="h-2 rounded-full bg-bg-tertiary overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${totalLevels > 0 ? (completedCount / totalLevels) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 max-w-3xl">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <SearchInput value={search} onChange={setSearch} placeholder="Search stations..." />
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden">
          {(["all", "available", "locked"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-2 text-sm capitalize transition-colors ${
                filterStatus === status
                  ? "bg-accent text-white"
                  : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className={`rounded-lg px-4 py-2 text-sm border transition-colors ${
            showCompleted
              ? "bg-bg-secondary border-border text-text-secondary"
              : "bg-accent/20 border-accent text-accent"
          }`}
        >
          {showCompleted ? "Showing completed" : "Hiding completed"}
        </button>
      </div>

      {/* Station grid */}
      {filtered.length === 0 ? (
        <div className="rounded-lg bg-bg-secondary border border-border p-8 text-center text-sm text-text-muted">
          {allStations.length === 0
            ? "No hideout data cached yet. Wait for sync."
            : "No stations match your search."}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 max-w-5xl">
          {filtered.map((station) => (
            <StationCard
              key={station.id}
              station={station}
              allStations={allStations}
              showCompleted={showCompleted}
              filterStatus={filterStatus}
              isLevelCompleted={(level) => isLevelCompleted(station, level)}
              getLevelStatus={(level) => getLevelStatus(station, level)}
              onToggleLevel={(level) => {
                // Don't allow toggling edition-provided stash levels
                if (station.name === "Stash" && level <= editionConfig.stashLevel) return;
                toggleLevel(station.id, level);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StationCard({
  station,
  allStations,
  showCompleted,
  filterStatus,
  isLevelCompleted,
  getLevelStatus,
  onToggleLevel,
}: {
  station: HideoutStation;
  allStations: HideoutStation[];
  showCompleted: boolean;
  filterStatus: "all" | "available" | "locked";
  isLevelCompleted: (level: number) => boolean;
  getLevelStatus: (level: HideoutLevel) => LevelStatus;
  onToggleLevel: (level: number) => void;
}) {
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);

  const stationCompleted = station.levels.filter((l) => isLevelCompleted(l.level)).length;
  const allDone = stationCompleted === station.levels.length;

  const visibleLevels = station.levels.filter((l) => {
    const status = getLevelStatus(l);
    if (!showCompleted && status === "completed") return false;
    if (filterStatus === "available" && status !== "available") return false;
    if (filterStatus === "locked" && status !== "locked") return false;
    return true;
  });

  if (visibleLevels.length === 0 && filterStatus !== "all") return null;
  if (!showCompleted && allDone) return null;

  const statusColors: Record<LevelStatus, string> = {
    completed: "bg-accent border-accent text-white",
    available: "border-success hover:border-success",
    locked: "border-border/50 opacity-50",
  };

  const statusBadge: Record<LevelStatus, { label: string; color: string }> = {
    completed: { label: "Done", color: "text-accent" },
    available: { label: "Available", color: "text-success" },
    locked: { label: "Locked", color: "text-text-muted" },
  };

  return (
    <div className={`rounded-lg border p-4 transition-colors ${
      allDone ? "bg-bg-secondary/50 border-border/50" : "bg-bg-secondary border-border"
    }`}>
      {/* Station header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">{station.name}</h3>
          <p className="text-xs text-text-muted">
            {stationCompleted} / {station.levels.length} levels
          </p>
        </div>
        {allDone && (
          <span className="rounded-full bg-success/20 px-2 py-0.5 text-[10px] text-success font-medium">
            Complete
          </span>
        )}
      </div>

      {/* Level progress dots */}
      <div className="flex gap-1 mb-3">
        {station.levels.map((l) => {
          const status = getLevelStatus(l);
          return (
            <div
              key={l.level}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                status === "completed" ? "bg-accent" :
                status === "available" ? "bg-success/50" :
                "bg-bg-tertiary"
              }`}
            />
          );
        })}
      </div>

      {/* Levels */}
      <div className="space-y-1.5">
        {(visibleLevels.length > 0 ? visibleLevels : station.levels).map((level) => {
          const status = getLevelStatus(level);
          const isDone = status === "completed";
          const isLocked = status === "locked";
          const isExpanded = expandedLevel === level.level;
          const badge = statusBadge[status];

          return (
            <div key={level.level}>
              <div
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors ${
                  isLocked ? "opacity-60" : "cursor-pointer hover:bg-bg-tertiary/50"
                }`}
                onClick={() => !isLocked && setExpandedLevel(isExpanded ? null : level.level)}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isLocked) onToggleLevel(level.level);
                  }}
                  disabled={isLocked}
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors ${
                    isDone ? statusColors.completed :
                    isLocked ? "border-border/50 cursor-not-allowed" :
                    "border-border hover:border-accent"
                  }`}
                >
                  {isDone && (
                    <svg className="w-2.5 h-2.5" viewBox="0 0 12 12">
                      <path d="M10 3L4.5 8.5 2 6" stroke="currentColor" strokeWidth="2" fill="none" />
                    </svg>
                  )}
                </button>
                <span className={`flex-1 text-xs ${isDone ? "line-through text-text-muted" : isLocked ? "text-text-muted" : "text-text-primary"}`}>
                  Level {level.level}
                </span>
                <span className={`text-[10px] ${badge.color}`}>{badge.label}</span>
                <span className="text-[10px] text-text-muted">
                  {formatTime(level.constructionTime)}
                </span>
                {!isLocked && (
                  <span className="text-text-muted text-xs">{isExpanded ? "▲" : "▼"}</span>
                )}
              </div>

              {isExpanded && !isLocked && (
                <LevelDetail level={level} isLevelCompleted={(stationName, lvl) => {
                  const s = allStations.find((st) => st.name === stationName);
                  if (!s) return false;
                  // Check both manual completion and edition stash
                  return s.levels.some((sl) => sl.level === lvl) && (
                    (s.name === "Stash" && lvl <= (EDITIONS[useTarkovStore.getState().edition].stashLevel)) ||
                    useTarkovStore.getState().completedHideoutLevels.includes(`${s.id}:${lvl}`)
                  );
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LevelDetail({
  level,
  isLevelCompleted,
}: {
  level: HideoutLevel;
  isLevelCompleted: (stationName: string, level: number) => boolean;
}) {
  return (
    <div className="ml-6 mt-2 mb-2 space-y-3 text-xs">
      {level.description && (
        <p className="text-text-muted italic">{level.description}</p>
      )}

      {/* Station prerequisites */}
      {level.stationLevelRequirements.length > 0 && (
        <div>
          <p className="text-text-muted font-semibold mb-1">Requires stations:</p>
          {level.stationLevelRequirements.map((req, i) => {
            const met = isLevelCompleted(req.stationName, req.level);
            return (
              <p key={i} className={`ml-2 ${met ? "text-success" : "text-error"}`}>
                {met ? "✓" : "✗"} {req.stationName} Lvl {req.level}
              </p>
            );
          })}
        </div>
      )}

      {/* Item requirements */}
      {level.itemRequirements.length > 0 && (
        <div>
          <p className="text-text-muted font-semibold mb-1">Items needed:</p>
          <div className="space-y-1">
            {level.itemRequirements.map((req, i) => (
              <div key={i} className="flex items-center gap-2">
                <img
                  src={req.itemIcon}
                  alt={req.itemShortName}
                  className="h-5 w-5 object-contain rounded bg-bg-tertiary p-0.5"
                  loading="lazy"
                />
                <span className="text-text-secondary">{req.itemShortName}</span>
                <span className="text-text-muted">×{req.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skill requirements */}
      {level.skillRequirements.length > 0 && (
        <div>
          <p className="text-text-muted font-semibold mb-1">Requires skills:</p>
          {level.skillRequirements.map((req, i) => (
            <p key={i} className="text-text-secondary ml-2">
              {req.name} Lvl {req.level}
            </p>
          ))}
        </div>
      )}

      {/* Trader requirements */}
      {level.traderRequirements.length > 0 && (
        <div>
          <p className="text-text-muted font-semibold mb-1">Requires traders:</p>
          {level.traderRequirements.map((req, i) => (
            <p key={i} className="text-text-secondary ml-2">
              {req.traderName} LL{req.level}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default HideoutPage;
