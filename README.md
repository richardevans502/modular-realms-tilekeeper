# Modular Realms: TileKeeper

> **Milestone 2 — Sprint 1 | Current product direction: v2.0 layout generator**

TileKeeper is a mobile-first dungeon layout generator for tabletop hobbyists who own physical Modular Realms terrain tiles. It helps you catalog your collection, generate valid buildable layouts from your inventory, and export tabletop-ready plans.

This repository contains the Milestone 1 planning baseline and the active Milestone 2 Sprint 1 implementation workspace.

---

## ⚡ Quickstart (new developers — < 5 minutes)

### 1. Install dependencies

```bash
npm install
```

### 2. Run locally

```bash
npx expo start
```

Then press:
- `a` for Android emulator
- `w` for web preview
- `i` for iOS simulator (macOS only)

### 3. Run tests

```bash
npm test
```

The test suite is organised under `tests/unit`, `tests/integration`, and `tests/fixtures`.

### 4. Type-check

```bash
npm run typecheck
```

### 5. CI smoke build

```bash
npm run ci
```

---

## 📁 Project structure

| Directory | What lives here |
|---|---|
| `docs/` | Product requirements, game design, architecture, risk, steering, and pivot reconciliation documents. Start with `docs/README.md` for the full artifact index. |
| `src/` | Mobile app / game source code, organised by feature/module (`catalog`, `inventory`, `layout`, `shared`). |
| `assets/` | App assets, icons, imagery, and tile reference media. |
| `tests/` | Unit, integration, and fixture tests. |
| `config/` | App and development configuration. |
| `scripts/` | Developer automation scripts. |

---

## 📖 Documentation

All project documents live in `docs/` and are indexed in `docs/README.md`.

- **New to the project?** Read `docs/M1_PIVOT_RECONCILIATION.md` first — it explains the STEER-7 scope correction that re-aligned the product from a game concept to a practical layout-planning tool.
- **Active product direction:** `docs/PRD_v2.0.md`
- **Tech stack:** `docs/TECHNICAL_ARCHITECTURE_v2.0.md`
- **M2 demo scope:** `docs/VS_SCOPE.md`
- **Risk register:** `docs/RISK_REGISTER_v2.0.md`

**v2.0 vs v1.0:** The project began as an inventory-only utility app (v1.0), briefly pivoted toward a mobile strategy game, and was then corrected in STEER-7 to a **layout generator for physical tiles** (v2.0). All v1.0 documents are retired and marked as Superseded in `docs/README.md`.

---

## 📋 Kanban board

View the active board:

```bash
hermes kanban --board modular_realms_tilekeeper list
```

Add `--show-done` to include archived/completed tasks.

---

## 🚦 Current milestone status

- **Milestone 1:** Foundation documents delivered and reviewed (see `docs/M1_FOUNDATION_SIGNOFF_REPORT.md`).
- **Milestone 2:** Complete — inventory CRUD, SQLite persistence, seed catalog, backup/import skeleton.
- **Milestone 3:** Complete — deterministic layout solver, socket compatibility, dimension-aware placement, goal UI.
- **Milestone 4:** Complete — schematic preview, saved layouts, JSON/PNG/PDF export, UI screens, beta distribution.
- **Milestone 5:** In progress — catalog refresh, accessibility, privacy/store materials, release candidate.
  - **M5-PRIV-1:** Store submission pack complete. Privacy policy live at GitHub Pages. Screenshots approved by Rich (2026-06-19). gh-pages pushed.

---

*For questions, see `docs/README.md` or open a task on the `modular_realms_tilekeeper` kanban board.*
