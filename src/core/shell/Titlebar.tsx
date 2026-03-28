import { getCurrentWindow } from "@tauri-apps/api/window";

function Titlebar() {
  const appWindow = getCurrentWindow();

  const handleMinimize = () => appWindow.minimize();
  const handleMaximize = () => appWindow.toggleMaximize();
  const handleClose = () => appWindow.close();

  return (
    <div
      data-tauri-drag-region
      className="flex h-9 items-center justify-between bg-titlebar-bg select-none"
    >
      {/* Left: App identity */}
      <div data-tauri-drag-region className="flex items-center gap-2 pl-4">
        <span
          data-tauri-drag-region
          className="text-xs font-bold tracking-widest uppercase text-accent"
        >
          QM
        </span>
        <span
          data-tauri-drag-region
          className="text-[11px] text-text-muted"
        >
          Quartermaster
        </span>
        <span
          data-tauri-drag-region
          className="text-[10px] text-text-muted/50 ml-1"
        >
          v0.1.6 TE
        </span>
      </div>

      {/* Right: Window controls */}
      <div className="flex h-full">
        <button
          onClick={handleMinimize}
          className="flex items-center justify-center w-11 h-full
                     text-text-muted hover:bg-win-btn-hover hover:text-text-primary
                     transition-colors"
          tabIndex={-1}
        >
          <svg width="10" height="1" viewBox="0 0 10 1">
            <rect fill="currentColor" width="10" height="1" />
          </svg>
        </button>
        <button
          onClick={handleMaximize}
          className="flex items-center justify-center w-11 h-full
                     text-text-muted hover:bg-win-btn-hover hover:text-text-primary
                     transition-colors"
          tabIndex={-1}
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <rect
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              x="0.5"
              y="0.5"
              width="9"
              height="9"
            />
          </svg>
        </button>
        <button
          onClick={handleClose}
          className="flex items-center justify-center w-11 h-full
                     text-text-muted hover:bg-win-btn-close hover:text-white
                     transition-colors"
          tabIndex={-1}
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <line stroke="currentColor" strokeWidth="1.2" x1="0" y1="0" x2="10" y2="10" />
            <line stroke="currentColor" strokeWidth="1.2" x1="10" y1="0" x2="0" y2="10" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default Titlebar;
