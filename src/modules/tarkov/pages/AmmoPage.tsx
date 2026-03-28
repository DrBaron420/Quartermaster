import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { tarkovDb } from "../data/tarkovDb";
import SearchInput from "@/shared/ui/SearchInput";
import SortableTable, { type Column } from "@/shared/ui/SortableTable";
import type { TarkovAmmo } from "../types/ammo";

/** Clean up caliber strings from API (e.g. "Caliber556x45NATO" → "5.56x45mm") */
function formatCaliber(raw: string): string {
  return raw
    .replace("Caliber", "")
    .replace("NATO", "")
    .replace("x", "x")
    .replace(/([0-9])([A-Z])/g, "$1 $2");
}

/** Color code penetration power */
function penColor(pen: number): string {
  if (pen >= 50) return "text-error";
  if (pen >= 35) return "text-warning";
  if (pen >= 20) return "text-info";
  return "text-success";
}

/** Color code damage */
function dmgColor(dmg: number): string {
  if (dmg >= 80) return "text-error";
  if (dmg >= 50) return "text-warning";
  return "text-text-primary";
}

function AmmoPage() {
  const [search, setSearch] = useState("");
  const [caliberFilter, setCaliberFilter] = useState<string>("all");

  const allAmmo = useLiveQuery(() => tarkovDb.ammo.toArray()) ?? [];

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

  const columns: Column<TarkovAmmo>[] = [
    {
      key: "icon",
      label: "",
      width: "40px",
      render: (row) => (
        <img
          src={row.iconLink}
          alt={row.shortName}
          className="h-8 w-8 object-contain rounded bg-bg-tertiary p-0.5"
          loading="lazy"
        />
      ),
    },
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium">{row.shortName}</p>
          <p className="text-xs text-text-muted">{formatCaliber(row.caliber)}</p>
        </div>
      ),
      sortValue: (row) => row.shortName,
    },
    {
      key: "damage",
      label: "Damage",
      sortable: true,
      width: "80px",
      render: (row) => (
        <span className={`font-mono font-medium ${dmgColor(row.damage)}`}>
          {row.damage}
        </span>
      ),
      sortValue: (row) => row.damage,
    },
    {
      key: "penetration",
      label: "Pen",
      sortable: true,
      width: "70px",
      render: (row) => (
        <span className={`font-mono font-medium ${penColor(row.penetrationPower)}`}>
          {row.penetrationPower}
        </span>
      ),
      sortValue: (row) => row.penetrationPower,
    },
    {
      key: "armorDamage",
      label: "Armor Dmg",
      sortable: true,
      width: "90px",
      render: (row) => (
        <span className="font-mono">{row.armorDamage}</span>
      ),
      sortValue: (row) => row.armorDamage,
    },
    {
      key: "fragChance",
      label: "Frag %",
      sortable: true,
      width: "80px",
      render: (row) => (
        <span className="font-mono">
          {(row.fragmentationChance * 100).toFixed(0)}%
        </span>
      ),
      sortValue: (row) => row.fragmentationChance,
    },
    {
      key: "speed",
      label: "Speed",
      sortable: true,
      width: "80px",
      render: (row) => (
        <span className="font-mono text-text-secondary">{row.initialSpeed}</span>
      ),
      sortValue: (row) => row.initialSpeed,
    },
    {
      key: "tracer",
      label: "Tracer",
      width: "60px",
      render: (row) => (
        <span className={row.tracer ? "text-warning" : "text-text-muted"}>
          {row.tracer ? "Yes" : "—"}
        </span>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Ammo Reference</h1>
      <p className="text-text-secondary mb-4">
        {filtered.length} ammo types
        {search || caliberFilter !== "all" ? " (filtered)" : ""}
      </p>

      {/* Filters */}
      <div className="flex gap-3 mb-4 max-w-2xl">
        <div className="flex-1">
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
      </div>

      <SortableTable
        data={filtered}
        columns={columns}
        rowKey={(row) => row.id}
        emptyMessage={
          allAmmo.length === 0
            ? "No ammo cached yet. Enable the module and wait for sync."
            : "No ammo matches your search."
        }
      />
    </div>
  );
}

export default AmmoPage;
