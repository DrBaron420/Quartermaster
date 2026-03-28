import { useSettingsStore } from "./settings/settingsStore";
import { moduleRegistry } from "./plugins/registry";

function HomePage() {
  const enabledModules = useSettingsStore((s) => s.enabledModules);
  const enabledCount = enabledModules.length;
  const totalCount = moduleRegistry.length;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Welcome to Quartermaster</h1>
      <p className="text-text-secondary mb-6">
        Your gaming toolkit hub.
      </p>

      <div className="grid gap-4 max-w-lg">
        {/* Status card */}
        <div className="rounded-lg bg-bg-secondary p-4 border border-border">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
            Status
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Modules enabled</span>
              <span className="text-text-primary">{enabledCount} / {totalCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Last sync</span>
              <span className="text-text-muted">Never</span>
            </div>
          </div>
        </div>

        {/* Quick start */}
        {enabledCount === 0 && totalCount > 0 && (
          <div className="rounded-lg bg-accent-soft p-4 border border-accent/20">
            <p className="text-sm text-text-secondary">
              No modules enabled yet. Head to{" "}
              <a href="/settings" className="text-accent hover:underline">
                Settings
              </a>{" "}
              to enable a game module.
            </p>
          </div>
        )}

        {totalCount === 0 && (
          <div className="rounded-lg bg-bg-secondary p-4 border border-border">
            <p className="text-sm text-text-muted italic">
              No game modules available yet. The Tarkov module is coming first!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;
