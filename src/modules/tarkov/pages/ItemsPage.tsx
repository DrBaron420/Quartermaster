import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { tarkovDb } from "../data/tarkovDb";
import SearchInput from "@/shared/ui/SearchInput";
import { SkeletonList } from "@/shared/ui/Skeleton";
import type { TarkovItem } from "../types/items";

/** Get the best sell price in RUB */
function bestSellPrice(item: TarkovItem): number {
  const rubPrices = item.sellFor
    .filter((p) => p.currency === "RUB")
    .map((p) => p.price);
  return rubPrices.length > 0 ? Math.max(...rubPrices) : 0;
}

/** Get the best buy price in RUB */
function bestBuyPrice(item: TarkovItem): number {
  const rubPrices = item.buyFor
    .filter((p) => p.currency === "RUB")
    .map((p) => p.price);
  return rubPrices.length > 0 ? Math.min(...rubPrices) : 0;
}

/** Format price with locale separators */
function formatPrice(price: number): string {
  if (price === 0) return "—";
  return "₽" + price.toLocaleString();
}

const ITEMS_PER_PAGE = 50;

function ItemsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [page, setPage] = useState(0);

  const queryResult = useLiveQuery(() => tarkovDb.items.toArray());
  const isLoading = queryResult === undefined;
  const allItems = queryResult ?? [];

  // Get unique categories for the filter dropdown
  const categories = useMemo(() => {
    const cats = new Set<string>();
    allItems.forEach((item) => item.categories.forEach((c) => cats.add(c)));
    return Array.from(cats).sort();
  }, [allItems]);

  // Filter and search
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
      result = result.filter((item) =>
        item.categories.includes(categoryFilter)
      );
    }

    return result;
  }, [allItems, search, categoryFilter]);

  // Paginate
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const pageItems = filtered.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const handleCategory = (value: string) => {
    setCategoryFilter(value);
    setPage(0);
  };

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
      <div className="flex gap-3 mb-4 max-w-2xl">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={handleSearch}
            placeholder="Search items..."
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => handleCategory(e.target.value)}
          className="rounded-lg bg-bg-secondary border border-border px-3 py-2
                     text-sm text-text-primary focus:outline-none focus:border-accent"
        >
          <option value="all">All categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Items grid */}
      {pageItems.length === 0 ? (
        <div className="rounded-lg bg-bg-secondary border border-border p-8 text-center text-sm text-text-muted">
          {allItems.length === 0
            ? "No items cached yet. Enable the module and wait for sync."
            : "No items match your search."}
        </div>
      ) : (
        <div className="grid gap-2">
          {pageItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-lg bg-bg-secondary border border-border
                         p-3 hover:border-border-hover transition-colors"
            >
              <img
                src={item.iconLink}
                alt={item.shortName}
                className="h-10 w-10 object-contain rounded bg-bg-tertiary p-1"
                loading="lazy"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {item.name}
                </p>
                <p className="text-xs text-text-muted truncate">
                  {item.shortName} · {item.categories[0] ?? "Unknown"}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm text-text-primary">
                  {formatPrice(bestBuyPrice(item))}
                </p>
                <p className="text-xs text-text-muted">
                  Sell: {formatPrice(bestSellPrice(item))}
                </p>
              </div>
            </div>
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

export default ItemsPage;
