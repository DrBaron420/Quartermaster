# Quartermaster — Product Requirements Document

> **Version:** 2.0
> **Author:** Alexei Rosetti (Baron)
> **Created:** 2026-03-27
> **Last updated:** 2026-03-27
> **Status:** Active (Tarkov module complete, app in daily use)

---

## 1. What Is This?

Quartermaster is a **desktop gaming toolkit** — a single app that gives you quick
access to game data, references, and tools for the games you play. Each game gets
its own module (think: a tab/section dedicated to that game) and they all live
under one roof.

**The one-sentence pitch:**
> "An offline-first, modular gaming companion app that keeps your game data at your
> fingertips — even without internet."

---

## 2. Why Build This?

### The Problem
- Game data is scattered across dozens of websites, wikis, and community tools
- Most of these require internet access and are ad-heavy or slow
- Alt-tabbing between multiple browser tabs while gaming is clunky
- No single tool covers multiple games in a unified way
- Losing internet mid-session means losing access to all your references

### The Solution
- **One app** that consolidates tools for multiple games
- **Works offline** — saves a snapshot of all data locally, keeps working if
  internet drops
- **Fast and lightweight** — native desktop app, not a browser tab
- **Modular** — each game is independent; add or remove games without affecting others
- **Personal first** — built for your own needs, polished for public later

---

## 3. Who Is This For?

### Primary User (v1)
- **You.** A gamer who plays Tarkov, Star Citizen, Elite Dangerous, and Minecraft
  and wants quick reference tools without juggling browser tabs.

### Future Users (v2+)
- Other gamers who want an offline-capable, lightweight alternative to web-based tools
- Community members who want a clean, ad-free reference app

---

## 4. Core Principles

These guide every decision. When in doubt, refer back here.

| Principle | What It Means |
|-----------|--------------|
| **Offline-first** | The app must work fully without internet. Online adds fresh data, not core functionality. |
| **Modular** | Each game is a self-contained plugin. Adding Game C must never break Game A or B. |
| **Fast** | Data lookups should feel instant. No spinners for cached data. |
| **Simple** | Prefer fewer features done well over many features done poorly. |
| **Personal** | Build what *you* need. Don't design for hypothetical users yet. |
| **Dark by default** | Because staring at a white screen at 2am is a war crime. |

---

## 5. Supported Games

| Priority | Game | Module ID | Data Source | Status |
|----------|------|-----------|-------------|--------|
| 1 | Escape from Tarkov | `tarkov` | tarkov.dev GraphQL API | ✅ Complete |
| 2 | Star Citizen | `star-citizen` | TBD | 🔴 Not started |
| 3 | Elite Dangerous | `elite-dangerous` | TBD (EDDB, Inara, EDSM) | 🔴 Not started |
| 4 | Minecraft | `minecraft` | TBD | 🔴 Not started |

Tarkov was the **testbed**. Every architectural pattern was proven here first. The
other modules will reuse the same patterns.

---

## 6. Feature Requirements

### 6.1 Hub Core (always present)

| Feature | Priority | Status | Description |
|---------|----------|--------|-------------|
| App shell | **Must** | ✅ Done | Sidebar navigation, content area, custom titlebar |
| Custom window chrome | **Must** | ✅ Done | No default Windows title bar; custom drag region with minimize/maximize/close buttons |
| Module manager | **Must** | ✅ Done | Enable/disable game modules from settings |
| Dark theme | **Must** | ✅ Done | Default dark theme with CSS custom property design tokens |
| Light theme | **Nice** | ⏳ Later | Optional light theme toggle |
| Offline indicator | **Must** | ✅ Done | Clear "Online" / "Offline" badge in the titlebar |
| Sync status | **Must** | ✅ Done | Shows when data was last synced; manual sync button in titlebar |
| Settings page | **Must** | ✅ Done | Preferences: enabled modules, sync interval, theme |
| System tray | **Nice** | ⏳ Later | Minimize to system tray instead of closing |
| Auto-updater | **Nice** | ✅ Done | NSIS installer with Tauri updater plugin; checks GitHub releases |
| Keyboard shortcuts | **Nice** | ⏳ Later | Quick navigation between modules and common actions |
| Home page | **Must** | ✅ Done | Landing page with quick links to enabled modules |

### 6.2 Offline System

| Feature | Priority | Status | Description |
|---------|----------|--------|-------------|
| Local snapshot | **Must** | ✅ Done | All data cached locally in Dexie (IndexedDB) with sync metadata |
| Offline fallback | **Must** | ✅ Done | If offline, serve cached data seamlessly |
| Delta sync | **Must** | ✅ Done | On reconnect, fetch only what changed since last sync |
| First-launch bundle | **Should** | ⏳ Later | Ship bundled fallback data for first launch without internet |
| Sync interval config | **Should** | ✅ Done | Configurable sync interval in settings |
| Manual sync button | **Should** | ✅ Done | "Sync now" button in the titlebar |
| Toast notifications | **Must** | ✅ Done | User-facing feedback for sync events, errors, and actions |

