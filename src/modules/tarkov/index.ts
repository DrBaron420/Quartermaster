import { createElement } from "react";
import type { GameModule } from "@/types/module";
import { syncManager } from "@/shared/sync/SyncManager";
import {
  initTarkovSqlite,
  hydrateTarkovFromSqlite,
  syncTarkovData,
} from "./data/tarkovSync";
import TarkovDashboard from "./TarkovDashboard";

const tarkovModule: GameModule = {
  id: "tarkov",
  name: "Escape from Tarkov",
  version: "0.1.0",
  icon: "🎯",

  routes: [
    {
      path: "",
      label: "Dashboard",
      element: createElement(TarkovDashboard),
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
