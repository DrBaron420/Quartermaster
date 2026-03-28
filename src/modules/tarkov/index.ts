import { createElement } from "react";
import type { GameModule } from "@/types/module";
import { syncManager } from "@/shared/sync/SyncManager";
import {
  initTarkovSqlite,
  hydrateTarkovFromSqlite,
  syncTarkovData,
} from "./data/tarkovSync";
import TarkovLayout from "./components/TarkovLayout";
import TarkovDashboard from "./TarkovDashboard";
import ItemsPage from "./pages/ItemsPage";
import AmmoPage from "./pages/AmmoPage";

const tarkovModule: GameModule = {
  id: "tarkov",
  name: "Escape from Tarkov",
  version: "0.1.0",
  icon: "🎯",

  layout: createElement(TarkovLayout),

  routes: [
    {
      path: "",
      label: "Dashboard",
      element: createElement(TarkovDashboard),
    },
    {
      path: "items",
      label: "Items",
      element: createElement(ItemsPage),
    },
    {
      path: "ammo",
      label: "Ammo",
      element: createElement(AmmoPage),
    },
  ],

  onEnable: async () => {
    console.log("[Tarkov] Module enabled");
    await initTarkovSqlite();
    await hydrateTarkovFromSqlite();
    syncManager.registerHandler("tarkov", syncTarkovData);

    // Trigger an immediate sync if online
    if (navigator.onLine) {
      syncManager.sync();
    }
  },

  onDisable: () => {
    console.log("[Tarkov] Module disabled");
    syncManager.unregisterHandler("tarkov");
  },
};

export default tarkovModule;
