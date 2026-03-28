import { useNavigate, useLocation } from "react-router-dom";
import { useSettingsStore } from "../settings/settingsStore";
import SyncStatusBadge from "@/shared/sync/SyncStatus";
import { moduleRegistry } from "../plugins/registry";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const enabledModuleIds = useSettingsStore((s) => s.enabledModules);

  const enabledModules = moduleRegistry.filter((mod) =>
    enabledModuleIds.includes(mod.id)
  );

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="flex w-sidebar-width flex-col bg-sidebar-bg border-r border-border">
      {/* Logo / App title */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <span className="text-lg font-bold text-text-primary">QM</span>
        <span className="text-sm text-text-secondary">Quartermaster</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        <button
          onClick={() => navigate("/")}
          className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm
                     transition-colors ${
                       isActive("/")
                         ? "bg-sidebar-active text-text-primary"
                         : "text-text-secondary hover:bg-sidebar-hover hover:text-text-primary"
                     }`}
        >
          <span>🏠</span>
          <span>Home</span>
        </button>

        <button
          onClick={() => navigate("/settings")}
          className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm
                     transition-colors ${
                       isActive("/settings")
                         ? "bg-sidebar-active text-text-primary"
                         : "text-text-secondary hover:bg-sidebar-hover hover:text-text-primary"
                     }`}
        >
          <span>⚙️</span>
          <span>Settings</span>
        </button>

        {/* Module section */}
        <div className="mt-6 mb-2 px-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Modules
          </span>
        </div>

        {enabledModules.length === 0 ? (
          <div className="px-3 py-2 text-sm text-text-muted italic">
            No modules enabled
          </div>
        ) : (
          enabledModules.map((mod) => {
            const modulePath = `/modules/${mod.id}`;
            const active = location.pathname.startsWith(modulePath);
            return (
              <button
                key={mod.id}
                onClick={() => navigate(modulePath)}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm
                           transition-colors ${
                             active
                               ? "bg-sidebar-active text-text-primary"
                               : "text-text-secondary hover:bg-sidebar-hover hover:text-text-primary"
                           }`}
              >
                <span>{mod.icon}</span>
                <span>{mod.name}</span>
              </button>
            );
          })
        )}
      </nav>

      {/* Bottom section: sync status */}
      <div className="border-t border-border px-3 py-3">
        <SyncStatusBadge />
      </div>
    </aside>
  );
}

export default Sidebar;
