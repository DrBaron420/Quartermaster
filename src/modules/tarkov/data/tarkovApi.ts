import { GraphQLClient, gql } from "graphql-request";
import type { TarkovItem, ItemPrice } from "../types/items";
import type { TarkovAmmo } from "../types/ammo";

const client = new GraphQLClient("https://api.tarkov.dev/graphql");

/** Raw API response shapes (differ slightly from our local types) */

interface ApiItemPrice {
  price: number;
  currency: string;
  vendor: { name: string };
}

interface ApiItem {
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
  categories: { name: string }[];
  buyFor: ApiItemPrice[];
  sellFor: ApiItemPrice[];
}

interface ApiAmmo {
  item: {
    id: string;
    name: string;
    shortName: string;
    iconLink: string;
  };
  caliber: string;
  damage: number;
  penetrationPower: number;
  armorDamage: number;
  fragmentationChance: number;
  ricochetChance: number;
  initialSpeed: number;
  tracer: boolean;
}

/** Transform API price to our local shape */
function mapPrice(p: ApiItemPrice): ItemPrice {
  return { price: p.price, currency: p.currency, vendor: p.vendor.name };
}

/** Transform API item to our local shape */
function mapItem(item: ApiItem): TarkovItem {
  return {
    id: item.id,
    name: item.name,
    shortName: item.shortName,
    normalizedName: item.normalizedName,
    updated: item.updated,
    iconLink: item.iconLink,
    image512pxLink: item.image512pxLink,
    wikiLink: item.wikiLink,
    basePrice: item.basePrice,
    width: item.width,
    height: item.height,
    weight: item.weight,
    types: item.types,
    categories: item.categories.map((c) => c.name),
    buyFor: item.buyFor.map(mapPrice),
    sellFor: item.sellFor.map(mapPrice),
  };
}

/** Transform API ammo to our local shape */
function mapAmmo(ammo: ApiAmmo): TarkovAmmo {
  return {
    id: ammo.item.id,
    name: ammo.item.name,
    shortName: ammo.item.shortName,
    iconLink: ammo.item.iconLink,
    caliber: ammo.caliber,
    damage: ammo.damage,
    penetrationPower: ammo.penetrationPower,
    armorDamage: ammo.armorDamage,
    fragmentationChance: ammo.fragmentationChance,
    ricochetChance: ammo.ricochetChance,
    initialSpeed: ammo.initialSpeed,
    tracer: ammo.tracer,
  };
}

// ── Queries ──────────────────────────────────────────────

const ITEMS_QUERY = gql`
  query GetItems {
    items {
      id
      name
      shortName
      normalizedName
      updated
      iconLink
      image512pxLink
      wikiLink
      basePrice
      width
      height
      weight
      types
      categories {
        name
      }
      buyFor {
        price
        currency
        vendor {
          name
        }
      }
      sellFor {
        price
        currency
        vendor {
          name
        }
      }
    }
  }
`;

const AMMO_QUERY = gql`
  query GetAmmo {
    ammo {
      item {
        id
        name
        shortName
        iconLink
      }
      caliber
      damage
      penetrationPower
      armorDamage
      fragmentationChance
      ricochetChance
      initialSpeed
      tracer
    }
  }
`;

// ── Public API ───────────────────────────────────────────

/** Fetch all items from tarkov.dev */
export async function fetchItems(): Promise<TarkovItem[]> {
  const data = await client.request<{ items: ApiItem[] }>(ITEMS_QUERY);
  return data.items.map(mapItem);
}

/** Fetch all ammo from tarkov.dev */
export async function fetchAmmo(): Promise<TarkovAmmo[]> {
  const data = await client.request<{ ammo: ApiAmmo[] }>(AMMO_QUERY);
  return data.ammo.map(mapAmmo);
}