### 6.3 Tarkov Module (first module — complete)

| Feature | Priority | Status | Description |
|---------|----------|--------|-------------|
| Dashboard | **Must** | ✅ Done | Overview with quick stats (tasks done, hideout progress, items cached, last sync), pinned ammo, shopping list, and active tasks |
| Items database | **Must** | ✅ Done | Searchable, filterable, expandable list of all items with stats, prices, barter info, and buy-from data |
| Ammo reference | **Must** | ✅ Done | Card view and table view with penetration, damage, caliber filtering, and stat bars; pinnable favorites |
| Task tracker | **Should** | ✅ Done | Quest list with prerequisite logic, player level gating, trader filtering, status filters (available/completed/locked), per-objective tracking, and wiki links |
| Hideout tracker | **Nice** | ✅ Done | Station list with level prerequisites, edition-based auto-completion (e.g., Stash levels), item/skill requirements, and build time display |
| Flea market prices | **Should** | ✅ Done | Current flea and trader prices displayed on item cards; best-price vendor shown in shopping list |
| Game edition selection | **Must** | ✅ Done | Choose from Standard, Left Behind, Prepare for Escape, Edge of Darkness (Legacy), or The Unheard Edition; affects hideout gating and profile display |
| PvP / PvE mode toggle | **Must** | ✅ Done | Switch between PvP and PvE; triggers a re-sync to fetch mode-specific data from the API |
| Player level tracking | **Must** | ✅ Done | Set your level (1-79) via slider or number input; gates which tasks show as "available" vs "locked" |
| Item pinning (shopping list) | **Should** | ✅ Done | Pin items from the Items page; pinned items appear on the Dashboard with vendor and price info |
| Ammo pinning | **Should** | ✅ Done | Pin ammo from the Ammo page; pinned rounds appear on the Dashboard with pen/damage stats and trader pricing |
| Task prerequisites | **Must** | ✅ Done | Tasks only show as "available" when all prerequisite tasks are completed and level requirement is met |
| Negative karma task filtering | **Should** | ✅ Done | Fence tasks requiring negative scav karma are locked by default (hardcoded list since the API does not expose this) |
| Profile modal | **Should** | ✅ Done | Popup from Dashboard to change edition, game mode, and player level without leaving the page |
| Maps reference | **Should** | ⏳ Later | Map images with key locations labeled |
| Loadout builder | **Nice** | ⏳ Later | Plan gear loadouts with cost estimates |
| Barter trades | **Nice** | ⏳ Later | List of profitable barter trades |

### 6.4 Star Citizen Module (second module)

> Detailed requirements TBD. Second priority after Tarkov.

### 6.5 Elite Dangerous Module (third module)

> Detailed requirements TBD. Initial ideas:

- Ship outfitting reference
- Trade route calculator
- Exploration tools (system data, body info)
- Material/engineering tracker

### 6.6 Minecraft Module (fourth module)

> Requirements TBD. Added to the roadmap for future development.

---

## 7. Non-Functional Requirements

| Requirement | Target | Status |
|-------------|--------|--------|
| **App size** | < 50MB installer | ✅ Met (NSIS installer via Tauri) |
| **Startup time** | < 3 seconds from launch to usable UI | ✅ Met |
| **Offline availability** | 100% of core features work without internet | ✅ Met |
| **Data freshness** | < 1 hour old when online (configurable) | ✅ Met |
| **Memory usage** | < 200MB RAM during normal use | ✅ Met |
| **Supported OS** | Windows 10+ (primary) | ✅ Shipping |
| **macOS / Linux** | Future consideration | ⏳ Later |
| **Mobile** | Android/iOS via Tauri v2 mobile (future) | ⏳ Later |
| **Window chrome** | Custom titlebar with drag region, no default Windows decorations | ✅ Done |
| **Installer** | NSIS installer with start menu entry, auto-updater support | ✅ Done |
| **Auto-updates** | Check GitHub releases for new versions; dialog prompt to install | ✅ Done |

---

## 8. What This Is NOT

Clarity on scope prevents feature creep (and ADHD rabbit holes):

- **Not a social platform** — no user accounts, friends lists, or chat
- **Not a game overlay** — it is a separate window, not drawn over the game
- **Not a wiki replacement** — it shows reference data, not full wiki articles
- **Not a tracker with cloud sync** — all data is local-only
- **Not a marketplace tool** — no automated trading or flea market sniping
- **Not multiplayer** — no shared loadouts or group features
- **Not open-source** — source is proprietary; compiled app is free to use (see License)

---

## 9. Tech Stack Summary

| Layer | Choice | Notes |
|-------|--------|-------|
| Desktop wrapper | Tauri v2 | Lightweight native wrapper, Rust backend |
| Frontend | React 19 + TypeScript | Component-based UI, strict typing |
| Styling | Tailwind CSS v4 | Utility-first with CSS custom properties for theming |
| State management | Zustand (persisted) | localStorage persistence via `zustand/middleware` |
| Local DB (browser) | Dexie.js (IndexedDB) | Offline snapshot storage, `useLiveQuery` for reactive reads |
| API client | graphql-request | Lightweight GraphQL client for tarkov.dev API |
| Build tool | Vite | Fast dev server, bundled with Tauri scaffolding |
| Routing | React Router v7 | Client-side routing for module pages |

