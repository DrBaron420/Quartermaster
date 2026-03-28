import { NavLink, Outlet } from "react-router-dom";

const tabs = [
  { path: "", label: "Dashboard", end: true },
  { path: "items", label: "Items" },
  { path: "ammo", label: "Ammo" },
];

function TarkovLayout() {
  return (
    <div>
      {/* Sub-navigation tabs */}
      <nav className="flex gap-1 mb-6 border-b border-border pb-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.end}
            className={({ isActive }) =>
              `rounded-md px-4 py-1.5 text-sm transition-colors ${
                isActive
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}

export default TarkovLayout;
