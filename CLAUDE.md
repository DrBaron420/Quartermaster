# Quartermaster - Project Instructions

## Project Overview

Quartermaster is a **modular gaming toolkit hub** -- a desktop app that serves as a
central dashboard for game-specific tools, databases, and utilities. Think of it like
a workbench where each drawer is dedicated to a different game.

**Core ideas:**
- **Offline-first**: The app saves a local snapshot of all data. If the internet drops,
  everything keeps working. When connectivity returns, it syncs fresh data.
- **Modular**: Each game is a self-contained plugin. You can enable or disable them
  independently. Adding a new game never breaks existing ones.
- **Desktop-first**: Ships as a native desktop app via Tauri. Mobile support comes later
  using the same Tauri v2 codebase.
- **Dark theme by default**: Because we are not animals.
- **Personal use first**: Build for yourself, polish for public release later.

**Target games (in priority order):**
1. Escape from Tarkov -- first module, complete and in use
2. Star Citizen
3. Elite Dangerous
4. Minecraft

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Desktop shell | **Tauri v2** | Lightweight native wrapper, Rust backend, future mobile support |
| Frontend | **React 19 + TypeScript 6** | Component-based UI, strong typing catches bugs early |
| Styling | **Tailwind CSS v4** | Utility-first, CSS custom properties for theming |
| State management | **Zustand** | Simple, minimal boilerplate, persist middleware for localStorage |
| Local DB (browser) | **Dexie.js (IndexedDB)** | Offline snapshot storage, fast reads from the browser side |
| Local DB (native) | **SQLite via Tauri plugin** | Persistent storage on disk, survives app reinstalls |
| API client | **graphql-request** | Lightweight GraphQL client for Tarkov.dev API |
| Routing | **React Router v7** | Dynamic route building for module pages |
| Build tool | **Vite** | Fast dev server, comes with Tauri scaffolding |

### Tauri Plugins

| Plugin | Purpose |
|--------|---------|
| `tauri-plugin-sql` | SQLite database access from frontend |
| `tauri-plugin-updater` | Auto-update checking against GitHub releases |
| `tauri-plugin-process` | App restart after update installation |
| `tauri-plugin-shell` | Open external URLs in default browser |
| `tauri-plugin-log` | Logging in debug mode |

### Why two databases?

- **Dexie/IndexedDB** lives inside the browser/webview. It is fast for the UI to read
  from and is where the "current working data" lives. The React app talks directly to it.
- **SQLite** lives on the native filesystem via Tauri's Rust backend. It is the durable
  "source of truth" that persists even if the webview cache gets cleared.

Data flows: `API --> SQLite (persist) --> Dexie (UI cache) --> React components`

---

## Architecture Overview

### The Big Picture

```
+------------------------------------------------------------------+
|                        QUARTERMASTER APP                          |
|                                                                   |
|  +------------------+   +-------------------------------------+  |
|  |                  |   |           GAME MODULES              |  |
|  |    HUB CORE      |   |                                     |  |
|  |                  |   |  +----------+  +---------+  +-----+ |  |
|  |  - Shell / Nav   |   |  | Tarkov   |  | SC      |  | ED  | |  |
|  |  - Theme engine  |   |  | Module   |  | Module  |  | Mod | |  |
|  |  - Plugin loader |   |  | (active) |  | (future)|  |     | |  |
|  |  - Sync engine   |   |  +----------+  +---------+  +-----+ |  |
|  |  - Settings      |   |                                     |  |
|  |  - Updater       |   +-------------------------------------+  |
|  |                  |                                             |
|  +------------------+                                             |
|                                                                   |
|  +------------------------------------------------------------+  |
|  |                    SHARED SERVICES                          |  |
|  |  Data layer (Dexie + SQLite) | Sync engine | Toast system   |  |
|  +------------------------------------------------------------+  |
|                                                                   |
|  +------------------------------------------------------------+  |
|  |                    TAURI BACKEND (Rust)                     |  |
|  |  SQLite | Shell (URLs) | Updater | Process | Log            |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+
```

### What is a "module"?

A module is a folder that exports a standard shape:

```typescript
export interface GameModule {
  id: string;              // "tarkov", "star-citizen"
  name: string;            // Display name
  version: string;         // Semver
  icon: string | { src: string; alt: string }; // Emoji or image
  layout?: React.ReactNode; // Optional layout with <Outlet /> for sub-nav
  routes: RouteConfig[];   // Pages this module adds
  onEnable?: () => void;   // Called when user enables the module
  onDisable?: () => void;  // Called when user disables the module
}
```

