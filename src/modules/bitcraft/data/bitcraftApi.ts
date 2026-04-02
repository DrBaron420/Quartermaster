import type { BitcraftItem, CraftingRecipe, CraftingRecipeIngredient, BitcraftItemDetail } from "../types/items";
import type { ItemMarketData, BulkPriceResult } from "../types/market";
import { isExcludedIngredient } from "../utils/recipeOverrides";

// In dev mode, use Vite proxy to avoid CORS issues.
// In Tauri production, hit the API directly.
const IS_DEV = import.meta.env.DEV;
const BASE_URL = IS_DEV ? "/bitjita-api" : "https://bitjita.com/api";
const APP_ID = "Quartermaster/0.2.0";

// ── Rate limiter (250 req/min) ──────────────────────────

const RATE_LIMIT = 240; // stay under 250
const WINDOW_MS = 60_000;
const timestamps: number[] = [];

async function throttle(): Promise<void> {
  const now = Date.now();
  while (timestamps.length > 0 && now - timestamps[0] > WINDOW_MS) {
    timestamps.shift();
  }
  if (timestamps.length >= RATE_LIMIT) {
    const waitMs = timestamps[0] + WINDOW_MS - now;
    await new Promise((r) => setTimeout(r, waitMs));
  }
  timestamps.push(Date.now());
}

// ── Fetch wrapper ───────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  await throttle();
  const res = await fetch(BASE_URL + path, {
    ...options,
    headers: {
      "x-app-identifier": APP_ID,
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`Bitjita API error ${res.status}: ${path}`);
  }
  return res.json();
}

// ── API response shapes ─────────────────────────────────

interface ApiItem {
  id: number;
  name: string;
  iconAssetName: string;
  rarity: number;
  rarityStr: string;
  tier: number;
  tag: string;
}

/** Actual shape from /api/items/{id} craftingRecipes and /api/crafts craftResults */
interface ApiCraftingRecipeDetail {
  id?: number;
  recipeId?: number;
  craftedItems?: { item_id: number; quantity: number; item_type: string }[];
  craftedItem?: { item_id: number; quantity: number; item_type: string }[];
  consumedItems?: { id: number; item_id: number; quantity: number; name: string; iconAssetName: string; item_type: string }[];
  levelRequirements?: { level: number; skill_id: number; skillTitle?: string }[];
  toolRequirements?: { level: number; power: number; tool_type: string }[];
  experiencePerProgress?: { quantity: number; skill_id: number }[];
  buildingName?: string;
  outputQuantity?: number;
}

// ── Mappers ─────────────────────────────────────────────

function mapItem(api: ApiItem): BitcraftItem {
  return {
    id: String(api.id),
    name: api.name,
    iconAssetName: api.iconAssetName,
    rarity: api.rarity,
    rarityStr: (api.rarityStr || "Common") as BitcraftItem["rarityStr"],
    tier: api.tier,
    tag: api.tag,
  };
}

function mapRecipeDetail(api: ApiCraftingRecipeDetail, itemNameLookup?: Map<number, string>): CraftingRecipe {
  const recipeId = String(api.id ?? api.recipeId ?? "");
  const crafted = api.craftedItems?.[0] ?? api.craftedItem?.[0];
  const resultItemId = String(crafted?.item_id ?? "");
  const resultItemName = itemNameLookup?.get(crafted?.item_id ?? 0) ?? `Item #${resultItemId}`;
  const resultQuantity = api.outputQuantity ?? crafted?.quantity ?? 1;

  const ingredients: CraftingRecipeIngredient[] = (api.consumedItems ?? [])
    .filter((c) => !isExcludedIngredient(c.name ?? ""))
    .map((c) => ({
      itemId: String(c.item_id ?? c.id),
      itemName: c.name ?? `Item #${c.item_id}`,
      quantity: c.quantity,
    }));

  const levelReq = api.levelRequirements?.[0];
  const skillName = levelReq?.skillTitle ?? (levelReq?.skill_id != null ? `Skill #${levelReq.skill_id}` : "Unknown");
  const levelRequired = levelReq?.level ?? 0;

  const xpReward = api.experiencePerProgress?.[0]?.quantity ?? 0;

  return {
    recipeId,
    resultItemId,
    resultItemName,
    resultQuantity,
    ingredients,
    skillName,
    levelRequired,
    xpReward,
  };
}

// ── Public API ──────────────────────────────────────────

/** Extract array from API response (handles both raw arrays and wrapped objects) */
function extractArray<T>(data: unknown, fallbackKeys = ["items", "data", "results"]): T[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    for (const key of fallbackKeys) {
      const val = (data as Record<string, unknown>)[key];
      if (Array.isArray(val)) return val;
    }
    // Only warn for truly unexpected shapes (not item detail responses)
    const keys = Object.keys(data as object);
    if (!keys.includes("craftingRecipes") && !keys.includes("item")) {
      console.warn("[BitCraft] Unexpected API response shape:", keys);
    }
  }
  return [];
}

/** Fetch all items */
export async function fetchItems(): Promise<BitcraftItem[]> {
  const raw = await apiFetch<unknown>("/items");
  const items = extractArray<ApiItem>(raw);
  console.log(`[BitCraft] Fetched ${items.length} raw items`);
  return items.map(mapItem);
}

