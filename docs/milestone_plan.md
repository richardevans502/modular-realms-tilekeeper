# Modular Realms: TileKeeper — Milestone Plan v2.0

**Version:** 2.0  
**Date:** 2026-06-03  
**Owner:** Nova, proxy project lead  
**Status:** Corrected milestone baseline — utility tool, not game  
**Supersedes:** `docs/milestone_plan.md` v1.0 and any milestone gates derived from the game/vertical-slice pivot

---

## 1. Executive Re-Scope

TileKeeper's active milestone plan is re-baselined as a **local-first catalog, inventory, and deterministic layout-planning tool for physical Modular Realms terrain tiles**.

The product is **not** a mobile strategy game for this plan. It is not shipping Keeper assignment, resource chains, enemy waves, combat resolution, authored play sessions, or game-engine systems. Those concepts may remain historical research, but they are not milestone acceptance authority.

### Product Promise

TileKeeper helps tabletop hobbyists and game masters answer practical prep questions:

1. What Modular Realms tiles do I own?
2. What do those tiles connect to?
3. What layouts can I build with my current inventory?
4. Which missing tiles would unlock better or complete layouts?
5. Can I save, print, export, and restore my plans without being locked into a cloud account?

### Active Technical Baseline

This plan aligns to `docs/TECHNICAL_ARCHITECTURE_v2.0.md`:

- Expo React Native + TypeScript mobile app.
- SQLite local source of truth.
- Zod-validated catalog packs, backups, and imports.
- Deterministic TypeScript layout solver under `src/layout`.
- Schematic 2D preview and PNG / JSON / PDF export pipeline.
- Optional Cloudflare-hosted catalog refresh.

---

## 2. Active Scope Boundaries

### 2.1 In Scope

- Android mobile utility app for the v1.0 release candidate; iOS remains a target platform but signed physical-device/TestFlight parity is deferred until Apple Developer credentials are available.
- Official and custom Modular Realms tile catalog records.
- Physical inventory tracking with owned quantities, condition, notes, and storage location.
- Face-aware tile data model for double-sided tiles.
- Dimension-aware grid/footprint model for non-uniform tiles.
- Explicit socket compatibility rules.
- Deterministic layout generation constrained by inventory, table bounds, goals, sockets, and physical tile counts.
- Saved layouts with notes, tags, favourites, source catalog version, and solver version.
- Missing-tile suggestions when users allow incomplete-plan mode.
- Import/export for catalog packs, inventory backups, and generated layouts.
- Schematic top-down previews suitable for mobile review and printable prep sheets.
- Optional online catalog updates; app remains useful offline.
- CI/CD, automated tests, and release pipelines.

### 2.2 Explicitly Out of Scope

These items must not become milestone gates unless approved by later change control:

- Keeper classes, morale, fatigue, XP, skills, or equipment.
- Resource production chains, crafting, campaign progression, metagrowth, or upgrades.
- Enemy waves, combat, corruption spread, AI pathfinding for invaders, win/lose game states.
- Authored 12–18 minute playable sessions or tutorialised vertical slices.
- Godot, Unity, or any game-engine-first architecture.
- Real-time rendering targets, particles, animation-heavy scenes, or frame-rate gates beyond ordinary UI responsiveness.
- Full 3D previews.
- Multiplayer, cloud sync, account systems, or ecommerce integration.
- Automated scraping of modularrealms.com without a separate permission/research decision.
- Marketing the product as a game before a separate game project is formally approved.

### 2.3 Historical Artifact Handling

Game-pivot documents (`GDD.md`, `VS_SCOPE.md`, `VS_SCOPE_SIGNOFF.md`, and related game-specific notes) may be mined for vocabulary, art mood, or data-model ideas only where they support the utility tool. They do not define active milestone gates for this plan.

---

## 3. Milestone Overview

