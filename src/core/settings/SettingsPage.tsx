import { useSettingsStore } from "./settingsStore";
import { useTheme } from "../theme/ThemeProvider";

function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const syncInterval = useSettingsStore((s) => s.syncIntervalMinutes);
  const setSyncInterval = useSettingsStore((s) => s.setSyncInterval);

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

      {/* Modules - placeholder */}
      <section>
        <h2 className="text-lg font-semibold mb-3 text-text-primary">Modules</h2>
        <div className="rounded-lg bg-bg-secondary p-4">
          <p className="text-sm text-text-muted italic">
            No game modules available yet. Coming soon!
          </p>
        </div>
      </section>
    </div>
  );
}

export default SettingsPage;
