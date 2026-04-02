export interface MarketOrder {
  priceThreshold: number;
  quantity: number;
  regionId: number;
  regionName: string;
}

export interface ItemMarketData {
  itemId: string;
  sellOrders: MarketOrder[];
  buyOrders: MarketOrder[];
}

export interface BulkPriceResult {
  itemId: string;
  lowestSellPrice: number | null;
  highestBuyPrice: number | null;
  spread: number | null;
  volume24h: number;
}
