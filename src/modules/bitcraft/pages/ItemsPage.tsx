import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { bitcraftDb } from "../data/bitcraftDb";
import { useBitcraftStore } from "../stores/bitcraftStore";
import SearchInput from "@/shared/ui/SearchInput";
import { SkeletonList } from "@/shared/ui/Skeleton";
import ExternalLink from "@/shared/ui/ExternalLink";
import { getIconUrl } from "../utils/icons";

const PAGE_SIZE = 50;

function ItemsPage() {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [page, setPage] = useState(0);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const queryResult = useLiveQuery(() => bitcraftDb.items.toArray());
  const togglePin = useBitcraftStore((s) => s.togglePinItem);
  const isItemPinned = useBitcraftStore((s) => s.isItemPinned);

  const isLoading = queryResult === undefined;
  const allItems = queryResult ?? [];

  // Unique tags and tiers for filters
  const tags = useMemo(() => {
    const set = new Set(allItems.map((i) => i.tag).filter(Boolean));
    return Array.from(set).sort();
  }, [allItems]);

  const tiers = useMemo(() => {
    const set = new Set(allItems.map((i) => i.tier));
    return Array.from(set).sort((a, b) => a - b);
  }, [allItems]);

  // Filtered + paginated
  const filtered = useMemo(() => {
    let result = allItems;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((i) => i.name.toLowerCase().includes(q));
    }
    if (tierFilter) {
      result = result.filter((i) => i.tier === +tierFilter);
    }
    if (tagFilter) {
      result = result.filter((i) => i.tag === tagFilter);
    }
    return result;
  }, [allItems, search, tierFilter, tagFilter]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isLoading) return <SkeletonList count={8} />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Items Database</h1>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex-1 min-w-[200px] max-w-md">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(0); }}
            placeholder="Search items..."
          />
        </div>
        <select
          value={tierFilter}
          onChange={(e) => { setTierFilter(e.target.value); setPage(0); }}
          className="rounded-md border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary"
        >
          <option value="">All Tiers</option>
          {tiers.map((t) => (
            <option key={t} value={t}>T{t}</option>
          ))}
        </select>
        <select
          value={tagFilter}
          onChange={(e) => { setTagFilter(e.target.value); setPage(0); }}
          className="rounded-md border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary"
        >
          <option value="">All Categories</option>
          {tags.map((t) => (
            <option key={t} value={t}>{t}</option>
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
        {filtered.length} item{filtered.length !== 1 ? "s" : ""}
        {search || tierFilter || tagFilter ? " (filtered)" : ""}
      </p>

      {/* Item list */}
      {pageItems.length === 0 ? (
        <div className="rounded-lg border border-border bg-bg-secondary p-8 text-center">
          <p className="text-sm text-text-muted">No items match your search.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {pageItems.map((item) => {
            const expanded = expandedIds.has(item.id);
            const pinned = isItemPinned(item.id);
            return (
              <div
                key={item.id}
                className={`rounded-lg border transition-colors ${
                  expanded
                    ? "border-accent/30 bg-bg-secondary"
                    : "border-border bg-bg-secondary/50 hover:bg-bg-secondary"
                }`}
              >
                {/* Row */}
                <button
                  onClick={() => toggleExpand(item.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left"
                >
                  {item.iconAssetName && (
                    <img
                      src={getIconUrl(item.iconAssetName)}
                      alt=""
                      className="w-8 h-8 object-contain flex-shrink-0"
                      loading="lazy"
                    />
                  )}
                  <span className="text-xs font-mono text-text-muted w-8">
                    T{item.tier}
                  </span>
                  <span className="flex-1 text-sm font-medium truncate">
                    {item.name}
                  </span>
                  <span className="text-xs text-text-muted">{item.tag}</span>
                  <span className="text-xs text-text-muted">
                    {item.rarityStr}
                  </span>
                  <span className="text-xs text-text-muted">
                    {expanded ? "▲" : "▼"}
                  </span>
                </button>

                {/* Expanded detail */}
                {expanded && (
                  <div className="border-t border-border/50 px-3 py-3 space-y-2">
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePin(item.id);
                        }}
                        className={`rounded-md px-3 py-1 text-xs transition-colors ${
                          pinned
                            ? "bg-warning/20 text-warning"
                            : "bg-bg-tertiary text-text-secondary hover:bg-bg-hover"
                        }`}
                      >
                        {pinned ? "★ Pinned" : "☆ Pin Item"}
                      </button>
                      <ExternalLink
                        href={`https://bitjita.com/items/${item.id}`}
                        className="rounded-md bg-bg-tertiary px-3 py-1 text-xs text-text-secondary hover:bg-bg-hover transition-colors"
                      >
                        View on Bitjita ↗
                      </ExternalLink>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-text-muted">Tier:</span>{" "}
                        <span className="font-mono">T{item.tier}</span>
                      </div>
                      <div>
                        <span className="text-text-muted">Rarity:</span>{" "}
                        <span>{item.rarityStr}</span>
                      </div>
                      <div>
                        <span className="text-text-muted">Category:</span>{" "}
                        <span>{item.tag}</span>
                      </div>
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

export default ItemsPage;