The hub core imports these, checks which ones the user has enabled in settings, and
renders only the active ones. The PluginLoader calls `onEnable`/`onDisable` lifecycle
hooks when modules are toggled.

---

## Project Structure

```
quartermaster/
|
|-- src-tauri/                  # Tauri / Rust backend
|   |-- src/
|   |   |-- main.rs             # Tauri entry point
|   |   |-- lib.rs              # Plugin registration
|   |-- icons/                  # App icons (all sizes, .ico)
|   |-- capabilities/           # Tauri permission config
|   |-- tauri.conf.json         # Tauri configuration
|   |-- Cargo.toml
|
|-- src/                        # React frontend
|   |-- main.tsx                # App entry point
|   |-- App.tsx                 # Root component (ThemeProvider + PluginLoader)
|   |-- styles.css              # Tailwind + design tokens (dark/light themes)
|   |
|   |-- core/                   # HUB CORE - always loaded
|   |   |-- shell/
|   |   |   |-- AppShell.tsx    # Main layout (titlebar + sidebar + content)
|   |   |   |-- Sidebar.tsx     # Navigation with SVG icons + module entries
|   |   |   |-- Titlebar.tsx    # Custom window chrome (min/max/close)
|   |   |-- theme/
|   |   |   |-- ThemeProvider.tsx  # Reads theme from settings store
|   |   |-- plugins/
|   |   |   |-- PluginLoader.tsx   # Dynamic router + lifecycle hooks
|   |   |   |-- registry.ts       # Static list of available modules
|   |   |-- settings/
|   |   |   |-- SettingsPage.tsx   # Theme, sync, modules, update check
|   |   |   |-- settingsStore.ts   # Zustand + persist (localStorage)
|   |   |-- router.tsx          # Dynamic route builder
|   |   |-- HomePage.tsx        # Landing page
|   |
|   |-- modules/                # GAME MODULES - each is self-contained
|   |   |-- tarkov/
|   |   |   |-- index.ts        # Module definition (exports GameModule)
|   |   |   |-- TarkovDashboard.tsx  # Dashboard + profile modal
|   |   |   |-- pages/
|   |   |   |   |-- ItemsPage.tsx    # Expandable item list with inline detail
|   |   |   |   |-- AmmoPage.tsx     # Card view + table view, sortable
|   |   |   |   |-- TasksPage.tsx    # Quest tracker with prerequisites
|   |   |   |   |-- HideoutPage.tsx  # Station tracker with gating
|   |   |   |   |-- ProfilePage.tsx  # Edition/mode selector (used as modal)
|   |   |   |-- components/
|   |   |   |   |-- TarkovLayout.tsx  # Sub-navigation tabs
|   |   |   |   |-- ItemDetail.tsx    # Inline item expansion with pin buttons
|   |   |   |-- data/
|   |   |   |   |-- tarkovApi.ts      # GraphQL queries (gameMode aware)
|   |   |   |   |-- tarkovDb.ts       # Dexie tables (items, ammo, tasks, hideout)
|   |   |   |   |-- tarkovSync.ts     # Sync: API -> SQLite -> Dexie
|   |   |   |-- stores/
|   |   |   |   |-- tarkovStore.ts    # Pins, completion state, edition, mode, level
|   |   |   |-- types/
|   |   |   |   |-- items.ts          # TarkovItem, ItemPrice (with Currency type)
|   |   |   |   |-- ammo.ts           # TarkovAmmo
|   |   |   |   |-- tasks.ts          # TarkovTask, TaskObjective
|   |   |   |   |-- hideout.ts        # HideoutStation, HideoutLevel, requirements
|   |   |   |-- utils/
|   |   |       |-- currency.ts       # formatPrice(), Currency type, FLEA_MARKET const
|   |   |       |-- editions.ts       # GameEdition, GameMode, EDITIONS config
|   |   |       |-- taskStatus.ts     # getTaskStatus(), negative karma task IDs
|   |   |
|   |   |-- star-citizen/       # (future) same structure as tarkov/
|   |   |-- elite-dangerous/    # (future) same structure as tarkov/
|   |
|   |-- shared/                 # SHARED SERVICES - used by any module
|   |   |-- db/
|   |   |   |-- dexieInstance.ts     # Shared Dexie DB (syncMeta table)
|   |   |   |-- sqliteBridge.ts      # SQLite wrapper with Tauri detection
|   |   |-- sync/
|   |   |   |-- SyncManager.ts       # Orchestrates online/offline sync
|   |   |   |-- SyncStatus.tsx       # Badge component for sidebar
|   |   |-- hooks/
|   |   |   |-- useOnlineStatus.ts   # Navigator.onLine reactive hook
|   |   |   |-- useSync.ts           # Init sync + periodic + reconnect
|   |   |   |-- useUpdater.ts        # Auto-update check on startup
|   |   |-- ui/
|   |   |   |-- SearchInput.tsx      # Search with clear button
|   |   |   |-- SortableTable.tsx    # Generic sortable table
|   |   |   |-- LoadingSpinner.tsx   # Animated spinner
|   |   |   |-- Skeleton.tsx         # Skeleton loading placeholders
|   |   |   |-- Toast.tsx            # Global toast notification system
|   |   |   |-- Collapsible.tsx      # Collapsible section with toggle
|   |   |   |-- ExternalLink.tsx     # Opens URLs in default browser via Tauri shell
|   |
|   |-- types/
|       |-- module.ts           # GameModule + RouteConfig interfaces
|
|-- public/
|   |-- icons/
|       |-- tarkov.svg          # Tarkov.dev hexagon icon
|
|-- .github/
|   |-- workflows/
|       |-- release.yml         # GitHub Actions: build + sign + release
|
|-- docs/
|   |-- PRD.md                  # Product Requirements Document
|   |-- RELEASING.md            # Step-by-step release guide
|
|-- LICENSE                     # All Rights Reserved (proprietary source)
|-- README.md
|-- CLAUDE.md                   # This file
```

