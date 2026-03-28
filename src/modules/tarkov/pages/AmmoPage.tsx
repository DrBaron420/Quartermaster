import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { tarkovDb } from "../data/tarkovDb";
import { useTarkovStore } from "../stores/tarkovStore";
import SearchInput from "@/shared/ui/SearchInput";
import LoadingSpinner from "@/shared/ui/LoadingSpinner";
import type { TarkovAmmo } from "../types/ammo";

/** Clean up caliber strings from API */
function formatCaliber(raw: string): string {
  return raw
    .replace("Caliber", "")
    .replace("NATO", "")
    .replace(/([0-9])([A-Z])/g, "$1 $2");
}

/** Bar color based on value relative to max */
function statColor(value: number, max: number): string {
  const ratio = value / max;
  if (ratio >= 0.75) return "bg-error";
  if (ratio >= 0.5) return "bg-warning";
  if (ratio >= 0.25) return "bg-info";
  return "bg-success";
}

function StatBar({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-text-muted w-12 text-right shrink-0">{label}</span>
      <div className="flex-1 h-4 rounded bg-bg-tertiary overflow-hidden">
        <div
          className={`h-full rounded ${statColor(value, max)} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono text-text-primary w-8 shrink-0">{value}</span>
    </div>
  );
}

type ViewMode = "grouped" | "table";

function AmmoPage() {
  const [search, setSearch] = useState("");
  const [caliberFilter, setCaliberFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grouped");
  const [sortBy, setSortBy] = useState<"pen" | "dmg" | "name">("pen");

  const togglePinAmmo = useTarkovStore((s) => s.togglePinAmmo);
  const pinnedAmmoIds = useTarkovStore((s) => s.pinnedAmmo);
  const queryResult = useLiveQuery(() => tarkovDb.ammo.toArray());
  const isLoading = queryResult === undefined;
  const allAmmo = queryResult ?? [];

  // Get unique calibers
  const calibers = useMemo(() => {
    const cals = new Set<string>();
    allAmmo.forEach((a) => cals.add(a.caliber));
    return Array.from(cals).sort();
  }, [allAmmo]);

  // Filter
  const filtered = useMemo(() => {
    let result = allAmmo;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.shortName.toLowerCase().includes(q)
      );
    }

    if (caliberFilter !== "all") {
      result = result.filter((a) => a.caliber === caliberFilter);
    }

    return result;
  }, [allAmmo, search, caliberFilter]);

  // Group by caliber
  const grouped = useMemo(() => {
    const groups: Record<string, TarkovAmmo[]> = {};
    filtered.forEach((a) => {
      if (!groups[a.caliber]) groups[a.caliber] = [];
      groups[a.caliber].push(a);
    });

    // Sort within each group
    for (const cal of Object.keys(groups)) {
      groups[cal].sort((a, b) => {
        if (sortBy === "pen") return b.penetrationPower - a.penetrationPower;
        if (sortBy === "dmg") return b.damage - a.damage;
        return a.shortName.localeCompare(b.shortName);
      });
    }

    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered, sortBy]);

  // Max values for bar scaling
  const maxPen = useMemo(
    () => Math.max(...allAmmo.map((a) => a.penetrationPower), 1),
    [allAmmo]
  );
  const maxDmg = useMemo(
    () => Math.max(...allAmmo.map((a) => a.damage), 1),
    [allAmmo]
  );

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Ammo Reference</h1>
        <div className="flex justify-center py-12">
          <LoadingSpinner label="Loading ammo data..." />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Ammo Reference</h1>
      <p className="text-text-secondary mb-4">
        {filtered.length} ammo types
        {search || caliberFilter !== "all" ? " (filtered)" : ""}
      </p>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search ammo..."
          />
        </div>
        <select
          value={caliberFilter}
          onChange={(e) => setCaliberFilter(e.target.value)}
          className="rounded-lg bg-bg-secondary border border-border px-3 py-2
                     text-sm text-text-primary focus:outline-none focus:border-accent"
        >
          <option value="all">All calibers</option>
          {calibers.map((cal) => (
            <option key={cal} value={cal}>
              {formatCaliber(cal)}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="rounded-lg bg-bg-secondary border border-border px-3 py-2
                     text-sm text-text-primary focus:outline-none focus:border-accent"
        >
          <option value="pen">Sort: Penetration</option>
          <option value="dmg">Sort: Damage</option>
          <option value="name">Sort: Name</option>
        </select>
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setViewMode("grouped")}
            className={`px-3 py-2 text-sm transition-colors ${
              viewMode === "grouped"
                ? "bg-accent text-white"
                : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
            }`}
          >
            Cards
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`px-3 py-2 text-sm transition-colors ${
              viewMode === "table"
                ? "bg-accent text-white"
                : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
            }`}
          >
            Table
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg bg-bg-secondary border border-border p-8 text-center text-sm text-text-muted">
          {allAmmo.length === 0
            ? "No ammo cached yet. Enable the module and wait for sync."
            : "No ammo matches your search."}
        </div>
      ) : viewMode === "grouped" ? (
        /* ── Grouped card view ── */
        <div className="space-y-8">
          {grouped.map(([caliber, rounds]) => (
            <div key={caliber}>
              <h2 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                <span className="h-1 w-4 rounded bg-accent" />
                {formatCaliber(caliber)}
                <span className="text-sm font-normal text-text-muted">
                  ({rounds.length})
                </span>
              </h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {rounds.map((round) => (
                  <div
                    key={round.id}
                    className="rounded-lg bg-bg-secondary border border-border p-3 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={round.iconLink}
                        alt={round.shortName}
                        className="h-8 w-8 object-contain rounded bg-bg-tertiary p-0.5"
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {round.shortName}
                        </p>
                        <div className="flex gap-2 text-xs text-text-muted">
                          {round.tracer && (
                            <span className="text-warning">Tracer</span>
                          )}
                          <span>{round.initialSpeed} m/s</span>
                        </div>
                      </div>
                      <button
                        onClick={() => togglePinAmmo(round.id)}
                        className={`text-sm transition-colors ${
                          pinnedAmmoIds.includes(round.id)
                            ? "text-warning"
                            : "text-text-muted hover:text-warning"
                        }`}
                        title={pinnedAmmoIds.includes(round.id) ? "Unpin" : "Pin to dashboard"}
                      >
                        {pinnedAmmoIds.includes(round.id) ? "★" : "☆"}
                      </button>
                    </div>
                    <StatBar value={round.penetrationPower} max={maxPen} label="PEN" />
                    <StatBar value={round.damage} max={maxDmg} label="DMG" />
                    <div className="flex justify-between text-xs text-text-muted pt-1">
                      <span>Armor: {round.armorDamage}</span>
                      <span>Frag: {(round.fragmentationChance * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── Table view ── */
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bg-secondary border-b border-border">
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Ammo</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Caliber</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-text-muted cursor-pointer hover:text-text-primary" onClick={() => setSortBy("dmg")}>
                  DMG {sortBy === "dmg" && "↓"}
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-text-muted cursor-pointer hover:text-text-primary" onClick={() => setSortBy("pen")}>
                  PEN {sortBy === "pen" && "↓"}
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">Armor</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">Frag</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">Speed</th>
              </tr>
            </thead>
            <tbody>
              {grouped.flatMap(([, rounds]) =>
                rounds.map((round) => (
                  <tr
                    key={round.id}
                    className="border-b border-border/50 hover:bg-bg-secondary/50 transition-colors"
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={round.iconLink}
                          alt={round.shortName}
                          className="h-6 w-6 object-contain rounded bg-bg-tertiary p-0.5"
                          loading="lazy"
                        />
                        <span className="font-medium text-text-primary">{round.shortName}</span>
                        {round.tracer && <span className="text-xs text-warning">T</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-text-secondary text-xs">{formatCaliber(round.caliber)}</td>
                    <td className="px-3 py-2 text-right font-mono text-text-primary">{round.damage}</td>
                    <td className="px-3 py-2 text-right font-mono text-text-primary">{round.penetrationPower}</td>
                    <td className="px-3 py-2 text-right font-mono text-text-secondary">{round.armorDamage}</td>
                    <td className="px-3 py-2 text-right font-mono text-text-secondary">{(round.fragmentationChance * 100).toFixed(0)}%</td>
                    <td className="px-3 py-2 text-right font-mono text-text-muted">{round.initialSpeed}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AmmoPage;
