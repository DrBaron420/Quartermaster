function Titlebar() {
  return (
    <div
      data-tauri-drag-region
      className="flex h-8 items-center justify-between bg-sidebar-bg border-b border-border px-4"
    >
      <span
        data-tauri-drag-region
        className="text-xs font-medium text-text-muted"
      >
        Quartermaster
      </span>

      {/* Window controls are handled natively by Tauri on Windows */}
      <div />
    </div>
  );
}

export default Titlebar;
