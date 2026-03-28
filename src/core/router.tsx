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
 */
export function buildRouter(enabledModules: GameModule[]) {
  const moduleRoutes = enabledModules.flatMap((mod) =>
    mod.routes.map((route) => ({
      path: `modules/${mod.id}${route.path}`,
      element: route.element,
    }))
  );

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
