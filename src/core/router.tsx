import {
  createBrowserRouter,
  Navigate,
  Outlet,
} from "react-router-dom";
import AppShell from "./shell/AppShell";
import HomePage from "./HomePage";
import SettingsPage from "./settings/SettingsPage";
import type { GameModule } from "@/types/module";

/**
 * Builds the app router dynamically based on enabled modules.
 * The hub always has Home and Settings routes.
 * Each enabled module injects its own routes under /modules/{moduleId}/.
 * If a module has a layout, its routes become children of that layout.
 */
export function buildRouter(enabledModules: GameModule[]) {
  const moduleRoutes = enabledModules.map((mod) => {
    const children = mod.routes.map((route) => ({
      // Use index route for empty path, otherwise normal path
      ...(route.path === "" ? { index: true as const } : { path: route.path }),
      element: route.element,
    }));

    return {
      path: `modules/${mod.id}`,
      element: mod.layout ?? <Outlet />,
      children,
    };
  });

  return createBrowserRouter([
    {
      path: "/",
      element: (
        <AppShell>
          <Outlet />
        </AppShell>
      ),
      children: [
        { index: true, element: <HomePage /> },
        { path: "settings", element: <SettingsPage /> },
        ...moduleRoutes,
        { path: "*", element: <Navigate to="/" replace /> },
      ],
    },
  ]);
}
