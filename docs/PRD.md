# Quartermaster — Product Requirements Document

> **Version:** 1.0
> **Author:** Alexei Rosetti (Baron)
> **Created:** 2026-03-27
> **Status:** Draft

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
- **You.** A gamer who plays Tarkov, Elite Dangerous, and Star Citizen and wants
  quick reference tools without juggling browser tabs.

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
| 1 | Escape from Tarkov | `tarkov` | tarkov.dev GraphQL API, wiki | 🔴 Not started |
| 2 | Elite Dangerous | `elite-dangerous` | TBD (EDDB, Inara, EDSM) | 🔴 Not started |
| 3 | Star Citizen | `star-citizen` | TBD | 🔴 Not started |

Tarkov is the **testbed**. Every architectural pattern gets proven here first. The
other modules reuse the same patterns once they're solid.

---

## 6. Feature Requirements

### 6.1 Hub Core (always present)

| Feature | Priority | Description |
|---------|----------|-------------|
| App shell | **Must** | Sidebar navigation, content area, custom titlebar |
| Module manager | **Must** | Enable/disable game modules from settings |
| Dark theme | **Must** | Default dark theme with design tokens |
| Light theme | **Nice** | Optional light theme toggle |
| Offline indicator | **Must** | Clear "Online" / "Offline" badge in the UI |
| Sync status | **Must** | Show when data was last synced, sync in progress indicator |
| Settings page | **Must** | Preferences: enabled modules, sync interval, theme |
| System tray | **Nice** | Minimize to system tray instead of closing |
| Auto-updater | **Nice** | Check for and install app updates automatically |
| Keyboard shortcuts | **Nice** | Quick navigation between modules and common actions |

### 6.2 Offline System

| Feature | Priority | Description |
|---------|----------|-------------|
| Local snapshot | **Must** | All data cached locally in SQLite + IndexedDB |
| Offline fallback | **Must** | If offline, serve cached data seamlessly |
| Delta sync | **Must** | On reconnect, fetch only what changed since last sync |
| First-launch bundle | **Should** | Ship bundled fallback data so the app works on first launch even without internet |
| Sync interval config | **Should** | Let user configure how often data refreshes (e.g., every 15min, hourly) |
| Manual sync button | **Should** | "Sync now" button to force a refresh |

### 6.3 Tarkov Module (first module)

| Feature | Priority | Description |
|---------|----------|-------------|
| Items database | **Must** | Searchable, filterable list of all items with stats and prices |
| Ammo reference | **Must** | Penetration vs damage table/chart, sortable by key stats |
| Task tracker | **Should** | Quest checklist with required items and objectives |
| Maps reference | **Should** | Map images with key locations labeled |
| Flea market prices | **Should** | Current flea and trader prices (online-enhanced, cached for offline) |
| Hideout tracker | **Nice** | Track hideout upgrade requirements and progress |
| Loadout builder | **Nice** | Plan gear loadouts with cost estimates |
| Barter trades | **Nice** | List of profitable barter trades |

### 6.4 Elite Dangerous Module (second module)

> Detailed requirements TBD once Tarkov module is complete. Initial ideas:

- Ship outfitting reference
- Trade route calculator
- Exploration tools (system data, body info)
- Material/engineering tracker

### 6.5 Star Citizen Module (third module)

> Requirements TBD. Lowest priority. Will be scoped when the time comes.

---

## 7. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| **App size** | < 50MB installer (Tauri keeps this small) |
| **Startup time** | < 3 seconds from launch to usable UI |
| **Offline availability** | 100% of core features work without internet |
| **Data freshness** | < 1 hour old when online (configurable) |
| **Memory usage** | < 200MB RAM during normal use |
| **Supported OS** | Windows 10+ (primary), macOS and Linux (future) |
| **Mobile** | Android/iOS via Tauri v2 mobile (future, Phase 6+) |

---

## 8. What This Is NOT

Clarity on scope prevents feature creep (and ADHD rabbit holes):

- **Not a social platform** — no user accounts, friends lists, or chat (v1)
- **Not a game overlay** — it's a separate window, not drawn over the game
- **Not a wiki replacement** — it shows reference data, not full wiki articles
- **Not a tracker with cloud sync** — all data is local-only (v1)
- **Not a marketplace tool** — no automated trading or flea market sniping
- **Not multiplayer** — no shared loadouts or group features (v1)

---

## 9. Tech Stack Summary

| Layer | Choice |
|-------|--------|
| Desktop wrapper | Tauri v2 |
| Frontend | React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| State management | Zustand |
| Local DB (browser) | Dexie.js (IndexedDB) |
| Local DB (native) | SQLite via Tauri plugin |
| API client | GraphQL (urql or graphql-request) |
| Build tool | Vite |

See [CLAUDE.md](../CLAUDE.md) for detailed architecture and data flow diagrams.

---

## 10. Development Phases

| Phase | Focus | Est. Duration |
|-------|-------|---------------|
| 0 | Scaffolding — empty app shell with dark theme | 1 week |
| 1 | Plugin system + offline foundation | 1-2 weeks |
| 2 | Tarkov data layer (API → local DB pipeline) | 2-3 weeks |
| 3 | Tarkov UI features | 3-4 weeks |
| 4 | Polish (errors, performance, system tray) | 2 weeks |
| 5 | Elite Dangerous module | TBD |
| 6 | Star Citizen, mobile, public release | TBD |

Detailed task checklists for each phase are in [CLAUDE.md](../CLAUDE.md).

---

## 11. Success Criteria

How to know this project is "done enough" for personal use:

- [ ] App launches in under 3 seconds
- [ ] Tarkov items, ammo, and tasks are searchable and browsable
- [ ] Pulling the network cable does not break anything
- [ ] Reconnecting triggers a sync within the configured interval
- [ ] You actually use it while playing Tarkov instead of alt-tabbing to websites

---

## 12. Open Questions

Things to figure out as we go:

1. **Elite Dangerous data sources** — which APIs are reliable and free?
2. **Star Citizen data sources** — the game changes rapidly, what's stable?
3. **Public release format** — GitHub releases? A website? A game overlay store?
4. **User progress data** — should task tracker progress be exportable/importable?
5. **Multi-monitor support** — pin the app to a second monitor? Always-on-top option?

---

## 13. Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-03-27 | 1.0 | Initial PRD created |