| Milestone | Name | Duration | Primary Outcome | Exit Gate |
|---|---:|---:|---|---|
| **M1** | Re-Baseline & Foundation Lock | Weeks 1–2 | Corrected docs, active artifact index, architecture v2.0, risk reset, implementation backlog | Utility scope approved; no game gates remain active |
| **M2** | Data Foundation & Inventory MVP | Weeks 3–8 | Catalog schema, SQLite storage, inventory CRUD, backup/import skeleton | User can record and restore owned tile inventory |
| **M3** | Deterministic Layout Solver MVP | Weeks 9–16 | Face-aware, dimension-aware, socket-valid layout generation from inventory | Solver returns reproducible valid layouts and missing-tile evidence |
| **M4** | Preview, Save & Export Beta | Weeks 17–24 | Schematic layout preview, saved layouts, PNG/JSON/PDF exports, beta distribution | User can generate, save, reopen, print/export a layout |
| **M5** | Catalog Refresh, Polish & Launch | Weeks 25–36 | Optional catalog update service, accessibility, performance, store release | Public v1.0 release readiness achieved |
| **M6** | Post-Launch Tooling & Ecosystem | Weeks 37–52 | Catalog maintenance workflow, community feedback loop, roadmap v2.1 | v1.1/v2.1 roadmap based on real utility usage |

---

## 4. Detailed Milestones

### M1 — Re-Baseline & Foundation Lock (Weeks 1–2)

**Objective:** Eliminate conflicting scope authority and prepare implementation teams to build the utility tool, not the game.

**Key Deliverables:**

1. **Milestone Plan v2.0** — this corrected milestone plan.
2. **Architecture v2.0 Ratification** — confirm Expo RN + TypeScript, SQLite, Zod, deterministic solver, and export pipeline.
3. **Active Artifact Index** — README or `docs/README.md` identifies active, superseded, and historical documents.
4. **Retirement Headers** — game-pivot or pre-correction artifacts clearly marked as non-authoritative where needed.
5. **Risk Register v2.0 Amendment** — remove game-specific top risks; add catalog, solver, import/export, permission, and cross-platform risks.
6. **Implementation Backlog Seed** — epics and first sprint tasks for schemas, storage, inventory, and tests.

**Acceptance Criteria:**

- [ ] Product identity states utility tool, not game.
- [ ] M2 entry criteria no longer mention vertical slice, Keepers, combat, waves, or authored playthroughs.
- [ ] `TECHNICAL_ARCHITECTURE_v2.0.md` is cited as the active technical baseline.
- [ ] Active/superseded document status is clear to downstream workers.
- [ ] First implementation sprint can begin without scope ambiguity.

**Critical Path:** Scope reset → active-doc index → risk amendment → backlog seed → M2 kickoff.

---

### M2 — Data Foundation & Inventory MVP (Weeks 3–8)

**Objective:** Build the local data foundation and first useful inventory workflow.

**Key Deliverables:**

1. **V2 Catalog Schema** — TypeScript types and Zod schemas for tile types, physical specs, faces, edges, socket rules, assets, and source references.
2. **SQLite Persistence Layer** — migrations and repositories for catalog packs, tile types, inventory items, custom tile types, app settings, and migration log.
3. **Inventory CRUD UI** — add, edit, remove, search, and filter owned tiles.
4. **Custom Tile Entry** — create user-defined tile records with dimensions, faces, sockets, notes, and category.
5. **Backup Envelope v0.5** — export/import inventory and settings JSON with validation and transaction rollback.
6. **Seed Catalog Pack** — small hand-curated fixture catalog sufficient for development and demos.

**Acceptance Criteria:**

- [ ] User can add, edit, delete, and search owned tile quantities on device/emulator.
- [ ] Inventory survives app restart through SQLite.
- [ ] Zod rejects malformed catalog and backup payloads.
- [ ] Backup export/import round-trips inventory fixture data without loss.
- [ ] Custom tile entries can be created and used as first-class catalog records.
- [ ] Automated tests cover schema validation, migrations, and inventory quantity rules.

**Critical Path:** Schemas → migrations → repositories → inventory UI → backup/import tests.

---

### M3 — Deterministic Layout Solver MVP (Weeks 9–16)

**Objective:** Prove the app can generate practical, reproducible layouts from real inventory constraints.

**Key Deliverables:**

1. **Socket Compatibility Engine** — explicit bidirectional/asymmetric compatibility checks with reason strings.
2. **Dimension-Aware Placement Validation** — collision, bounds, footprint, face, rotation, and occupied-cell checks.
3. **Inventory-Constrained Candidate Expansion** — solver never consumes more physical tiles than owned unless incomplete-plan mode is enabled.
4. **Deterministic Connected-Graph Solver** — seeded backtracking/heuristic generator with top-N ranked results.
5. **Solver Trace Summary** — explain why a layout passed, failed, or requires missing tiles.
6. **Layout Goal UI v0.5** — select table bounds, target tile count, required categories, missing-tile policy, and seed/regenerate options.

