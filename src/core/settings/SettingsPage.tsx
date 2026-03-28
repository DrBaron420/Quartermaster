import { useSettingsStore } from "./settingsStore";
import { useTheme } from "../theme/ThemeProvider";
import { moduleRegistry } from "../plugins/registry";

function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const syncInterval = useSettingsStore((s) => s.syncIntervalMinutes);
  const setSyncInterval = useSettingsStore((s) => s.setSyncInterval);
  const enabledModules = useSettingsStore((s) => s.enabledModules);
  const toggleModule = useSettingsStore((s) => s.toggleModule);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Theme */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-text-primary">Appearance</h2>
        <div className="flex items-center justify-between rounded-lg bg-bg-secondary p-4">
          <div>
            <p className="text-sm text-text-primary">Theme</p>
            <p className="text-xs text-text-muted">Switch between dark and light mode</p>
          </div>
          <button
            onClick={toggleTheme}
            className="rounded-md bg-bg-tertiary px-4 py-2 text-sm text-text-primary
                       hover:bg-bg-hover transition-colors"
          >
            {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
          </button>
        </div>
      </section>

      {/* Sync */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-text-primary">Data Sync</h2>
        <div className="flex items-center justify-between rounded-lg bg-bg-secondary p-4">
          <div>
            <p className="text-sm text-text-primary">Sync interval</p>
            <p className="text-xs text-text-muted">How often to check for fresh data (minutes)</p>
          </div>
          <select
            value={syncInterval}
            onChange={(e) => setSyncInterval(Number(e.target.value))}
            className="rounded-md bg-bg-tertiary px-3 py-2 text-sm text-text-primary
                       border border-border focus:outline-none focus:border-accent"
          >
            <option value={5}>5 min</option>
            <option value={15}>15 min</option>
            <option value={30}>30 min</option>
            <option value={60}>1 hour</option>
          </select>
        </div>
      </section>

      {/* Modules */}
      <section>
        <h2 className="text-lg font-semibold mb-3 text-text-primary">Modules</h2>
        {moduleRegistry.length === 0 ? (
          <div className="rounded-lg bg-bg-secondary p-4">
            <p className="text-sm text-text-muted italic">
              No game modules available yet. The Tarkov module is coming first!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {moduleRegistry.map((mod) => {
              const isEnabled = enabledModules.includes(mod.id);
              return (
                <div
                  key={mod.id}
                  className="flex items-center justify-between rounded-lg bg-bg-secondary p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{mod.icon}</span>
                    <div>
                      <p className="text-sm text-text-primary">{mod.name}</p>
                      <p className="text-xs text-text-muted">v{mod.version}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleModule(mod.id)}
                    className={`rounded-md px-4 py-2 text-sm transition-colors ${
                      isEnabled
                        ? "bg-accent text-white hover:bg-accent-hover"
                        : "bg-bg-tertiary text-text-secondary hover:bg-bg-hover"
                    }`}
                  >
                    {isEnabled ? "Enabled" : "Disabled"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default SettingsPage;
