import { useState, useEffect, useCallback } from "react";
import { fetchItemDetail } from "../data/bitcraftApi";
import { getIconUrl } from "../utils/icons";

interface TreeNode {
  itemId: string;
  itemName: string;
  iconAssetName: string;
  quantity: number;
  isRaw: boolean;
  children: TreeNode[] | null; // null = not loaded yet
  hasRecipe: boolean;
}

/** Load a single level of the tree (direct ingredients only) */
async function loadNode(
  itemId: string,
  itemName: string,
  quantity: number
): Promise<TreeNode> {
  try {
    const detail = await fetchItemDetail(itemId);
    // Find the recipe that produces THIS item (resultItemId matches)
    const recipe = detail.craftingRecipes?.find(
      (r) => r.resultItemId === itemId
    ) ?? detail.craftingRecipes?.[0];

    if (!recipe?.ingredients || recipe.ingredients.length === 0) {
      return {
        itemId,
        itemName: detail.name || itemName,
        iconAssetName: detail.iconAssetName || "",
        quantity,
        isRaw: true,
        children: null,
        hasRecipe: false,
      };
    }

    const batches = Math.ceil(quantity / (recipe.resultQuantity || 1));

    const children: TreeNode[] = recipe.ingredients.map((ing) => ({
      itemId: ing.itemId,
      itemName: ing.itemName,
      iconAssetName: "",
      quantity: ing.quantity * batches,
      isRaw: true,
      children: null,
      hasRecipe: false,
    }));

    return {
      itemId,
      itemName: detail.name || itemName,
      iconAssetName: detail.iconAssetName || "",
      quantity,
      isRaw: false,
      children,
      hasRecipe: true,
    };
  } catch {
    return {
      itemId, itemName, iconAssetName: "", quantity,
      isRaw: true, children: null, hasRecipe: false,
    };
  }
}

type RawMat = { itemId: string; itemName: string; iconAssetName: string; quantity: number };

/**
 * Deeply resolve ALL raw materials by recursively fetching recipes.
 * A "raw material" is any item that has no crafting recipe.
 */
async function deepFlattenRawMaterials(
  itemId: string,
  itemName: string,
  quantity: number,
  visited: Set<string>
): Promise<RawMat[]> {
  if (visited.has(itemId)) {
    return [{ itemId, itemName, iconAssetName: "", quantity }];
  }

  try {
    const detail = await fetchItemDetail(itemId);
    const recipe = detail.craftingRecipes?.[0];

    if (!recipe?.ingredients || recipe.ingredients.length === 0) {
      return [{
        itemId,
        itemName: detail.name || itemName,
        iconAssetName: detail.iconAssetName || "",
        quantity,
      }];
    }

    const newVisited = new Set(visited);
    newVisited.add(itemId);
    const batches = Math.ceil(quantity / (recipe.resultQuantity || 1));

    const allMats: RawMat[] = [];
    for (const ing of recipe.ingredients) {
      const childMats = await deepFlattenRawMaterials(
        ing.itemId, ing.itemName, ing.quantity * batches, newVisited
      );
      allMats.push(...childMats);
    }
    return allMats;
  } catch {
    return [{ itemId, itemName, iconAssetName: "", quantity }];
  }
}

