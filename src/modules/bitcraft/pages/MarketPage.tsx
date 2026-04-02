import { useBitcraftStore } from "../stores/bitcraftStore";

function MarketPage() {
  const marketEnabled = useBitcraftStore((s) => s.marketEnabled);
  const setMarketEnabled = useBitcraftStore((s) => s.setMarketEnabled);

  if (!marketEnabled) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Market Prices</h1>
        <div className="rounded-lg border border-border bg-bg-secondary p-8 text-center">
          <p className="text-sm text-text-secondary mb-4">
            Market prices are opt-in. Enable them to see current buy/sell prices
            from the BitCraft market.
          </p>
          <button
            onClick={() => setMarketEnabled(true)}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Enable Market Prices
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Market Prices</h1>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-text-muted">
          Prices from Bitjita. Updated on sync.
        </p>
        <button
          onClick={() => setMarketEnabled(false)}
          className="text-xs text-text-secondary hover:text-text-primary"
        >
          Disable Market
        </button>
      </div>
      <div className="rounded-lg border border-border bg-bg-secondary p-8 text-center">
        <p className="text-sm text-text-muted">
          Market price display coming soon. Use the Items page to view individual
          item prices via Bitjita links.
        </p>
      </div>
    </div>
  );
}

export default MarketPage;
