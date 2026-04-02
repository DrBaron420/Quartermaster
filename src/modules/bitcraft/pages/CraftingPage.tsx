import { useState, useMemo, useCallback, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { bitcraftDb } from "../data/bitcraftDb";
import { useBitcraftStore } from "../stores/bitcraftStore";
import { fetchItemDetail } from "../data/bitcraftApi";
import type { CraftingRecipe, CraftingRecipeIngredient } from "../types/items";
import SearchInput from "@/shared/ui/SearchInput";
import Collapsible from "@/shared/ui/Collapsible";
import { SkeletonList } from "@/shared/ui/Skeleton";
import { showToast } from "@/shared/ui/Toast";
import ExternalLink from "@/shared/ui/ExternalLink";
import { getIconUrl } from "../utils/icons";
import RecipeTree from "../components/RecipeTree";

const PAGE_SIZE = 50;

// ── Ingredient list for expanded recipe rows ────────────

function RecipeIngredients({
  itemId,
  quantity,
  allItems,
}: {
  itemId: string;
  quantity: number;
  allItems: { id: string; iconAssetName: string; name: string }[];
}) {
  const [ingredients, setIngredients] = useState<
    (CraftingRecipeIngredient & { totalQty: number })[] | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [resultQty, setResultQty] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchItemDetail(itemId)
      .then((detail) => {
        if (cancelled) return;
        const recipe = detail.craftingRecipes?.[0];
        if (recipe?.ingredients) {
          setResultQty(recipe.resultQuantity || 1);
          setIngredients(recipe.ingredients.map((ing) => ({ ...ing, totalQty: ing.quantity })));
        } else {
          setIngredients([]);
        }
      })
      .catch(() => {
        if (!cancelled) setIngredients([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [itemId]);

  if (loading) {
    return <p className="text-xs text-text-muted animate-pulse py-1">Loading ingredients...</p>;
  }
  if (!ingredients || ingredients.length === 0) {
    return <p className="text-xs text-text-muted italic py-1">No recipe data available.</p>;
  }

  const batches = Math.ceil(quantity / resultQty);

  return (
    <div className="rounded border border-border/50 bg-bg-tertiary overflow-hidden">
      {ingredients.map((ing) => {
        const matItem = allItems.find((i) => i.id === ing.itemId);
        return (
          <div
            key={ing.itemId}
            className="flex items-center gap-2 px-2 py-1.5 text-xs border-b border-border/50 last:border-0"
          >
            {matItem?.iconAssetName ? (
              <img
                src={getIconUrl(matItem.iconAssetName)}
                alt=""
                className="w-5 h-5 object-contain flex-shrink-0"
                loading="lazy"
              />
            ) : (
              <div className="w-5 h-5 rounded bg-bg-secondary flex-shrink-0" />
            )}
            <span className="flex-1">{ing.itemName}</span>
            <span className="font-mono text-accent">
              ×{(ing.totalQty * batches).toLocaleString()}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ───────────────────────────────────────────

function CraftingPage() {
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [page, setPage] = useState(0);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  // Per-recipe quantity inputs
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const recipes = useLiveQuery(() => bitcraftDb.recipes.toArray());
  const items = useLiveQuery(() => bitcraftDb.items.toArray());

  const addToCraftList = useBitcraftStore((s) => s.addToCraftList);
  const craftList = useBitcraftStore((s) => s.craftList);
  const removeFromCraftList = useBitcraftStore((s) => s.removeFromCraftList);
  const clearCraftList = useBitcraftStore((s) => s.clearCraftList);

  const isLoading = recipes === undefined || items === undefined;
  const allRecipes = recipes ?? [];
  const allItems = items ?? [];

  // Item lookup map
  const itemMap = useMemo(() => {
    const map = new Map<string, { tier: number; tag: string; rarityStr: string }>();
    for (const item of allItems) {
      map.set(item.id, { tier: item.tier, tag: item.tag, rarityStr: item.rarityStr });
    }
    return map;
  }, [allItems]);

  // Unique skills for filter
  const skills = useMemo(() => {
    const set = new Set(allRecipes.map((r) => r.skillName).filter(Boolean));
    return Array.from(set).sort();
  }, [allRecipes]);

  // Filter and search
  const filtered = useMemo(() => {
    let result = allRecipes;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((r) =>
        r.resultItemName.toLowerCase().includes(q) ||
        r.skillName.toLowerCase().includes(q)
      );
    }
    if (skillFilter) {
      result = result.filter((r) => r.skillName === skillFilter);
    }
    return result.sort((a, b) => {
      if (a.skillName !== b.skillName) return a.skillName.localeCompare(b.skillName);
      return a.levelRequired - b.levelRequired;
    });
  }, [allRecipes, search, skillFilter]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const pageRecipes = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getQty = (recipeId: string) => quantities[recipeId] ?? 1;
  const setQty = (recipeId: string, qty: number) => {
    setQuantities((prev) => ({ ...prev, [recipeId]: Math.max(1, qty) }));
  };

  const handleAddToCraftList = useCallback(
    (recipe: CraftingRecipe) => {
      const qty = quantities[recipe.recipeId] ?? 1;
      addToCraftList({
        itemId: recipe.resultItemId,
        itemName: recipe.resultItemName,
        quantity: qty,
      });
      showToast(`Added ${qty}× ${recipe.resultItemName} to craft list`, "success");
    },
    [addToCraftList, quantities]
  );

  if (isLoading) return <SkeletonList count={8} />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Crafting</h1>

      {/* Craft List at top */}
      {craftList.length > 0 && (
        <div className="mb-4">
          <Collapsible
            title="Craft List"
            count={craftList.length}
            action={
              <button
                onClick={clearCraftList}
                className="text-xs text-error hover:text-error/80"
              >
                Clear All
              </button>
            }
          >
            <div className="space-y-3">
              {craftList.map((item) => {
                const itemIcon = allItems.find((i) => i.id === item.itemId);
                return (
                  <div
                    key={item.id}
                    className="rounded-lg border border-border bg-bg-secondary p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {itemIcon?.iconAssetName && (
                          <img
                            src={getIconUrl(itemIcon.iconAssetName)}
                            alt=""
                            className="w-6 h-6 object-contain"
                          />
                        )}
                        <span className="text-base font-semibold">
                          {item.itemName}
                        </span>
                        <span className="text-base text-accent font-mono font-semibold">
                          x{item.quantity}
                        </span>
                      </div>
                      <button
                        onClick={() => removeFromCraftList(item.id)}
                        className="text-xs text-error hover:text-error/80 px-2"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <div className="min-w-max">
                        <RecipeTree
                          itemId={item.itemId}
                          itemName={item.itemName}
                          quantity={item.quantity}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Collapsible>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex-1 min-w-[200px] max-w-md">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(0); }}
            placeholder="Search recipes..."
          />
        </div>
        <select
          value={skillFilter}
          onChange={(e) => { setSkillFilter(e.target.value); setPage(0); }}
          className="rounded-md border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary"
        >
          <option value="">All Skills</option>
          {skills.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {expandedIds.size > 0 && (
          <button
            onClick={() => setExpandedIds(new Set())}
            className="rounded-md border border-border px-3 py-2 text-xs text-text-secondary hover:bg-bg-secondary"
          >
            Collapse All
          </button>
        )}
      </div>

      {/* Results count */}
      <p className="text-xs text-text-muted mb-3">
        {filtered.length} recipe{filtered.length !== 1 ? "s" : ""}
        {search || skillFilter ? " (filtered)" : ""}
      </p>

      {/* Recipe list */}
      {pageRecipes.length === 0 ? (
        <div className="rounded-lg border border-border bg-bg-secondary p-8 text-center">
          <p className="text-sm text-text-muted">No recipes match your search.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {pageRecipes.map((recipe) => {
            const expanded = expandedIds.has(recipe.recipeId);
            const itemInfo = itemMap.get(recipe.resultItemId);
            const fullItem = allItems.find((i) => i.id === recipe.resultItemId);
            return (
              <div
                key={recipe.recipeId}
                className={`rounded-lg border transition-colors ${
                  expanded
                    ? "border-accent/30 bg-bg-secondary"
                    : "border-border bg-bg-secondary/50 hover:bg-bg-secondary"
                }`}
              >
                {/* Row */}
                <button
                  onClick={() => toggleExpand(recipe.recipeId)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left"
                >
                  {fullItem?.iconAssetName ? (
                    <img
                      src={getIconUrl(fullItem.iconAssetName)}
                      alt=""
                      className="w-8 h-8 object-contain flex-shrink-0"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-bg-tertiary flex-shrink-0" />
                  )}
                  <span className="text-xs font-mono text-text-muted w-8">
                    {itemInfo ? `T${itemInfo.tier}` : ""}
                  </span>
                  <span className="flex-1 text-sm font-medium truncate">
                    {recipe.resultItemName}
                  </span>
                  <span className="text-xs text-text-muted">
                    {recipe.skillName}
                  </span>
                  <span className="text-xs text-text-muted">
                    Lv{recipe.levelRequired}
                  </span>
                  {recipe.xpReward > 0 && (
                    <span className="text-xs text-accent font-mono">
                      {recipe.xpReward} XP
                    </span>
                  )}
                  <span className="text-xs text-text-muted">
                    {expanded ? "▲" : "▼"}
                  </span>
                </button>

                {/* Expanded */}
                {expanded && (
                  <div className="border-t border-border/50 px-3 py-3 space-y-3">
                    {/* Info grid */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-text-muted">Skill:</span>{" "}
                        <span>{recipe.skillName}</span>
                      </div>
                      <div>
                        <span className="text-text-muted">Level:</span>{" "}
                        <span className="font-mono">{recipe.levelRequired}</span>
                      </div>
                      <div>
                        <span className="text-text-muted">Produces:</span>{" "}
                        <span className="font-mono">×{recipe.resultQuantity}</span>
                      </div>
                      {recipe.xpReward > 0 && (
                        <div>
                          <span className="text-text-muted">XP:</span>{" "}
                          <span className="font-mono text-accent">{recipe.xpReward}</span>
                        </div>
                      )}
                      {itemInfo && (
                        <>
                          <div>
                            <span className="text-text-muted">Tier:</span>{" "}
                            <span className="font-mono">T{itemInfo.tier}</span>
                          </div>
                          <div>
                            <span className="text-text-muted">Category:</span>{" "}
                            <span>{itemInfo.tag}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Quantity + Add to craft list */}
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-text-muted">Quantity:</label>
                      <input
                        type="number"
                        min={1}
                        value={getQty(recipe.recipeId)}
                        onChange={(e) => setQty(recipe.recipeId, +e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-20 rounded border border-border bg-bg-primary px-2 py-1 text-sm text-text-primary font-mono"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCraftList(recipe);
                        }}
                        className="rounded-md bg-accent px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
                      >
                        + Craft List
                      </button>
                      <ExternalLink
                        href={`https://bitjita.com/items/${recipe.resultItemId}`}
                        className="rounded-md bg-bg-tertiary px-3 py-1.5 text-xs text-text-secondary hover:bg-bg-hover transition-colors"
                      >
                        Bitjita ↗
                      </ExternalLink>
                    </div>

                    {/* Ingredients list */}
                    <div>
                      <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                        Required Materials
                      </p>
                      <RecipeIngredients
                        itemId={recipe.resultItemId}
                        quantity={getQty(recipe.recipeId)}
                        allItems={allItems}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-bg-secondary"
          >
            ← Prev
          </button>
          <span className="text-xs text-text-muted">
            Page {page + 1} of {pageCount}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={page >= pageCount - 1}
            className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-bg-secondary"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export default CraftingPage;