### Key conventions

- **Each module is a folder under `src/modules/`** with the same internal structure.
  Copy the tarkov folder as a template when adding a new game.
- **Modules never import from other modules.** Only from `shared/` or themselves.
- **Shared components go in `src/shared/ui/`.** Reusable across all modules.
- **One Zustand store per concern.** Settings store, tarkov store, etc.
- **Module-specific utilities go in the module's `utils/` folder.** (currency, editions, taskStatus)
- **Persistent stores use Zustand's `persist` middleware** with `localStorage`.

---

## Core Modules Breakdown

### Hub Core (always loaded)

| Component | Responsibility |
|-----------|---------------|
| **AppShell** | Main layout -- custom titlebar, sidebar, content area, toast container |
| **PluginLoader** | Reads enabled modules, builds dynamic router, calls onEnable/onDisable |
| **ThemeProvider** | Reads theme from settings store, sets `data-theme` attribute on `<html>` |
| **Settings** | Theme toggle, sync interval, module enable/disable with sync buttons, update checker |
| **Router** | Builds routes dynamically: hub routes + module routes (supports nested layouts) |
| **Titlebar** | Custom window chrome with QM branding, version, min/max/close buttons |

### Shared Services (used by all modules)

| Service | Responsibility |
|---------|---------------|
| **Dexie instance** | Shared IndexedDB with `syncMeta` table. Modules create their own Dexie DBs. |
| **SQLite bridge** | Wrapper with `__TAURI_INTERNALS__` detection (skips in browser dev mode) |
| **Sync manager** | Register handlers per module, periodic sync, reconnect sync, toast feedback |
| **Toast system** | Global notifications: success, error, warning, info with auto-dismiss |
| **ExternalLink** | Opens URLs in default browser via Tauri shell plugin |
| **Shared UI kit** | SearchInput, SortableTable, LoadingSpinner, Skeleton, Collapsible |

### Tarkov Module (complete)

| Feature | Description |
|---------|-------------|
| **Dashboard** | Pinned ammo, shopping list, active tasks, quick stats, profile modal |
| **Items database** | Search, filter by category, expand inline for full detail + pricing |
| **Ammo reference** | Card view (grouped by caliber with bars) + table view, pin favorites |
| **Task tracker** | Prerequisites, player level gating, negative karma filtering, per-objective tracking |
| **Hideout tracker** | Station prerequisites, edition-based stash auto-completion, available/locked/completed |
| **Profile modal** | Player level slider, edition selection, PvP/PvE mode toggle |

---

## Data Flow

### Online Mode

```
User opens app
      |
      v
[useSync hook] --> initializes SyncManager
      |
      v
[SyncManager] --> initSqliteSchema() + hydrateFromSqlite()
      |
      v
[Network check] --> ONLINE?
      |
      +-- YES --> [Registered handlers] --> API fetch
      |                |
      |                v
      |           [SQLite] <-- persist (source of truth)
      |                |
      |                v
      |           [Dexie] <-- update UI cache
      |                |
      |                v
      |           [useLiveQuery] --> React re-renders
      |
      +-- NO  --> [Dexie] --> serve cached data
```

### Module Sync Registration

Each module registers its sync handler in `onEnable`:
```typescript
syncManager.registerHandler("tarkov", syncTarkovData);
```

The sync handler does: `fetchItems() + fetchAmmo() + fetchTasks() + fetchHideout()`
all in parallel, then persists to SQLite, then updates Dexie.