/** Merge raw materials by itemId, summing quantities */
function mergeRawMats(mats: RawMat[]): RawMat[] {
  const map = new Map<string, RawMat>();
  for (const mat of mats) {
    const existing = map.get(mat.itemId);
    if (existing) {
      existing.quantity += mat.quantity;
    } else {
      map.set(mat.itemId, { ...mat });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.itemName.localeCompare(b.itemName));
}

// ── Tree Node UI ────────────────────────────────────────

function TreeNodeRow({
  node,
  depth,
  isLast,
  onExpand,
}: {
  node: TreeNode;
  depth: number;
  isLast: boolean;
  onExpand: (itemId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [children, setChildren] = useState<TreeNode[] | null>(node.children);
  const [hasRecipe, setHasRecipe] = useState(node.hasRecipe);

  // Check if this node has a recipe (on first render)
  useEffect(() => {
    if (node.children !== null) {
      setChildren(node.children);
      setHasRecipe(node.children.length > 0);
      return;
    }
    // Probe to see if it has a recipe
    let cancelled = false;
    fetchItemDetail(node.itemId)
      .then((detail) => {
        if (cancelled) return;
        const recipe = detail.craftingRecipes?.[0];
        if (recipe?.ingredients && recipe.ingredients.length > 0) {
          setHasRecipe(true);
          if (node.iconAssetName === "" && detail.iconAssetName) {
            node.iconAssetName = detail.iconAssetName;
          }
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [node]);

  const handleToggle = useCallback(async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    if (children && children.length > 0) {
      setExpanded(true);
      return;
    }
    // Load children
    setLoading(true);
    try {
      const loaded = await loadNode(node.itemId, node.itemName, node.quantity);
      if (loaded.children && loaded.children.length > 0) {
        setChildren(loaded.children);
        node.iconAssetName = loaded.iconAssetName || node.iconAssetName;
      }
      setExpanded(true);
    } catch {
      // ignore
    }
    setLoading(false);
  }, [expanded, children, node]);

  const iconUrl = node.iconAssetName ? getIconUrl(node.iconAssetName) : "";
  const indent = depth * 24;

  return (
    <>
      <div
        className="flex items-center gap-2.5 py-1.5 hover:bg-bg-tertiary/30 rounded transition-colors"
        style={{ paddingLeft: indent }}
      >
        {/* Tree lines */}
        {depth > 0 && (
          <span className="text-text-muted text-sm w-4 flex-shrink-0">
            {isLast ? "└" : "├"}
          </span>
        )}

        {/* Expand/collapse or leaf indicator */}
        {hasRecipe ? (
          <button
            onClick={handleToggle}
            className="w-5 h-5 flex items-center justify-center text-sm text-accent hover:text-accent-hover flex-shrink-0 font-mono"
          >
            {loading ? "…" : expanded ? "−" : "+"}
          </button>
        ) : (
          <span className="w-5 h-5 flex items-center justify-center text-sm text-success flex-shrink-0">
            •
          </span>
        )}

        {/* Icon */}
        {iconUrl ? (
          <img src={iconUrl} alt="" className="w-7 h-7 object-contain flex-shrink-0" loading="lazy" />
        ) : (
          <div className="w-7 h-7 flex-shrink-0" />
        )}

        {/* Name */}
        <span className={`text-base flex-1 ${node.isRaw && !hasRecipe ? "text-success" : "text-text-primary"}`}>
          {node.itemName}
        </span>

        {/* Quantity */}
        <span className="text-base font-mono font-semibold text-accent flex-shrink-0">
          x{node.quantity.toLocaleString()}
        </span>
      </div>

      {/* Expanded children */}
      {expanded && children && children.map((child, i) => (
        <TreeNodeRow
          key={`${child.itemId}-${i}`}
          node={child}
          depth={depth + 1}
          isLast={i === children.length - 1}
          onExpand={onExpand}
        />
      ))}
    </>
  );
}

// ── Main Component ──────────────────────────────────────

export default function RecipeTree({
  itemId,
  itemName,
  quantity,
}: {
  itemId: string;
  itemName: string;
  quantity: number;
}) {
  const [root, setRoot] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRawSummary, setShowRawSummary] = useState(false);
  const [rawList, setRawList] = useState<RawMat[] | null>(null);
  const [rawLoading, setRawLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadNode(itemId, itemName, quantity).then((node) => {
      if (!cancelled) {
        setRoot(node);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [itemId, itemName, quantity]);

  if (loading) {
    return <p className="text-xs text-text-muted animate-pulse py-2">Loading recipe...</p>;
  }

  if (!root || (!root.hasRecipe && !root.children?.length)) {
    return <p className="text-xs text-text-muted italic py-2">No recipe found.</p>;
  }

  const handleShowRawSummary = async () => {
    if (showRawSummary) {
      setShowRawSummary(false);
      return;
    }
    if (rawList) {
      setShowRawSummary(true);
      return;
    }
    // Deep fetch all raw materials
    setRawLoading(true);
    setShowRawSummary(true);
    try {
      const allMats = await deepFlattenRawMaterials(itemId, itemName, quantity, new Set());
      setRawList(mergeRawMats(allMats));
    } catch {
      setRawList([]);
    }
    setRawLoading(false);
  };

  return (
    <div>
      {/* Collapsible tree */}
      <div className="max-h-[400px] overflow-y-auto">
        {root.children?.map((child, i) => (
          <TreeNodeRow
            key={`${child.itemId}-${i}`}
            node={child}
            depth={0}
            isLast={i === (root.children?.length ?? 0) - 1}
            onExpand={() => {}}
          />
        ))}
      </div>

      {/* Raw materials summary */}
      <div className="mt-2 border-t border-border/50 pt-2">
        <button
          onClick={handleShowRawSummary}
          className="text-sm text-accent hover:text-accent-hover transition-colors"
        >
          {showRawSummary ? "▾ Hide" : "▸ Show"} total raw materials
          {rawList ? ` (${rawList.length})` : ""}
        </button>
        {showRawSummary && rawLoading && (
          <p className="text-sm text-text-muted animate-pulse mt-1">
            Calculating total raw materials...
          </p>
        )}
        {showRawSummary && rawList && rawList.length > 0 && (
          <div className="mt-2 rounded border border-border/50 bg-bg-tertiary overflow-hidden">
            {rawList.map((mat) => (
              <div
                key={mat.itemId}
                className="flex items-center gap-2.5 px-3 py-2 text-sm border-b border-border/50 last:border-0"
              >
                {mat.iconAssetName && (
                  <img
                    src={getIconUrl(mat.iconAssetName)}
                    alt=""
                    className="w-6 h-6 object-contain flex-shrink-0"
                  />
                )}
                <span className="flex-1 text-success">{mat.itemName}</span>
                <span className="font-mono font-semibold text-accent">x{mat.quantity.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
        {showRawSummary && rawList && rawList.length === 0 && !rawLoading && (
          <p className="text-sm text-text-muted italic mt-1">No raw materials found.</p>
        )}
      </div>
    </div>
  );
}
