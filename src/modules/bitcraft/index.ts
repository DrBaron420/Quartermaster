import { createElement } from "react";
import type { GameModule } from "@/types/module";
import { syncManager } from "@/shared/sync/SyncManager";
import {
  initBitcraftSqlite,
  hydrateBitcraftFromSqlite,
  syncBitcraftData,
} from "./data/bitcraftSync";
import BitcraftLayout from "./components/BitcraftLayout";
import BitcraftDashboard from "./BitcraftDashboard";
import CalculatorsPage from "./pages/CalculatorsPage";
import ItemsPage from "./pages/ItemsPage";
import CraftingPage from "./pages/CraftingPage";
import MarketPage from "./pages/MarketPage";

const bitcraftModule: GameModule = {
  id: "bitcraft",
  name: "BitCraft",
  version: "0.1.0",
  icon: { src: "/icons/bitcraft.svg", alt: "BitCraft" },

  layout: createElement(BitcraftLayout),

  routes: [
    {
      path: "",
      label: "Dashboard",
      element: createElement(BitcraftDashboard),
    },
    {
      path: "calculators",
      label: "Calculators",
      element: createElement(CalculatorsPage),
    },
    {
      path: "items",
      label: "Items",
      element: createElement(ItemsPage),
    },
    {
      path: "crafting",
      label: "Crafting",
      element: createElement(CraftingPage),
    },
    {
      path: "market",
      label: "Market",
      element: createElement(MarketPage),
    },
  ],

  onEnable: async () => {
    console.log("[BitCraft] Module enabled");
    await initBitcraftSqlite();
    await hydrateBitcraftFromSqlite();
    syncManager.registerHandler("bitcraft", syncBitcraftData);

    if (navigator.onLine) {
      syncManager.sync();
    }
  },

  onDisable: () => {
    console.log("[BitCraft] Module disabled");
    syncManager.unregisterHandler("bitcraft");
  },
};

export default bitcraftModule;