### Tauri Detection

Use `"__TAURI_INTERNALS__" in window` (NOT `__TAURI__` -- that's Tauri v1).
This is used in: sqliteBridge, useUpdater, SettingsPage update checker.

---

## Development Roadmap

### Completed

- **Phase 0**: Scaffolding -- Tauri + React + TypeScript + Tailwind + Zustand
- **Phase 1**: Plugin system, offline foundation, Dexie + SQLite, SyncManager
- **Phase 2**: Tarkov data layer -- GraphQL, types, sync pipeline
- **Phase 3**: Tarkov UI -- items, ammo, tasks, hideout, dashboard
- **Phase 4**: Polish -- loading states, error handling, toast system, auto-updater,
  custom window chrome, design system, icon, installer

### Upcoming

- **Phase 5**: Star Citizen module
- **Phase 6**: Elite Dangerous module
- **Phase 7**: Minecraft module
- **Phase 8**: Mobile build via Tauri v2 mobile targets
- **Phase 9**: Public release prep

---

## Development Guidelines

### Code style
- Use TypeScript strict mode. No `any` types unless absolutely necessary.
- Functional React components only. No class components.
- Name files in PascalCase for components (`ItemCard.tsx`), camelCase for utilities
  (`formatters.ts`).
- One component per file. Keep files under 200 lines; split if larger.

### State management
- **Zustand stores** for app-level state (settings, sync status, module state).
- **Zustand persist middleware** with `localStorage` for state that survives restarts.
- **React state** (`useState`, `useReducer`) for local component state.
- **Dexie live queries** (`useLiveQuery`) for reactive database reads in the UI.
- Never put API response data directly into Zustand. It goes: API --> DB --> UI.

### Module rules
- Modules must not import from other modules. Only from `shared/` or themselves.
- Each module must export a `GameModule` object from its `index.ts`.
- Module-specific types go in the module's `types/` folder, not the global `types/`.
- Module stores must be namespaced (e.g., `useTarkovStore`, not `useStore`).
- Module utilities go in `utils/` (currency formatting, edition config, task logic).

### Styling
- Use Tailwind utility classes for all styling.
- Design tokens defined as CSS custom properties in `styles.css` (not a separate file).
- `@theme` block maps Tailwind classes to `var(--qm-*)` properties.
- `:root` / `[data-theme="dark"]` and `[data-theme="light"]` swap the actual values.
- Purple accent palette: `#7c5bf5` primary accent.

### Data flow pattern
```
API  --(fetch)-->  SQLite  --(hydrate)-->  Dexie  --(useLiveQuery)-->  Component
```
Always follow this flow. Components never call APIs directly.

### Error handling
- Wrap API calls in try/catch. On failure, fall back to cached data.
- Show toast notifications for user-facing errors, not raw error objects.
- Log errors to console in dev.

### Git workflow
- **`testing` branch**: Active development happens here.
- **`main` branch**: Stable releases only. Merge from testing when ready.
- **Tags**: `v0.2.0` format. Only tag from main.
- **Releases**: Automated via GitHub Actions. See `docs/RELEASING.md`.

---

## Build & Run

```bash
# Install dependencies
npm install

# Start development (Tauri + Vite dev server with hot reload)
npm run tauri dev

# Build for production
npm run tauri build

# Run frontend only (no Tauri, for quick UI iteration)
npm run dev

# Type check
npm run typecheck
```

### Prerequisites
- Node.js 20+
- Rust toolchain (rustup) -- required by Tauri
- Tauri CLI (installed via npm devDependencies)

### Releasing
See `docs/RELEASING.md` for the full release process.
Short version: bump version in 3 files, merge testing -> main, tag, push.

---

## Key APIs and References

| Resource | URL | Notes |
|----------|-----|-------|
| Tarkov.dev API | https://api.tarkov.dev/graphql | GraphQL, no auth, supports `gameMode` param |
| Tarkov.dev Docs | https://tarkov.dev/api/ | Schema explorer and examples |
| Tauri v2 Docs | https://v2.tauri.app/ | Desktop + mobile guide |
| Dexie.js Docs | https://dexie.org/ | IndexedDB wrapper |
| Zustand Docs | https://zustand-demo.pmnd.rs/ | State management |
| Tailwind v4 Docs | https://tailwindcss.com/docs | Utility CSS reference |

---

## Notes
- Project created: 2026-03-27
- Owner: Alexei Rosetti (Baron)
- License: All Rights Reserved (proprietary source, free compiled app)
- Current version: 0.2.0
- This is a learning project. Patterns may evolve as understanding deepens.
  Update this document when major decisions change.
