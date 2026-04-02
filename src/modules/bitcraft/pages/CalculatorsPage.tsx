import { useState } from "react";
import { ALL_PROFESSIONS } from "../types/items";
import type { Rarity } from "../types/items";
import {
  xpBetweenLevels,
  xpForLevel,
  xpForNextLevel,
  formatXp,
} from "../utils/xpCalculator";
import {
  RARITY_ORDER,
  RARITY_ROLL_RATES,
  expectedRolls,
  rollsForConfidence,
  probabilityAtLeast,
  tierDistribution,
} from "../utils/rarityCalculator";
import { useBitcraftStore } from "../stores/bitcraftStore";
import { showToast } from "@/shared/ui/Toast";

function CalculatorsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Calculators</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <XpCalculator />
        <RarityCalculator />
      </div>
    </div>
  );
}

// ── XP Calculator ───────────────────────────────────────

function XpCalculator() {
  const [profession, setProfession] = useState(ALL_PROFESSIONS[0]);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [targetLevel, setTargetLevel] = useState(10);
  const [xpPerItem, setXpPerItem] = useState(0);

  const addXpGoal = useBitcraftStore((s) => s.addXpGoal);

  const xpNeeded = xpBetweenLevels(currentLevel, targetLevel);
  const currentTotalXp = xpForLevel(currentLevel);
  const targetTotalXp = xpForLevel(targetLevel);
  const nextLevelXp = xpForNextLevel(currentLevel);
  const itemsNeeded = xpPerItem > 0 ? Math.ceil(xpNeeded / xpPerItem) : null;

  const handlePin = () => {
    addXpGoal({
      profession,
      currentLevel,
      targetLevel,
      pinned: true,
    });
    showToast(`XP goal pinned: ${profession} ${currentLevel}→${targetLevel}`, "success");
  };

  return (
    <div className="rounded-lg border border-border bg-bg-secondary p-4">
      <h2 className="text-lg font-semibold mb-4">XP Calculator</h2>

      <div className="space-y-3">
        {/* Profession */}
        <div>
          <label className="text-xs text-text-muted uppercase tracking-wider">
            Profession
          </label>
          <select
            value={profession}
            onChange={(e) => setProfession(e.target.value as typeof profession)}
            className="mt-1 w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary"
          >
            {ALL_PROFESSIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Level inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider">
              Current Level
            </label>
            <input
              type="number"
              min={1}
              max={109}
              value={currentLevel}
              onChange={(e) => setCurrentLevel(Math.max(1, Math.min(109, +e.target.value)))}
              className="mt-1 w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary"
            />
          </div>
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider">
              Target Level
            </label>
            <input
              type="number"
              min={2}
              max={110}
              value={targetLevel}
              onChange={(e) => setTargetLevel(Math.max(currentLevel + 1, Math.min(110, +e.target.value)))}
              className="mt-1 w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary"
            />
          </div>
        </div>

        {/* XP per item (optional) */}
        <div>
          <label className="text-xs text-text-muted uppercase tracking-wider">
            XP Per Action (optional)
          </label>
          <input
            type="number"
            min={0}
            value={xpPerItem}
            onChange={(e) => setXpPerItem(Math.max(0, +e.target.value))}
            placeholder="Enter XP per craft/gather..."
            className="mt-1 w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary"
          />
        </div>

        {/* Results */}
        <div className="mt-4 rounded-md border border-border bg-bg-tertiary p-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Current total XP</span>
            <span className="font-mono">{formatXp(currentTotalXp)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Target total XP</span>
            <span className="font-mono">{formatXp(targetTotalXp)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">XP for next level</span>
            <span className="font-mono">{formatXp(nextLevelXp)}</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between text-sm font-semibold">
            <span>XP needed</span>
            <span className="font-mono text-accent">{formatXp(xpNeeded)}</span>
          </div>
          {itemsNeeded !== null && (
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Actions needed</span>
              <span className="font-mono text-accent">
                {itemsNeeded.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Pin button */}
        <button
          onClick={handlePin}
          className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Pin to Dashboard
        </button>
      </div>
    </div>
  );
}

// ── Rarity Calculator ───────────────────────────────────

function RarityCalculator() {
  const [targetRarity, setTargetRarity] = useState<Rarity>("Uncommon");
  const [numRolls, setNumRolls] = useState(10);

  const rate = RARITY_ROLL_RATES[targetRarity];
  const probability = probabilityAtLeast(targetRarity, numRolls);
  const expected = expectedRolls(targetRarity);
  const rolls50 = rollsForConfidence(targetRarity, 0.5);
  const rolls90 = rollsForConfidence(targetRarity, 0.9);
  const rolls99 = rollsForConfidence(targetRarity, 0.99);

  // Distribution after N upgrades
  const dist = tierDistribution(numRolls);

  return (
    <div className="rounded-lg border border-border bg-bg-secondary p-4">
      <h2 className="text-lg font-semibold mb-4">Rarity Calculator</h2>

      <div className="space-y-3">
        {/* Target rarity */}
        <div>
          <label className="text-xs text-text-muted uppercase tracking-wider">
            Target Rarity
          </label>
          <select
            value={targetRarity}
            onChange={(e) => setTargetRarity(e.target.value as Rarity)}
            className="mt-1 w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary"
          >
            {RARITY_ORDER.filter((r) => r !== "Common").map((r) => (
              <option key={r} value={r}>
                {r} ({(RARITY_ROLL_RATES[r] * 100).toFixed(2)}% per roll)
              </option>
            ))}
          </select>
        </div>

        {/* Number of tier upgrades */}
        <div>
          <label className="text-xs text-text-muted uppercase tracking-wider">
            Tier Upgrades (rolls)
          </label>
          <input
            type="number"
            min={1}
            max={20}
            value={numRolls}
            onChange={(e) => setNumRolls(Math.max(1, Math.min(20, +e.target.value)))}
            className="mt-1 w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary"
          />
        </div>

        {/* Results */}
        <div className="mt-4 rounded-md border border-border bg-bg-tertiary p-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Roll chance</span>
            <span className="font-mono">{(rate * 100).toFixed(2)}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">
              Chance in {numRolls} roll{numRolls !== 1 ? "s" : ""}
            </span>
            <span className="font-mono text-accent">
              {(probability * 100).toFixed(2)}%
            </span>
          </div>
          <div className="border-t border-border pt-2" />
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Expected rolls</span>
            <span className="font-mono">{expected.toFixed(1)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Rolls for 50% chance</span>
            <span className="font-mono">{rolls50}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Rolls for 90% chance</span>
            <span className="font-mono">{rolls90}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Rolls for 99% chance</span>
            <span className="font-mono">{rolls99}</span>
          </div>
        </div>

        {/* Distribution table */}
        <div className="mt-4">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-2">
            Distribution after {numRolls} upgrade{numRolls !== 1 ? "s" : ""}
          </p>
          <div className="rounded-md border border-border bg-bg-tertiary overflow-hidden">
            {RARITY_ORDER.map((rarity) => {
              const pct = dist[rarity] * 100;
              return (
                <div
                  key={rarity}
                  className="flex items-center justify-between px-3 py-1.5 text-sm border-b border-border/50 last:border-0"
                >
                  <span className="text-text-secondary">{rarity}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 rounded-full bg-bg-primary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs w-16 text-right">
                      {pct < 0.01 ? "<0.01" : pct.toFixed(2)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalculatorsPage;
