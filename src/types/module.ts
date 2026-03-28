export interface RouteConfig {
  path: string;
  label: string;
  element: React.ReactNode;
}

/**
 * Every game module exports this contract.
 * The hub core uses it to register, mount, and manage modules.
 */
export interface GameModule {
  /** Unique ID: "tarkov", "elite-dangerous", "star-citizen" */
  id: string;

  /** Display name shown in the sidebar */
  name: string;

  /** Semver version string */
  version: string;

  /** Emoji or icon string for the sidebar (will be a component later) */
  icon: string;

  /** Optional layout wrapper with <Outlet /> for sub-navigation */
  layout?: React.ReactNode;

  /** Pages this module adds to the app */
  routes: RouteConfig[];

  /** Called when user enables the module */
  onEnable?: () => void;

  /** Called when user disables the module */
  onDisable?: () => void;
}