**Acceptance Criteria:**

- [ ] Same catalog + inventory + goal + seed returns identical layout results.
- [ ] Solver respects quantity limits, face selection, rotation, dimensions, sockets, and connectedness.
- [ ] Invalid placements expose clear reasons for UI display and tests.
- [ ] User can request at least one small valid layout from seed inventory.
- [ ] Missing-tile mode lists required tile/category/socket gaps without silently violating inventory constraints.
- [ ] Solver unit tests cover edge cases for double-sided tiles, non-1x1 footprints, blocked sockets, and disconnected graphs.

**Critical Path:** Compatibility → placement validation → candidate expansion → deterministic solver → goal UI.

---

### M4 — Preview, Save, Export & UI Beta (Weeks 17–24)

**Objective:** Turn solver output into useful tabletop prep artifacts with a whimsical but functional UI, ready for human testing.

**Key Deliverables:**

1. **Schematic Preview Renderer** — readable top-down board with tile labels, rotations, face indicators, sockets, and warnings.
2. **Manual Adjustments v0.5** — move/rotate/remove placed tiles within legality constraints; preserve solver evidence.
3. **Saved Layout Library** — save, reopen, duplicate, favourite, tag, and annotate layouts.
4. **JSON Export/Import** — machine-readable layout graph with catalog version and solver version.
5. **PNG Export** — shareable layout map image.
6. **PDF Export** — printable prep sheet with map, tile list, missing tiles, notes, and source/version metadata.
7. **React Native UI Screens (M4-UI)** — whimsical but functional mobile interface:
   - **Style:** Tactile fantasy utility. Warm, inviting, not corporate.
   - **Colour Palette:** Aligned with modularrealms.com:
     - Background: warm parchment/cream `#FFF9E5`
     - Primary accents: deep maroon/oxblood `#8B0000`–`#800000`
     - Secondary accents: gold/mustard `#DAA520`–`#B8860B`
     - Dark framing: charcoal `#1A1A1A` for headers, nav bars, bottom sheets
     - Text: near-black on light backgrounds, white on dark surfaces
   - **Typography:** Clean sans-serif for body; optional serif or slab-serif for headings to echo tabletop RPG manuals.
   - **Screens required:**
     - Inventory list (search, filter, add/edit quantities)
     - Tile detail view (faces, dimensions, sockets, notes)
     - Layout goal setup (table bounds, constraints, seed)
     - Layout preview (schematic grid, pan/zoom, tile inspection)
     - Saved layouts library (list, tags, favourites, search)
     - Export/share sheet (JSON/PNG/PDF, destination picker)
     - Settings (theme toggle, backup, catalog refresh, about)
   - **Local-First Architecture:** All generation engine, layout storage, and theming is local to the device. No hosted server holds user data.
   - **Optional Cloud Backup:** Integrate OAuth-based links to Google Drive, OneDrive, or Dropbox for encrypted backup/restore of inventory and layouts. Cloud is opt-in, additive only — app remains fully functional offline.
8. **Internal Beta Distribution** — Android Play internal track or Expo/EAS equivalent for controlled testing. TestFlight remains non-gating until Apple Developer account access and signing credentials are configured.

**Acceptance Criteria:**

- [ ] User can generate, preview, save, close, reopen, and duplicate a layout.
- [ ] Preview remains readable on phone scale and supports pan/zoom for medium layouts.
- [ ] Exported JSON round-trips through import validation.
- [ ] Exported PNG and PDF match the saved placement graph.
- [ ] PDF includes tile checklist, missing tiles, notes, catalog version, and solver version.
- [ ] UI screens are navigable, touch targets meet 44 px minimum, and colour-blind-safe states use icon + label + shape (never colour alone).
- [ ] App operates fully offline for inventory, layout generation, and theming.
- [ ] Optional cloud backup exports/imports an encrypted backup envelope without exposing raw user data to the app server.
- [ ] Android beta build can be installed by internal stakeholders; iOS simulator build evidence may be retained, but signed iOS/TestFlight is not an M4 exit gate.

**Critical Path:** Preview model → saved layout storage → export adapters → M4-UI screens → beta build.

---

