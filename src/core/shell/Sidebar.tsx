const navItems = [
  { id: "home", label: "Home", icon: "🏠" },
];

function Sidebar() {
  return (
    <aside className="flex w-sidebar-width flex-col bg-sidebar-bg border-r border-border">
      {/* Logo / App title */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <span className="text-lg font-bold text-text-primary">QM</span>
        <span className="text-sm text-text-secondary">Quartermaster</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3">
        {navItems.map((item) => (
          <button
            key={item.id}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm
                       text-text-secondary hover:bg-sidebar-hover hover:text-text-primary
                       transition-colors"
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}

        {/* Module section header */}
        <div className="mt-6 mb-2 px-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Modules
          </span>
        </div>

        {/* Placeholder for game modules — will be dynamic later */}
        <div className="px-3 py-2 text-sm text-text-muted italic">
          No modules enabled
        </div>
      </nav>

      {/* Bottom section: status + settings */}
      <div className="border-t border-border px-3 py-3">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span className="h-2 w-2 rounded-full bg-success" />
          <span>Online</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
