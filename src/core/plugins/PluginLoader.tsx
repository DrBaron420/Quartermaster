import { useMemo } from "react";
import { RouterProvider } from "react-router-dom";
import { useSettingsStore } from "../settings/settingsStore";
import { moduleRegistry } from "./registry";
import { buildRouter } from "../router";

/**
 * PluginLoader reads which modules are enabled from settings,
 * filters the registry, and builds a router with their routes injected.
 */
function PluginLoader() {
  const enabledModuleIds = useSettingsStore((s) => s.enabledModules);

  const enabledModules = useMemo(
    () => moduleRegistry.filter((mod) => enabledModuleIds.includes(mod.id)),
    [enabledModuleIds]
  );

  const router = useMemo(() => buildRouter(enabledModules), [enabledModules]);

  return <RouterProvider router={router} />;
}

export default PluginLoader;
