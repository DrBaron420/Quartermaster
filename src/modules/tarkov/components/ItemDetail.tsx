import { useTarkovStore } from "../stores/tarkovStore";
import { formatPrice } from "../utils/currency";
import ExternalLink from "@/shared/ui/ExternalLink";
import type { TarkovItem, ItemPrice } from "../types/items";

interface ItemDetailProps {
  item: TarkovItem;
  onClose: () => void;
}

function PriceRow({ label, prices }: { label: string; prices: ItemPrice[] }) {
  if (prices.length === 0) return null;

  // Sort: best price first (lowest buy, highest sell)
  const sorted = [...prices].sort((a, b) =>
    label === "Buy" ? a.price - b.price : b.price - a.price
  );

  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
        {label} Prices
      </h4>
      <div className="space-y-1">
        {sorted.map((p, i) => (
          <div
            key={`${p.vendor}-${i}`}
            className={`flex justify-between text-sm px-3 py-1.5 rounded ${
              i === 0 ? "bg-accent-soft" : "bg-bg-tertiary/50"
            }`}
          >
            <span className="text-text-secondary">
              {p.vendor}
              {p.minTraderLevel ? ` LL${p.minTraderLevel}` : ""}
            </span>
            <span className={i === 0 ? "text-accent font-medium" : "text-text-primary"}>
              {formatPrice(p.price, p.currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ItemDetail({ item, onClose }: ItemDetailProps) {
  const isPinnedItem = useTarkovStore((s) => s.isItemPinned(item.id));
  const isPinnedAmmo = useTarkovStore((s) => s.isAmmoPinned(item.id));
  const togglePinItem = useTarkovStore((s) => s.togglePinItem);
  const togglePinAmmo = useTarkovStore((s) => s.togglePinAmmo);

  const isAmmoOrArmor = item.types.includes("ammo") || item.types.includes("armor");

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-50 w-full max-w-lg max-h-[80vh] overflow-y-auto
                      rounded-xl bg-bg-primary border border-border shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 flex items-start gap-4 p-5 bg-bg-primary border-b border-border">
          <img
            src={item.image512pxLink}
            alt={item.shortName}
            className="h-20 w-20 object-contain rounded-lg bg-bg-secondary p-2"
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-text-primary leading-tight">
              {item.name}
            </h2>
            <p className="text-sm text-text-muted mt-0.5">{item.shortName}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {item.categories.slice(0, 3).map((cat) => (
                <span
                  key={cat}
                  className="rounded-full bg-bg-tertiary px-2.5 py-0.5 text-xs text-text-secondary"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAmmoOrArmor ? (
              <>
                <button
                  onClick={() => togglePinAmmo(item.id)}
                  className={`rounded-md px-2 py-1 text-xs transition-colors border ${
                    isPinnedAmmo
                      ? "bg-accent/20 border-accent text-accent"
                      : "border-border text-text-muted hover:border-accent hover:text-accent"
                  }`}
                  title={isPinnedAmmo ? "Remove from Pinned Ammo" : "Add to Pinned Ammo"}
                >
                  {isPinnedAmmo ? "★ Ammo" : "☆ Pin Ammo"}
                </button>
                <button
                  onClick={() => togglePinItem(item.id)}
                  className={`rounded-md px-2 py-1 text-xs transition-colors border ${
                    isPinnedItem
                      ? "bg-warning/20 border-warning text-warning"
                      : "border-border text-text-muted hover:border-warning hover:text-warning"
                  }`}
                  title={isPinnedItem ? "Remove from Shopping List" : "Add to Shopping List"}
                >
                  {isPinnedItem ? "★ List" : "☆ Shopping List"}
                </button>
              </>
            ) : (
              <button
                onClick={() => togglePinItem(item.id)}
                className={`text-lg transition-colors ${
                  isPinnedItem ? "text-warning" : "text-text-muted hover:text-warning"
                }`}
                title={isPinnedItem ? "Remove from Shopping List" : "Add to Shopping List"}
              >
                {isPinnedItem ? "★" : "☆"}
              </button>
            )}
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-primary text-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-bg-secondary p-3 text-center">
              <p className="text-lg font-bold text-text-primary">
                {formatPrice(item.basePrice, "RUB")}
              </p>
              <p className="text-xs text-text-muted">Base Price</p>
            </div>
            <div className="rounded-lg bg-bg-secondary p-3 text-center">
              <p className="text-lg font-bold text-text-primary">
                {item.width}×{item.height}
              </p>
              <p className="text-xs text-text-muted">Size (slots)</p>
            </div>
            <div className="rounded-lg bg-bg-secondary p-3 text-center">
              <p className="text-lg font-bold text-text-primary">
                {item.weight.toFixed(2)}kg
              </p>
              <p className="text-xs text-text-muted">Weight</p>
            </div>
          </div>

          {/* Buy prices */}
          <PriceRow label="Buy" prices={item.buyFor} />

          {/* Sell prices */}
          <PriceRow label="Sell" prices={item.sellFor} />

          {/* Wiki link */}
          {item.wikiLink && (
            <div className="pt-2 border-t border-border">
              <ExternalLink
                href={item.wikiLink}
                className="text-sm text-accent hover:text-accent-hover transition-colors"
              >
                View on Tarkov Wiki →
              </ExternalLink>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ItemDetail;
