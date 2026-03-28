import { useMemo, useEffect, useRef } from "react";
import { RouterProvider } from "react-router-dom";
import { useSettingsStore } from "../settings/settingsStore";
import { moduleRegistry } from "./registry";
import { buildRouter } from "../router";

/**
 * PluginLoader reads which modules are enabled from settings,
 * filters the registry, builds a router with their routes injected,
 * and calls onEnable/onDisable lifecycle hooks when modules change.
 */
function PluginLoader() {
  const enabledModuleIds = useSettingsStore((s) => s.enabledModules);
  const prevEnabledRef = useRef<string[]>([]);

  const enabledModules = useMemo(
    () => moduleRegistry.filter((mod) => enabledModuleIds.includes(mod.id)),
    [enabledModuleIds]
  );

  // Call onEnable/onDisable when the enabled set changes
  useEffect(() => {
    const prev = prevEnabledRef.current;
    const curr = enabledModuleIds;

    // Newly enabled
    const added = curr.filter((id) => !prev.includes(id));
    for (const id of added) {
      const mod = moduleRegistry.find((m) => m.id === id);
      mod?.onEnable?.();
    }

    // Newly disabled
    const removed = prev.filter((id) => !curr.includes(id));
    for (const id of removed) {
      const mod = moduleRegistry.find((m) => m.id === id);
      mod?.onDisable?.();
    }

    prevEnabledRef.current = curr;
  }, [enabledModuleIds]);

  const router = useMemo(() => buildRouter(enabledModules), [enabledModules]);

  return <RouterProvider router={router} />;
}

export default PluginLoader;
