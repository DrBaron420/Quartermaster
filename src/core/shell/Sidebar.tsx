import { useNavigate, useLocation } from "react-router-dom";
import { useSettingsStore } from "../settings/settingsStore";
import { moduleRegistry } from "../plugins/registry";
import SyncStatusBadge from "@/shared/sync/SyncStatus";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const enabledModuleIds = useSettingsStore((s) => s.enabledModules);

  const enabledModules = moduleRegistry.filter((mod) =>
    enabledModuleIds.includes(mod.id)
  );

  const isActive = (path: string) => location.pathname === path;

  const navButtonClass = (active: boolean) =>
    `flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-all ${
      active
        ? "bg-accent-soft text-accent font-medium border-l-2 border-accent"
        : "text-text-secondary hover:bg-sidebar-hover hover:text-text-primary border-l-2 border-transparent"
    }`;

  return (
    <aside className="flex w-sidebar-width flex-col bg-sidebar-bg">
      {/* Logo area */}
      <div className="flex items-center gap-3 px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20">
          <span className="text-sm font-black text-accent">Q</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-text-primary leading-none">
            Quartermaster
          </p>
          <p className="text-[10px] text-text-muted mt-0.5">Gaming Toolkit</p>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-3 border-t border-border" />

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-0.5">
        <button onClick={() => navigate("/")} className={navButtonClass(isActive("/"))}>
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1L1 7h2v7h4V10h2v4h4V7h2L8 1z" />
          </svg>
          <span>Home</span>
        </button>

        <button onClick={() => navigate("/settings")} className={navButtonClass(isActive("/settings"))}>
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 10a2 2 0 100-4 2 2 0 000 4zm6.32-1.906l-1.078-.622a5.48 5.48 0 000-1.544l1.078-.622a.5.5 0 00.183-.683l-1-1.732a.5.5 0 00-.683-.183l-1.078.622a5.52 5.52 0 00-1.336-.771V2.5a.5.5 0 00-.5-.5h-2a.5.5 0 00-.5.5v1.244a5.52 5.52 0 00-1.336.771L4.992 3.893a.5.5 0 00-.683.183l-1 1.732a.5.5 0 00.183.683l1.078.622a5.48 5.48 0 000 1.544l-1.078.622a.5.5 0 00-.183.683l1 1.732a.5.5 0 00.683.183l1.078-.622c.413.317.862.577 1.336.771V13.5a.5.5 0 00.5.5h2a.5.5 0 00.5-.5v-1.244a5.52 5.52 0 001.336-.771l1.078.622a.5.5 0 00.683-.183l1-1.732a.5.5 0 00-.183-.683z" />
          </svg>
          <span>Settings</span>
        </button>

        {/* Module section */}
        <div className="mt-5 mb-2 px-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">
            Modules
          </span>
        </div>

        {enabledModules.length === 0 ? (
          <div className="px-3 py-2 text-xs text-text-muted/60 italic">
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
                className={navButtonClass(active)}
              >
                {typeof mod.icon === "string" ? (
                  <span className="text-base">{mod.icon}</span>
                ) : (
                  <img src={mod.icon.src} alt={mod.icon.alt} className="h-5 w-5 object-contain" />
                )}
                <span>{mod.name}</span>
              </button>
            );
          })
        )}
      </nav>

      {/* Bottom: sync status */}
      <div className="mx-3 border-t border-border" />
      <div className="px-4 py-3">
        <SyncStatusBadge />
      </div>
    </aside>
  );
}

export default Sidebar;