### Tauri Plugins

| Plugin | Purpose |
|--------|---------|
| `@tauri-apps/plugin-updater` | Auto-update checking against GitHub releases |
| `@tauri-apps/plugin-process` | App restart after update |
| `@tauri-apps/plugin-shell` | Open external links in the default browser |
| `@tauri-apps/plugin-sql` | SQLite access from the Rust backend (dev dependency) |

See [CLAUDE.md](../CLAUDE.md) for detailed architecture and data flow diagrams.

---

## 10. Development Phases

### Completed

| Phase | Focus | Status |
|-------|-------|--------|
| 0 | **Scaffolding** — Tauri v2 + React + TypeScript project, Tailwind dark theme, AppShell with sidebar and custom titlebar, ThemeProvider, Zustand settings store, git repo | ✅ Done |
| 1 | **Plugin system + offline foundation** — `GameModule` interface, PluginLoader, module registry, Dexie setup, NetworkMonitor hook, SyncManager, online/offline badge, Settings page | ✅ Done |
| 2 | **Tarkov data layer** — GraphQL client (graphql-request), queries for items/ammo/tasks/hideout, TypeScript types, Dexie tables, sync flow (API to Dexie with sync metadata), delta sync via `updated` timestamps | ✅ Done |
| 3 | **Tarkov UI** — Dashboard with quick stats and pinned sections, Items page (search/filter/expand), Ammo page (card + table views with stat bars), Tasks page (prerequisite logic, level gating, trader filter, objective tracking), Hideout page (edition-based gating, prerequisite checking), Profile modal (edition/mode/level), shared UI kit (SearchInput, SortableTable, Collapsible, Toast, Skeleton, ExternalLink, LoadingSpinner) | ✅ Done |
| 4 | **Polish** — Custom window chrome (no Windows decorations), NSIS installer, auto-updater via Tauri plugin, toast notifications, loading skeletons, error handling for API failures | ✅ Done |

### Upcoming

| Phase | Focus | Status |
|-------|-------|--------|
| 5 | **Star Citizen module** — identify data sources, define types and sync logic, build game-specific pages | 🔴 Not started |
| 6 | **Elite Dangerous module** — identify reliable APIs (EDDB, Inara, EDSM), ship outfitting, trade routes, exploration tools | 🔴 Not started |
| 7 | **Minecraft module** — scope TBD | 🔴 Not started |
| 8 | **Future** — mobile builds via Tauri v2, macOS/Linux support, public release prep (docs, settings export/import), remaining Tarkov features (maps, loadout builder, barter trades) | 🔴 Not started |

Detailed task checklists for each phase are in [CLAUDE.md](../CLAUDE.md).

---

## 11. Success Criteria

How to know this project is "done enough" for personal use:

- [x] App launches in under 3 seconds
- [x] Tarkov items, ammo, and tasks are searchable and browsable
- [x] Pulling the network cable does not break anything
- [x] Reconnecting triggers a sync within the configured interval
- [ ] You actually use it while playing Tarkov instead of alt-tabbing to websites

That last one is the real test. Everything else is a checkbox.

---

## 12. License

**All Rights Reserved.**

The source code is proprietary. The compiled application (installers and releases)
is free to download and use. See the `LICENSE` file in the project root for full
terms.

---

## 13. Open Questions

Things to figure out as we go:

1. **Star Citizen data sources** — the game changes rapidly, what APIs are stable?
2. **Elite Dangerous data sources** — which APIs are reliable and free?
3. **Minecraft data sources** — wiki APIs, mod data sources, version compatibility?
4. **Public release format** — GitHub releases? A website? A game overlay store?
5. **User progress data** — should task/hideout progress be exportable/importable?
6. **Multi-monitor support** — pin the app to a second monitor? Always-on-top option?
7. **Tarkov maps** — interactive canvas or static images? What level of detail?
8. **SQLite integration** — currently using Dexie only for the browser side; SQLite
   as durable source-of-truth is scaffolded but not fully wired into the sync flow yet.

---

## 14. Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-03-27 | 1.0 | Initial PRD created |
| 2026-03-27 | 2.0 | Major rewrite to reflect current state. Tarkov module marked complete. Added game edition selection, PvP/PvE mode, player level tracking, item/ammo pinning, task prerequisites, negative karma filtering, hideout tracker, profile modal, custom window chrome, NSIS installer, auto-updater. Updated game priority order (Star Citizen before Elite Dangerous, Minecraft added). Tech stack updated: graphql-request confirmed, Tauri plugins listed. License changed to All Rights Reserved. Phases 0-4 marked complete. Success criteria updated. App version is 0.2.0. |
