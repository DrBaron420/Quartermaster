import { useLiveQuery } from "dexie-react-hooks";
import { tarkovDb } from "./data/tarkovDb";

function TarkovDashboard() {
  const itemCount = useLiveQuery(() => tarkovDb.items.count()) ?? 0;
  const ammoCount = useLiveQuery(() => tarkovDb.ammo.count()) ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Escape from Tarkov</h1>
      <p className="text-text-secondary mb-6">
        Module dashboard — data from tarkov.dev
      </p>

      <div className="grid grid-cols-2 gap-4 max-w-lg">
        <div className="rounded-lg bg-bg-secondary p-4 border border-border">
          <p className="text-2xl font-bold text-text-primary">{itemCount.toLocaleString()}</p>
          <p className="text-sm text-text-muted">Items cached</p>
        </div>
        <div className="rounded-lg bg-bg-secondary p-4 border border-border">
          <p className="text-2xl font-bold text-text-primary">{ammoCount.toLocaleString()}</p>
          <p className="text-sm text-text-muted">Ammo types cached</p>
        </div>
      </div>

      {itemCount === 0 && (
        <div className="mt-6 rounded-lg bg-accent-soft p-4 border border-accent/20 max-w-lg">
          <p className="text-sm text-text-secondary">
            No data cached yet. Data will sync automatically when online, or you
            can wait for the next sync interval.
          </p>
        </div>
      )}
    </div>
  );
}

export default TarkovDashboard;