/**
 * Fetch craftable item summaries from /api/crafts.
 * This endpoint shows live crafts on the server. We deduplicate by recipeId
 * to get a list of known craftable items with skill/level requirements.
 * Full recipe ingredients are fetched on-demand via fetchItemDetail().
 */
export async function fetchRecipes(): Promise<CraftingRecipe[]> {
  const raw = await apiFetch<unknown>("/crafts");
  const data = raw as Record<string, unknown>;
  const craftResults = extractArray<Record<string, unknown>>(data, ["craftResults"]);
  // Also grab the items array for name lookups
  const craftItems = extractArray<{ id: number; name: string }>(data, ["items"]);
  const itemNameMap = new Map<number, string>();
  for (const item of craftItems) {
    itemNameMap.set(item.id, item.name);
  }
  // Also try to get skill names from skillMap
  const skillMap = (data.skillMap ?? {}) as Record<string, string>;

  console.log(`[BitCraft] Processing ${craftResults.length} live crafts...`);

  // Deduplicate by recipeId
  const recipeMap = new Map<string, CraftingRecipe>();
  for (const craft of craftResults) {
    const recipeId = String(craft.recipeId ?? "");
    if (!recipeId || recipeMap.has(recipeId)) continue;

    const craftedItem = craft.craftedItem as { item_id: number; quantity: number }[] | undefined;
    if (!craftedItem || craftedItem.length === 0) continue;

    const resultItemId = String(craftedItem[0].item_id);
    const resultItemName = itemNameMap.get(craftedItem[0].item_id) ?? `Item #${resultItemId}`;
    const resultQuantity = craftedItem[0].quantity ?? 1;

    // Extract skill info from levelRequirements
    const levelReqs = craft.levelRequirements as { level: number; skill_id: number }[] | undefined;
    const skillId = levelReqs?.[0]?.skill_id;
    const skillName = skillId != null ? (skillMap[String(skillId)] ?? `Skill #${skillId}`) : "Unknown";
    const levelRequired = levelReqs?.[0]?.level ?? 0;

    // XP from experiencePerProgress
    const xpEntries = craft.experiencePerProgress as { quantity: number }[] | undefined;
    const xpReward = xpEntries?.[0]?.quantity ?? 0;

    recipeMap.set(recipeId, {
      recipeId,
      resultItemId,
      resultItemName,
      resultQuantity,
      ingredients: [], // Filled on-demand via fetchItemDetail
      skillName,
      levelRequired,
      xpReward,
    });
  }

  const recipes = Array.from(recipeMap.values());
  console.log(`[BitCraft] Extracted ${recipes.length} unique recipes from live crafts`);
  return recipes;
}

/** Fetch detail for a single item (on-demand, not bulk synced) */
export async function fetchItemDetail(itemId: string): Promise<BitcraftItemDetail> {
  const raw = await apiFetch<unknown>(`/items/${itemId}`);
  const data = raw as Record<string, unknown>;

  const item = (data.item ?? data) as ApiItem;

  // Build name lookup from all items in the response
  const allItemsList = extractArray<{ id: number; name: string }>(data, ["items"]);
  const nameLookup = new Map<number, string>();
  for (const i of allItemsList) nameLookup.set(i.id, i.name);
  // Also add the item itself
  if (item.id && item.name) nameLookup.set(Number(item.id), item.name);

  const craftingRecipesRaw = extractArray<ApiCraftingRecipeDetail>(data, ["craftingRecipes", "recipes"]);
  const extractionRecipesRaw = extractArray<Record<string, unknown>>(data, ["extractionRecipes"]);
  const relatedSkills = extractArray<{ skillName: string; levelRequired: number }>(data, ["relatedSkills"]);
  const recipesUsingItem = extractArray<{ recipeId: string; resultItemName: string }>(data, ["recipesUsingItem"]);

  const craftingRecipes = craftingRecipesRaw.map((r) => mapRecipeDetail(r, nameLookup));


  return {
    ...mapItem(item),
    craftingRecipes,
    extractionRecipes: extractionRecipesRaw as BitcraftItemDetail["extractionRecipes"],
    relatedSkills,
    recipesUsingItem,
  };
}

/** Fetch market data for a single item */
export async function fetchItemMarket(
  itemId: string,
  regionId?: number
): Promise<ItemMarketData> {
  const params = regionId != null ? `?regionId=${regionId}` : "";
  const data = await apiFetch<ItemMarketData>(`/market/item/${itemId}${params}`);
  return { itemId, sellOrders: data.sellOrders, buyOrders: data.buyOrders };
}

/** Fetch bulk prices (max 100 per call, auto-chunked) */
export async function fetchBulkPrices(
  itemIds: string[]
): Promise<BulkPriceResult[]> {
  const results: BulkPriceResult[] = [];
  for (let i = 0; i < itemIds.length; i += 100) {
    const chunk = itemIds.slice(i, i + 100);
    const data = await apiFetch<BulkPriceResult[]>("/market/prices/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemIds: chunk }),
    });
    results.push(...data);
  }
  return results;
}
