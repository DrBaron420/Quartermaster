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
import TasksPage from "./pages/TasksPage";
import HideoutPage from "./pages/HideoutPage";

const tarkovModule: GameModule = {
  id: "tarkov",
  name: "Escape from Tarkov",
  version: "0.2.0",
  icon: { src: "/icons/tarkov.svg", alt: "Tarkov" },

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
    {
      path: "tasks",
      label: "Tasks",
      element: createElement(TasksPage),
    },
    {
      path: "hideout",
      label: "Hideout",
      element: createElement(HideoutPage),
    },
  ],

  onEnable: async () => {
    console.log("[Tarkov] Module enabled");
    await initTarkovSqlite();
    await hydrateTarkovFromSqlite();
    syncManager.registerHandler("tarkov", syncTarkovData);

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
