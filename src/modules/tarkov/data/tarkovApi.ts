import { GraphQLClient, gql } from "graphql-request";
import type { TarkovItem } from "../types/items";
import type { Currency } from "../utils/currency";
import type { TarkovAmmo } from "../types/ammo";
import type { TarkovTask } from "../types/tasks";
import type { HideoutStation } from "../types/hideout";

const client = new GraphQLClient("https://api.tarkov.dev/graphql");

/** Raw API response shapes (differ slightly from our local types) */

interface ApiItemPrice {
  price: number;
  priceRUB: number;
  currency: string;
  vendor: { name: string; minTraderLevel?: number };
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
function mapPrice(p: ApiItemPrice) {
  return {
    price: p.price,
    priceRUB: p.priceRUB,
    currency: p.currency as Currency,
    vendor: p.vendor.name,
    minTraderLevel: p.vendor.minTraderLevel ?? null,
  };
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
        priceRUB
        currency
        vendor {
          name
          ... on TraderOffer {
            minTraderLevel
          }
        }
      }
      sellFor {
        price
        priceRUB
        currency
        vendor {
          name
          ... on TraderOffer {
            minTraderLevel
          }
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

const TASKS_QUERY = gql`
  query GetTasks {
    tasks {
      id
      name
      trader { name }
      map { name }
      minPlayerLevel
      experience
      wikiLink
      taskRequirements { task { id } status }
      objectives { id description type optional }
    }
  }
`;

const HIDEOUT_QUERY = gql`
  query GetHideout {
    hideoutStations {
      id
      name
      levels {
        level
        constructionTime
        description
        itemRequirements {
          item { id name shortName iconLink }
          count
        }
        stationLevelRequirements { station { name } level }
        skillRequirements { name level }
        traderRequirements { trader { name } level }
      }
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

/** Fetch all tasks from tarkov.dev */
export async function fetchTasks(): Promise<TarkovTask[]> {
  interface ApiTask {
    id: string;
    name: string;
    trader: { name: string };
    map: { name: string } | null;
    minPlayerLevel: number;
    experience: number;
    wikiLink: string;
    taskRequirements: { task: { id: string }; status: string[] }[];
    objectives: { id: string; description: string; type: string; optional: boolean }[];
  }

  const data = await client.request<{ tasks: ApiTask[] }>(TASKS_QUERY);
  return data.tasks.map((t) => ({
    id: t.id,
    name: t.name,
    trader: t.trader.name,
    map: t.map?.name ?? null,
    minPlayerLevel: t.minPlayerLevel,
    experience: t.experience,
    wikiLink: t.wikiLink,
    taskRequirements: t.taskRequirements
      .filter((r) => r.status.includes("complete"))
      .map((r) => r.task.id),
    objectives: t.objectives,
  }));
}

/** Fetch all hideout stations from tarkov.dev */
export async function fetchHideout(): Promise<HideoutStation[]> {
  interface ApiStation {
    id: string;
    name: string;
    levels: {
      level: number;
      constructionTime: number;
      description: string;
      itemRequirements: { item: { id: string; name: string; shortName: string; iconLink: string }; count: number }[];
      stationLevelRequirements: { station: { name: string }; level: number }[];
      skillRequirements: { name: string; level: number }[];
      traderRequirements: { trader: { name: string }; level: number }[];
    }[];
  }

  const data = await client.request<{ hideoutStations: ApiStation[] }>(HIDEOUT_QUERY);
  return data.hideoutStations.map((s) => ({
    id: s.id,
    name: s.name,
    levels: s.levels.map((l) => ({
      level: l.level,
      constructionTime: l.constructionTime,
      description: l.description,
      itemRequirements: l.itemRequirements.map((r) => ({
        itemId: r.item.id,
        itemName: r.item.name,
        itemShortName: r.item.shortName,
        itemIcon: r.item.iconLink,
        count: r.count,
      })),
      stationLevelRequirements: l.stationLevelRequirements.map((r) => ({
        stationName: r.station.name,
        level: r.level,
      })),
      skillRequirements: l.skillRequirements,
      traderRequirements: l.traderRequirements.map((r) => ({
        traderName: r.trader.name,
        level: r.level,
      })),
    })),
  }));
}