### M5 — Catalog Refresh, Polish & Launch (Weeks 25–36)

**Objective:** Harden the utility for real users and prepare public release.

**Key Deliverables:**

1. **Catalog Manifest Refresh** — optional HTTPS manifest and pack download flow with checksum/signature support.
2. **Catalog Conflict Handling** — app explains pack updates, schema upgrades, discontinued tiles, and local custom conflicts.
3. **Accessibility & UX Polish** — VoiceOver/TalkBack traversal, dynamic type, colour-blind-safe states, empty/error/loading states.
4. **Performance Optimisation** — solver budgets, cancellation, cached compatibility transforms, responsive preview rendering.
5. **Privacy & Store Materials** — privacy policy, app metadata, screenshots, support text, and data safety answers.
6. **Crash/Error Monitoring Decision** — opt-in, non-PII monitoring only if approved; otherwise local diagnostic export path.
7. **Public v1.0 Release Candidate** — signed Android build ready for store submission, with iOS simulator-build evidence retained for compatibility tracking. Signed iOS physical-device builds and TestFlight distribution are deferred to M6 or later and depend on Rich completing Apple Developer/App Store Connect credential setup.

**Acceptance Criteria:**

- [ ] App remains useful offline after catalog data is cached or manually entered.
- [ ] Catalog update flow validates checksum/signature where configured and rejects malformed packs.
- [ ] Common layout generation completes within target budget or offers cancellation/refinement.
- [ ] No normal UI interaction is blocked longer than 50 ms by solver or export work.
- [ ] Accessibility audit passes critical navigation, labels, touch targets, and colour/state requirements.
- [ ] Android store submission checklist is complete.
- [ ] iOS/TestFlight readiness is documented as deferred and no longer blocks the v1.0 release candidate.

**Critical Path:** Catalog refresh → conflict handling → performance/accessibility → Android release candidate → store submission. iOS/TestFlight resumes only after Apple Developer credentials are available.

---

### M6 — Post-Launch Tooling & Ecosystem (Weeks 37–52)

**Objective:** Maintain catalog quality, respond to real utility usage, and choose the next product expansion deliberately.

**Key Deliverables:**

1. **Catalog Maintenance Workflow** — repeatable process for adding new Modular Realms tile packs, sources, assets, checksums, and schema migrations.
2. **Support & Diagnostics Loop** — import/export troubleshooting, anonymised fixture reproduction, known-issues tracker.
3. **User Feedback Review** — evaluate whether users need better layout constraints, manual editing, printable sheets, or catalog coverage.
4. **v1.1 Feature Update** — priority fixes and small improvements based on real utility usage.
5. **Roadmap v2.1** — decide among tablet optimisation, web companion, cloud sync, advanced solver constraints, or official catalog partnership.
6. **Deferred iOS Build Parity** — configure Apple Developer/App Store Connect credentials, produce signed physical-device and TestFlight builds, then run iOS smoke tests once the account dependency is resolved.

**Acceptance Criteria:**

- [x] Catalog update process can publish a new pack without app code changes via the versioned pack builder (`npm run catalog:build`) and static manifest workflow in `docs/CATALOG_PUBLISHING_WORKFLOW.md`.
- [x] Catalog pack format records source references, checksummed assets, pack/catalog versions, and schema migration notes for repeatable maintenance.
- [ ] Support can reproduce layout/import issues from user-provided non-sensitive exports.
- [ ] v1.1 scope is based on beta/public feedback, not historical game-pivot assumptions.
- [ ] If Apple Developer credentials are available, iOS/TestFlight parity is re-activated as an M6+ build task; otherwise it remains explicitly deferred and non-blocking for Android maintenance releases.
- [ ] Any proposed game direction is handled as a separate product/change-control decision.

**Critical Path:** Launch feedback → catalog maintenance → support tooling → v1.1 → roadmap.

---

## 5. Cross-Milestone Risk Register Summary

