import { useState, useMemo, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { tarkovDb } from "../data/tarkovDb";
import { useTarkovStore } from "../stores/tarkovStore";
import SearchInput from "@/shared/ui/SearchInput";
import ExternalLink from "@/shared/ui/ExternalLink";
import { SkeletonList } from "@/shared/ui/Skeleton";
import { formatPrice, FLEA_MARKET } from "../utils/currency";
import type { TarkovItem, ItemPrice } from "../types/items";

/** Get the best (cheapest) buy offer from traders */
function bestBuy(item: TarkovItem): ItemPrice | null {
  const traderBuys = item.buyFor.filter((p) => p.vendor !== FLEA_MARKET);
  if (traderBuys.length === 0) return null;
  return traderBuys.reduce((a, b) => ((a.priceRUB ?? a.price) < (b.priceRUB ?? b.price) ? a : b));
}

/** Get the best (highest) sell offer */
function bestSell(item: TarkovItem): ItemPrice | null {
  const sells = item.sellFor.filter((p) => p.vendor !== FLEA_MARKET);
  if (sells.length === 0) return null;
  return sells.reduce((a, b) => ((a.priceRUB ?? a.price) > (b.priceRUB ?? b.price) ? a : b));
}

const ITEMS_PER_PAGE = 50;

function ItemsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const togglePinItem = useTarkovStore((s) => s.togglePinItem);
  const togglePinAmmo = useTarkovStore((s) => s.togglePinAmmo);
  const pinnedItems = useTarkovStore((s) => s.pinnedItems);
  const pinnedAmmo = useTarkovStore((s) => s.pinnedAmmo);

  const queryResult = useLiveQuery(() => tarkovDb.items.toArray());
  const isLoading = queryResult === undefined;
  const allItems = queryResult ?? [];

  const categories = useMemo(() => {
    const cats = new Set<string>();
    allItems.forEach((item) => item.categories.forEach((c) => cats.add(c)));
    return Array.from(cats).sort();
  }, [allItems]);

  const filtered = useMemo(() => {
    let result = allItems;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.shortName.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== "all") {
      result = result.filter((item) => item.categories.includes(categoryFilter));
    }
    return result;
  }, [allItems, search, categoryFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const pageItems = filtered.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  const handleSearch = (value: string) => { setSearch(value); setPage(0); };
  const handleCategory = (value: string) => { setCategoryFilter(value); setPage(0); };

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const collapseAll = () => setExpandedIds(new Set());

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Items Database</h1>
        <SkeletonList count={10} />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Items Database</h1>
      <p className="text-text-secondary mb-4">
        {filtered.length.toLocaleString()} items
        {search || categoryFilter !== "all" ? " (filtered)" : ""}
      </p>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <SearchInput value={search} onChange={handleSearch} placeholder="Search items..." />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => handleCategory(e.target.value)}
          className="rounded-lg bg-bg-secondary border border-border px-3 py-2
                     text-sm text-text-primary focus:outline-none focus:border-accent"
        >
          <option value="all">All categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        {expandedIds.size > 0 && (
          <button
            onClick={collapseAll}
            className="rounded-lg bg-bg-secondary border border-border px-3 py-2
                       text-sm text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors"
          >
            Collapse All
          </button>
        )}
      </div>

      {/* Items list */}
      {pageItems.length === 0 ? (
        <div className="rounded-lg bg-bg-secondary border border-border p-8 text-center text-sm text-text-muted">
          {allItems.length === 0
            ? "No items cached yet. Enable the module and wait for sync."
            : "No items match your search."}
        </div>
      ) : (
        <div className="grid gap-2">
          {pageItems.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              isExpanded={expandedIds.has(item.id)}
              onToggle={() => toggleExpand(item.id)}
              isPinnedItem={pinnedItems.includes(item.id)}
              isPinnedAmmo={pinnedAmmo.includes(item.id)}
              onTogglePinItem={() => togglePinItem(item.id)}
              onTogglePinAmmo={() => togglePinAmmo(item.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-md bg-bg-secondary px-3 py-1 text-sm text-text-secondary
                       hover:bg-bg-tertiary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Prev
          </button>
          <span className="text-sm text-text-muted">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="rounded-md bg-bg-secondary px-3 py-1 text-sm text-text-secondary
                       hover:bg-bg-tertiary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

function ItemRow({
  item,
  isExpanded,
  onToggle,
  isPinnedItem,
  isPinnedAmmo,
  onTogglePinItem,
  onTogglePinAmmo,
}: {
  item: TarkovItem;
  isExpanded: boolean;
  onToggle: () => void;
  isPinnedItem: boolean;
  isPinnedAmmo: boolean;
  onTogglePinItem: () => void;
  onTogglePinAmmo: () => void;
}) {
  const buy = bestBuy(item);
  const sell = bestSell(item);
  const isAmmoOrArmor = item.types.includes("ammo") || item.types.includes("armor");

  return (
    <div className={`rounded-lg bg-bg-secondary border transition-colors ${
      isExpanded ? "border-accent/30" : "border-border hover:border-border-hover"
    }`}>
      {/* Collapsed row */}
      <div
        onClick={onToggle}
        className="flex items-center gap-3 p-3 cursor-pointer"
      >
        <img
          src={item.iconLink}
          alt={item.shortName}
          className="h-10 w-10 object-contain rounded bg-bg-tertiary p-1"
          loading="lazy"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">{item.name}</p>
          <p className="text-xs text-text-muted truncate">
            {item.shortName} · {item.categories[0] ?? "Unknown"}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm text-text-primary">
            {buy
              ? `${formatPrice(buy.price, buy.currency)}${buy.minTraderLevel ? ` LL${buy.minTraderLevel}` : ""}`
              : "—"}
          </p>
          <p className="text-xs text-text-muted">
            {sell ? `Sell: ${formatPrice(sell.price, sell.currency)}` : ""}
          </p>
        </div>
        <span className="text-text-muted text-xs ml-1">{isExpanded ? "▲" : "▼"}</span>
      </div>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="border-t border-border px-4 py-4 space-y-4">
          {/* Top row: image + stats + actions */}
          <div className="flex gap-4">
            <img
              src={item.image512pxLink}
              alt={item.shortName}
              className="h-24 w-24 object-contain rounded-lg bg-bg-tertiary p-2 shrink-0"
            />
            <div className="flex-1 space-y-3">
              {/* Stats */}
              <div className="flex flex-wrap gap-3">
                <div className="rounded-lg bg-bg-tertiary/50 px-3 py-2 text-center">
                  <p className="text-sm font-bold text-text-primary">{formatPrice(item.basePrice)}</p>
                  <p className="text-[10px] text-text-muted">Base Price</p>
                </div>
                <div className="rounded-lg bg-bg-tertiary/50 px-3 py-2 text-center">
                  <p className="text-sm font-bold text-text-primary">{item.width}×{item.height}</p>
                  <p className="text-[10px] text-text-muted">Slots</p>
                </div>
                <div className="rounded-lg bg-bg-tertiary/50 px-3 py-2 text-center">
                  <p className="text-sm font-bold text-text-primary">{item.weight.toFixed(2)}kg</p>
                  <p className="text-[10px] text-text-muted">Weight</p>
                </div>
              </div>

              {/* Categories */}
              <div className="flex flex-wrap gap-1.5">
                {item.categories.map((cat) => (
                  <span key={cat} className="rounded-full bg-bg-tertiary px-2 py-0.5 text-xs text-text-secondary">
                    {cat}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {isAmmoOrArmor && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onTogglePinAmmo(); }}
                    className={`rounded-md px-3 py-1.5 text-xs transition-colors border ${
                      isPinnedAmmo
                        ? "bg-accent/20 border-accent text-accent"
                        : "border-border text-text-muted hover:border-accent hover:text-accent"
                    }`}
                  >
                    {isPinnedAmmo ? "★ Pinned Ammo" : "☆ Pin Ammo"}
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onTogglePinItem(); }}
                  className={`rounded-md px-3 py-1.5 text-xs transition-colors border ${
                    isPinnedItem
                      ? "bg-warning/20 border-warning text-warning"
                      : "border-border text-text-muted hover:border-warning hover:text-warning"
                  }`}
                >
                  {isPinnedItem ? "★ In Shopping List" : "☆ Add to Shopping List"}
                </button>
                {item.wikiLink && (
                  <ExternalLink
                    href={item.wikiLink}
                    className="rounded-md px-3 py-1.5 text-xs border border-border text-accent hover:border-accent transition-colors"
                  >
                    Wiki →
                  </ExternalLink>
                )}
              </div>
            </div>
          </div>

          {/* Buy prices */}
          {item.buyFor.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Buy Prices</h4>
              <div className="space-y-1">
                {[...item.buyFor]
                  .sort((a, b) => (a.priceRUB ?? a.price) - (b.priceRUB ?? b.price))
                  .map((p, i) => (
                    <div key={`buy-${p.vendor}-${i}`} className={`flex justify-between text-sm px-3 py-1.5 rounded ${i === 0 ? "bg-accent-soft" : "bg-bg-tertiary/30"}`}>
                      <span className="text-text-secondary">
                        {p.vendor}{p.minTraderLevel ? ` LL${p.minTraderLevel}` : ""}
                      </span>
                      <span className={i === 0 ? "text-accent font-medium" : "text-text-primary"}>
                        {formatPrice(p.price, p.currency)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Sell prices */}
          {item.sellFor.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Sell Prices</h4>
              <div className="space-y-1">
                {[...item.sellFor]
                  .sort((a, b) => (b.priceRUB ?? b.price) - (a.priceRUB ?? a.price))
                  .map((p, i) => (
                    <div key={`sell-${p.vendor}-${i}`} className={`flex justify-between text-sm px-3 py-1.5 rounded ${i === 0 ? "bg-accent-soft" : "bg-bg-tertiary/30"}`}>
                      <span className="text-text-secondary">
                        {p.vendor}{p.minTraderLevel ? ` LL${p.minTraderLevel}` : ""}
                      </span>
                      <span className={i === 0 ? "text-accent font-medium" : "text-text-primary"}>
                        {formatPrice(p.price, p.currency)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ItemsPage;
