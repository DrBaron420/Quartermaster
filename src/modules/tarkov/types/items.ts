/** Price entry from a vendor (trader or flea market) */
export interface ItemPrice {
  price: number;
  currency: string;
  vendor: string;
}

/** A Tarkov item as stored locally */
export interface TarkovItem {
  id: string;
  name: string;
  shortName: string;
  normalizedName: string;
  updated: string;
  iconLink: string;
  image512pxLink: string;
  wikiLink: string;
  basePrice: number;
  width: number;
  height: number;
  weight: number;
  types: string[];
  categories: string[];
  buyFor: ItemPrice[];
  sellFor: ItemPrice[];
}
