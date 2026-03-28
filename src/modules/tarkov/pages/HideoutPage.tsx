import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { tarkovDb } from "../data/tarkovDb";
import { useTarkovStore } from "../stores/tarkovStore";
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

function HideoutPage() {
  const [search, setSearch] = useState("");
  const [showCompleted, setShowCompleted] = useState(true);

  const completedLevels = useTarkovStore((s) => s.completedHideoutLevels);
  const toggleLevel = useTarkovStore((s) => s.toggleHideoutLevel);

  const queryResult = useLiveQuery(() => tarkovDb.hideout.toArray());
  const isLoading = queryResult === undefined;
  const allStations = queryResult ?? [];

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
  const completedCount = completedLevels.length;

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
      <p className="text-text-secondary mb-4">
        {completedCount} / {totalLevels} upgrades completed
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
      <div className="flex gap-3 mb-6 max-w-2xl">
        <div className="flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search stations..." />
        </div>
        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className={`rounded-lg px-4 py-2 text-sm border transition-colors ${
            showCompleted
              ? "bg-bg-secondary border-border text-text-secondary"
              : "bg-accent/20 border-accent text-accent"
          }`}
        >
          {showCompleted ? "Showing all" : "Hiding completed"}
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
              completedLevels={completedLevels}
              showCompleted={showCompleted}
              onToggleLevel={toggleLevel}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StationCard({
  station,
  completedLevels,
  showCompleted,
  onToggleLevel,
}: {
  station: HideoutStation;
  completedLevels: string[];
  showCompleted: boolean;
  onToggleLevel: (stationId: string, level: number) => void;
}) {
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);

  const stationCompleted = station.levels.filter((l) =>
    completedLevels.includes(`${station.id}:${l.level}`)
  ).length;
  const allDone = stationCompleted === station.levels.length;

  // Find next level to build
  const nextLevel = station.levels.find(
    (l) => !completedLevels.includes(`${station.id}:${l.level}`)
  );

  const visibleLevels = showCompleted
    ? station.levels
    : station.levels.filter((l) => !completedLevels.includes(`${station.id}:${l.level}`));

  if (!showCompleted && visibleLevels.length === 0) return null;

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

      {/* Level mini progress */}
      <div className="flex gap-1 mb-3">
        {station.levels.map((l) => {
          const done = completedLevels.includes(`${station.id}:${l.level}`);
          return (
            <div
              key={l.level}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                done ? "bg-accent" : "bg-bg-tertiary"
              }`}
            />
          );
        })}
      </div>

      {/* Levels */}
      <div className="space-y-1.5">
        {visibleLevels.map((level) => {
          const key = `${station.id}:${level.level}`;
          const isDone = completedLevels.includes(key);
          const isExpanded = expandedLevel === level.level;
          const isNext = nextLevel?.level === level.level;

          return (
            <div key={level.level}>
              <div
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer transition-colors ${
                  isNext ? "bg-accent-soft" : "hover:bg-bg-tertiary/50"
                }`}
                onClick={() => setExpandedLevel(isExpanded ? null : level.level)}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLevel(station.id, level.level);
                  }}
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors ${
                    isDone
                      ? "bg-accent border-accent text-white"
                      : "border-border hover:border-accent"
                  }`}
                >
                  {isDone && (
                    <svg className="w-2.5 h-2.5" viewBox="0 0 12 12">
                      <path d="M10 3L4.5 8.5 2 6" stroke="currentColor" strokeWidth="2" fill="none" />
                    </svg>
                  )}
                </button>
                <span className={`flex-1 text-xs ${isDone ? "line-through text-text-muted" : "text-text-primary"}`}>
                  Level {level.level}
                </span>
                <span className="text-[10px] text-text-muted">
                  {formatTime(level.constructionTime)}
                </span>
                <span className="text-text-muted text-xs">{isExpanded ? "▲" : "▼"}</span>
              </div>

              {isExpanded && (
                <LevelDetail level={level} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LevelDetail({ level }: { level: HideoutLevel }) {
  return (
    <div className="ml-6 mt-2 mb-2 space-y-3 text-xs">
      {level.description && (
        <p className="text-text-muted italic">{level.description}</p>
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
                <span className="text-text-muted">×{req.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Station requirements */}
      {level.stationLevelRequirements.length > 0 && (
        <div>
          <p className="text-text-muted font-semibold mb-1">Requires stations:</p>
          {level.stationLevelRequirements.map((req, i) => (
            <p key={i} className="text-text-secondary ml-2">
              {req.stationName} Lvl {req.level}
            </p>
          ))}
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