| ID | Risk | Likelihood | Impact | Mitigation | Owner |
|---|---|---:|---:|---|---|
| R1 | Official Modular Realms data cannot be reused directly | Medium | High | Store source references, use manually authored metadata, seek permission before using assets verbatim | PM |
| R2 | Tile dimensions/faces are more varied than the schema expects | Medium | High | Support rect/polyomino/freeform metadata; validate against fixtures before solver work | Tech Lead |
| R3 | Solver search space becomes too slow on device | Medium | High | Deterministic heuristics, budgets, pruning, memoization, cancellation, top-N limits | Tech Lead |
| R4 | Manual catalog curation takes longer than planned | High | Medium | Start with seed catalog; separate catalog completeness from core tool acceptance; allow custom entries | PM |
| R5 | Import/export corruption loses user data | Low | High | Zod validation, transaction rollback, versioned backups, round-trip tests | Tech Lead |
| R6 | iOS signed build/TestFlight parity blocked by Apple Developer credentials | Medium | Medium | Treat Android as v1.0 RC gate; retain iOS simulator evidence; defer physical-device/TestFlight builds until Apple Developer/App Store Connect credentials are configured | DevOps |
| R7 | Schematic preview becomes unreadable for large layouts | Medium | Medium | Progressive detail, pan/zoom, print-scale export, simplification above threshold | Design |
| R8 | Users expect automated scraping or live catalog sync | Medium | Medium | Clear copy: manual/curated catalog baseline; optional signed packs only | PM |
| R9 | Historical game scope re-enters implementation backlog | Medium | High | Active-doc index, change-control rule, sprint acceptance checks against this plan | Project Lead |
| R10 | PDF/PNG export libraries conflict with Expo constraints | Medium | Medium | Spike export libraries in M4 planning; keep JSON export as source-of-truth fallback | Tech Lead |

---

## 6. Dependencies & Assumptions

1. Modular Realms public product information remains accessible as a reference source.
2. Any direct use of official images, logos, or product copy requires permission or explicit legal review.
3. Initial catalog coverage can be hand-curated and incomplete without blocking solver/tool proof.
4. Users may own custom, legacy, modified, or third-party-compatible tiles.
5. Expo React Native + TypeScript remains sufficient for a utility app with schematic rendering and export workflows.
6. The app must be useful offline after catalog data is cached or manually entered.
7. Cloud catalog hosting is optional and additive, not required for local inventory/layout use.
8. Cloud backup (Google Drive, OneDrive, Dropbox) is opt-in only; all core functionality remains offline.
9. Android is the v1.0 release-candidate platform. iOS remains a target platform, but signed physical-device/TestFlight parity is formally deferred to M6 or later until Apple Developer account, certificates, provisioning profiles, and App Store Connect submission credentials are available.

---

## 7. Milestone Sign-Off Gates

| Gate | Criteria | Approvers |
|---|---|---|
| **M1 Exit** | Utility scope locked; active-doc index published; architecture v2.0 accepted; game gates retired | Product, PM, Tech Lead |
| **M2 Exit** | Inventory CRUD, schema validation, SQLite persistence, backup/import skeleton pass tests | PM, Tech Lead |
| **M3 Exit** | Deterministic solver generates valid inventory-constrained layouts with trace evidence | PM, Tech Lead |
| **M4 Exit** | Saved layout library plus JSON/PNG/PDF exports work from placement graph | PM, Tech Lead, Design |
| **M5 Exit** | Accessible, performant, Android store-ready v1.0 release candidate; iOS/TestFlight explicitly deferred and documented | Product, PM, Tech Lead |
| **M6 Exit** | Post-launch update workflow and roadmap v2.1 approved from real usage data | Product, PM |

---

## 8. Change-Control Rules

1. Game mechanics cannot be added to milestone acceptance criteria without a formal product-scope change.
2. Catalog/inventory/layout/export utility workflows are the primary acceptance path.
3. New cloud features must preserve local-first/offline usefulness.
4. Official-content usage must respect permission and source-reference constraints.
5. Solver changes must preserve determinism or explicitly version the solver and migration path.
6. Exports are generated views; the saved placement graph remains the source of truth.

---

## 9. Document Control

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-06-02 | Auto-generated from PRD | Initial utility-app milestone plan |
| 2.0 | 2026-06-03 | Nova | Re-scoped phases for utility tool; removed game/vertical-slice gates; aligned to Technical Architecture v2.0 |
| 2.1 | 2026-06-19 | Nova | Deferred signed iOS/TestFlight parity from M5 to M6+ pending Apple Developer credentials; made Android the v1.0 release-candidate gate |

---

BUILD STATUS: all systems inventoried, laid out, exported, and solver-cute. No game-scope demons remain.

*End of Milestone Plan v2.0*
