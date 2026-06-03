# Modular Realms: TileKeeper

## Milestone 2 — Vertical Slice Scope Document v2.0

**Version:** 2.0  
**Date:** 2026-06-03  
**Owner:** Nova, Code Maid of the Silver Castle  
**Status:** Draft — v2.0 rewrite for steering review  
**PRD Reference:** PRD v2.0 — authoritative inventory/layout-generator product direction  
**Technical Architecture Reference:** TECHNICAL_ARCHITECTURE v2.0 — Expo React Native + TypeScript + deterministic layout engine  
**Supersedes:** VS_SCOPE v1.0 playable session / defence encounter scope  
**Target Demo Date:** Week 18

---

## 1. Executive Summary

Milestone 2 is no longer a miniature playable game session. The v1.0 scope accidentally dragged TileKeeper toward a game vertical slice: authored playthrough, Keeper classes, economy, combat, art/audio pass, and publisher-demo polish. That is the wrong beast to feed. TileKeeper's actual product promise is an offline-first mobile companion app that helps Modular Realms owners catalog their tiles, track inventory, and generate functional layouts from what they own.

The v2.0 Vertical Slice (VS) is therefore a **functional layout generation demo**. It proves the core app loop:

1. Load a seeded tile catalog.
2. Mark owned tile quantities in inventory.
3. Select layout constraints.
4. Generate a valid connected layout using only owned tiles.
5. Inspect, adjust, save, and export the resulting layout.

The demo must answer, without ambiguity: **"Can this app turn a user's owned Modular Realms tiles into useful, valid layout plans on a real device?"**

This scope intentionally prioritises deterministic engine correctness, useful UX, persistence, import/export, and mobile performance over game-like content, scripted combat, lore, character systems, or polished entertainment presentation.

---

## 2. Product Goal for VS v2.0

### 2.1 Primary user outcome

A terrain owner can open TileKeeper, enter a small representative inventory, ask for a layout that fits a table and theme, and receive a readable plan that can actually be built with their owned pieces.

### 2.2 Demo narrative

The Week 18 demo should show a complete app workflow in 6–8 minutes:

| Step | Demo Action | Proof Point |
|---|---|---|
| 1 | Open app on Android target device / Expo preview | App shell boots reliably |
| 2 | Browse seeded catalog | Catalog schema and filtering work |
| 3 | Set owned quantities for 15–30 sample tiles | Inventory state is editable and persistent |
| 4 | Choose constraints: table size, theme, max tiles, required connector | Constraint UI maps to engine inputs |
| 5 | Tap Generate | Deterministic layout engine returns a valid connected plan |
| 6 | Inspect preview and missing/unused tile notes | Output is understandable and actionable |
| 7 | Lock or swap one tile, regenerate around it | User control exists beyond one-shot randomisation |
| 8 | Save and export layout JSON / share sheet payload | Layouts persist and can leave the app |

### 2.3 Definition of success

The VS is successful if the demo produces **repeatable, valid layouts** from seeded catalog + owned inventory, persists them locally, and exposes enough UI for a non-developer to understand what was generated and why.

---

## 3. What Is IN Scope — VS Content Definition

### 3.1 Seeded Tile Catalog

The VS includes a curated sample catalog large enough to exercise the layout engine without requiring full production data entry.

**Catalog size:** 30–40 tile definitions.

**Catalog composition:**

| Category | Target Count | Purpose |
|---|---:|---|
| Floor / room tiles | 8–10 | Core placement area |
| Wall / boundary tiles | 6–8 | Edge constraints and enclosure checks |
| Door / connector tiles | 4–6 | Passability and route validation |
| Corridor / passage tiles | 4–6 | Connected graph tests |
| Stairs / elevation markers | 2–3 | Special tags and required-piece constraints |
| Scatter / dressing tiles | 4–6 | Optional decoration and non-critical placement |
| Custom placeholder tile | 1–2 | Proof that user-created entries fit the schema |

**Required fields per catalog entry:**

- Stable ID / slug.
- Display name.
- Physical tile identity separate from usable face identity.
- Face metadata for double-sided or multi-face tiles.
- Category.
- Footprint: square, rectangle, or simple polyomino.
- Edge metadata for north/east/south/west where applicable.
- Theme tags: e.g. dungeon, town, wilderness, crypt, sewer.
- Connector / passability tags.
- Source note and rights note.
- Thumbnail placeholder reference or generated schematic marker.

**Data quality bar:**

- Catalog validates against TypeScript/Zod schema.
- No duplicate slugs.
- No missing required connector metadata for connector-category tiles.
- Entries are usable by generator tests without hand-authored exceptions.

---

### 3.2 Inventory Management

The VS must let a user represent what they own. It does not need accounts, cloud sync, barcode scanning, or marketplace data.

**Required inventory actions:**

- Add/remove quantity for catalog tile.
- Mark condition or notes as optional metadata.
- Filter catalog by owned/unowned.
- Quick-set sample inventory for demo/reset.
- Persist inventory locally between app launches.
- Export inventory as portable JSON.
- Import portable JSON with schema validation and human-readable error messages.

**Inventory constraints:**

- Generator must never use more physical copies of a tile than the current inventory allows, even when multiple faces of the same physical tile are valid candidates.
- If a layout request cannot be satisfied, the app must explain missing tile categories or constraints rather than silently failing.
- Custom tile entries may be used only when they have enough footprint and edge metadata to validate placement.

---

### 3.3 Deterministic Layout Generation Engine

The layout engine is the heart demon. It must be isolated under `src/layout`, deterministic, testable, and independent of React Native.

**Required engine capabilities:**

- Accept plain data inputs: catalog, inventory, constraints, optional seed, optional locked placements.
- Generate a connected layout graph/grid within bounds.
- Respect inventory quantities.
- Respect table size / max tile count.
- Respect theme filters where possible.
- Honour required tile type/category constraints.
- Validate edge compatibility / passability.
- Return structured diagnostics when generation fails.
- Return unused tile summary and missing requirement summary.
- Support seeded repeatability: same inputs + seed = same output.

**Layout output format:**

- Saved layout ID.
- Name / generated label.
- Constraints used.
- Placement list: tile ID, x/y, rotation, z-index, locked flag.
- Adjacency list with compatibility status.
- Missing requirements list.
- Warnings list.
- Generation seed and engine version.

**Algorithm bar for VS:**

The VS does not require a perfect optimiser. A greedy/backtracking hybrid is acceptable if it is deterministic, tested, and produces useful layouts for the seeded catalog. Correctness and explainability beat cleverness.

**Performance target:**

- Generate a 20-tile layout in under 1 second on target Android hardware.
- Hard timeout at 3 seconds with graceful failure and diagnostic message.

---

### 3.4 Layout Validation

Generation and manual edits must run through the same validator.

**Validation checks:**

| Check | Required Behaviour |
|---|---|
| Bounds | No tile cell exceeds table/grid bounds |
| Collision | No occupied cells overlap |
| Inventory | No tile count exceeds owned quantity |
| Connectivity | Required connected graph unless disabled |
| Edge compatibility | Door/passable edges align with compatible neighbours |
| Required pieces | Required tile types/categories included or reported missing |
| Locked placements | Regeneration preserves locked tiles and validates around them |
| Custom tiles | Custom footprints and edges validated like catalog tiles |

**Validation output:**

- Machine-readable pass/fail result.
- Per-placement error/warning list.
- Human-readable explanation suitable for UI display.

---

### 3.5 Functional UI Screens

The VS UI should be clear, mobile-friendly, and useful. It does not need final visual identity polish.

**Required screens:**

| Screen | Required Functions |
|---|---|
| Home / Demo launcher | Start with sample data, continue saved state, reset demo data |
| Catalog | Browse/search/filter sample tiles; view tile details |
| Inventory | Edit owned quantities; filter owned/unowned; import/export JSON |
| Generator setup | Set table size, theme tags, max tiles, required categories, seed |
| Layout result | Render generated layout preview; show warnings/missing/unused tiles |
| Layout detail | Save/rename/favourite layout; inspect placements; export JSON |
| Settings / About | App version, engine version, local-first note, data reset |

**Interaction requirements:**

- Touch targets meet 44×44 px minimum.
- Layout preview supports pan/zoom or a readable fit-to-screen mode.
- A generated layout can be regenerated with a new seed.
- At least one tile can be locked in place before regenerating.
- Empty/error states are explicit and non-technical.

---

### 3.6 Persistence, Export, and Import

VS v2.0 must prove the local-first architecture.

**Persistence:**

- Inventory persists locally.
- Saved layouts persist locally.
- App can be closed/reopened without losing demo data.
- Schema version is stored with persisted records.

**Export/import:**

- Export inventory JSON.
- Export saved layout JSON.
- Import inventory JSON with validation.
- Import failure states show which field or schema rule failed.

**Storage implementation:**

SQLite via Expo SQLite is preferred if implementation timing allows. If SQLite integration is not stable by the VS gate, AsyncStorage or filesystem JSON may be used as a temporary persistence adapter only if the data model and repository interface remain SQLite-ready.

---

### 3.7 Technical Foundation

The VS must leave behind a maintainable app foundation rather than a throwaway prototype.

**Required technical deliverables:**

- Expo React Native TypeScript app boots through the chosen entry path.
- `src/layout` has no React / React Native imports.
- Data schemas are typed and validated.
- Layout engine has deterministic unit tests.
- UI view models convert app state into layout-engine inputs without business logic hidden in components.
- CI command runs typecheck, unit tests, and Expo web export smoke build.
- README updated with local run/test instructions.

---

## 4. What Is NOT In Scope — Explicit Out-of-Scope List

The following v1.0 playable-session elements are removed from Milestone 2 scope.

| Category | Out-of-Scope Item | Rationale |
|---|---|---|
| Gameplay | 15-minute authored playable session | TileKeeper is a planning app, not a defence game demo |
| Gameplay | Keeper classes, skills, AI, XP, morale, fatigue | Not required to prove catalog/inventory/layout value |
| Gameplay | Economy ticks, structures, waves, enemies, win/lose states | Replaced by layout generation constraints and validation |
| Content | Temperate biome, Moss-Cut Ruins tile roster, corruption rules | Product catalog uses real modular terrain categories instead |
| Art | Art-passed biome tiles, Keeper portraits, animation pass | Schematic thumbnails and readable layout preview are sufficient |
| Audio | Ambient loops, music tracks, SFX, audio mastering | No audio requirement for functional app VS |
| Platform | Store-ready Android/iOS builds | Expo preview/web export smoke are sufficient for VS; EAS later |
| Cloud | Accounts, sync, catalog update service, entitlements | Local-first foundation only |
| Catalog | Full Modular Realms product catalog | Seeded representative catalog only |
| Capture | Barcode scanning, OCR, image recognition | Manual catalog/inventory entry only |
| Social | Public layout sharing/community browser | JSON/share payload only |
| Monetisation | IAP, premium features, entitlement checks | Deferred until product model is approved |
| Advanced optimisation | Perfect room-planning solver | Useful deterministic generator is enough for VS |
| Native polish | Haptics, deep links, widgets, AR/table camera | Deferred beyond foundation slice |

---

## 5. Acceptance Criteria — VS Gate Pass/Fail Checklist

A VS gate review is conducted by proxy product, technical, and UX leads. **All P0 criteria must pass.** P1 criteria may have up to 2 minor fails if documented with owners and follow-up tasks.

### P0 — Must Pass

| # | Criterion | Pass Threshold |
|---|---|---|
| P0.1 | App boots to demo launcher on target Android/Expo preview and web export smoke build | 5/5 launches succeed without crash |
| P0.2 | Seeded catalog loads and validates | 30+ entries, 0 schema errors, 0 duplicate slugs |
| P0.3 | Inventory quantities can be edited and persisted | Edits survive app restart in 5/5 checks |
| P0.4 | Generator creates valid connected layouts from owned inventory | 10 seeded demo runs pass validator |
| P0.5 | Generator respects inventory counts | Automated tests cover overuse prevention; 0 violations |
| P0.6 | Generator handles unsatisfiable constraints gracefully | Missing/blocked requirements displayed in UI and test fixtures |
| P0.7 | Same input + seed returns same layout | 20 deterministic repeat tests pass |
| P0.8 | Layout preview is readable and inspectable on mobile | UX proxy can identify tile types, connections, warnings |
| P0.9 | Save/export layout JSON works | Export validates against schema and can be reloaded |
| P0.10 | CI passes typecheck, unit tests, and web export smoke build | Clean run documented at handoff |

### P1 — Should Pass

| # | Criterion | Pass Threshold |
|---|---|---|
| P1.1 | 20-tile generation completes in under 1 second on target Android hardware | 95% of runs under target; no run over 3-second timeout |
| P1.2 | Import inventory JSON supports useful validation errors | 5 invalid fixture cases produce actionable messages |
| P1.3 | At least one locked tile can be preserved across regeneration | 5/5 manual tests pass |
| P1.4 | Search/filter works across catalog and inventory | Search by name/category/theme returns expected fixtures |
| P1.5 | Layout result explains unused owned tiles and missing requirements | UI copy reviewed by UX proxy |
| P1.6 | Touch targets and contrast meet baseline accessibility | Manual audit pass on primary screens |
| P1.7 | App supports reset-to-demo-data without reinstall | 3/3 reset tests pass |
| P1.8 | README documents setup, test, export, and demo script | Reviewer can run commands from README |
| P1.9 | Error boundaries catch generator/UI failures without blank screen | Forced error fixture shows recovery state |
| P1.10 | Saved layout rename/favourite metadata persists | 5/5 persistence checks pass |

### P2 — Nice to Have

| # | Criterion |
|---|---|
| P2.1 | Thumbnail schematic generator for catalog entries |
| P2.2 | Share-sheet integration for exported layout JSON |
| P2.3 | Printable/PDF layout summary view |
| P2.4 | Multiple generator strategies selectable in debug mode |
| P2.5 | Anonymous local performance log export for debugging |

---

## 6. Resource Estimates

### 6.1 Assumed Team Composition

The v2.0 VS is smaller than the v1.0 playable game slice and should be staffed as an app/product foundation effort.

| Role | Headcount | Notes |
|---|---:|---|
| Product / UX Lead | 0.5 FTE | Demo flow, requirements, copy, usability review |
| React Native App Engineer | 1.0 FTE | Screens, state, persistence, Expo integration |
| TypeScript/Layout Engineer | 1.0 FTE | Generator, validator, schemas, tests |
| QA / Test Engineer | 0.4 FTE | Fixtures, manual pass, device checks |
| Technical Artist / UI Designer | 0.2 FTE | Schematic preview readability, minimal visual system |
| Producer | 0.2 FTE | Sprint coordination, risk burndown, demo prep |
| **Total** | **~3.3 FTE** | Lean functional demo team |

### 6.2 Person-Week Estimates by Workstream

| Workstream | Person-Weeks | Breakdown |
|---|---:|---|
| Product/UX flow | 2.0 | Demo script, wireframes, acceptance copy, usability pass |
| Catalog schema + seed data | 3.0 | Typed model, fixtures, 30–40 seed entries, validation |
| Inventory management | 3.5 | Quantity editing, filters, persistence, import/export |
| Layout engine | 6.0 | Generator, validator, seeded determinism, diagnostics, locked tiles |
| Layout preview UI | 4.0 | Grid render, inspect panels, warnings/missing/unused summaries |
| App shell/navigation/state | 3.5 | Screens, state management, local-first flow, settings/reset |
| Persistence adapter | 2.5 | SQLite or JSON adapter, repositories, migration scaffold |
| Tests/CI | 3.0 | Unit fixtures, deterministic checks, typecheck, web export smoke |
| Device QA/performance | 2.0 | Android/Expo preview checks, generation timing, accessibility sweep |
| Demo polish/documentation | 2.0 | README, demo script, final bug fixes, sign-off evidence |
| Buffer (20%) | 6.3 | Integration, data cleanup, Expo/WSL friction |
| **TOTAL** | **~37.8 pw** | Rounded to **38 person-weeks** |

### 6.3 Asset/Data Count Estimates

| Asset/Data Category | Count | Notes |
|---|---:|---|
| Seed catalog entries | 30–40 | Representative, not exhaustive |
| Schematic tile markers/thumbnails | 30–40 | Can be generated shapes/colours, not licensed art |
| Layout test fixtures | 15–25 | Valid, invalid, edge compatibility, inventory overuse, locked tiles |
| Import/export JSON fixtures | 8–12 | Round-trip and failure cases |
| UI screens | 6–7 | Functional app flow |
| Icons | 10–15 | Search, filter, save, export, warning, lock, regenerate |

### 6.4 Budget Projection Check

The v2.0 scope is materially smaller than the v1.0 playable-session estimate. It removes character art, environment art, audio, combat AI, authored game balancing, and publisher-grade presentation polish.

| Line | Estimate |
|---|---|
| Personnel | ~38 person-weeks |
| Asset/data production | Seed data and schematic markers only |
| Audio outsourcing | None |
| Target devices | Existing Android/Expo test path sufficient |
| Build pipeline | Foundation CI already planned |
| Budget impact | Lower than v1.0; no escalation required |

---

## 7. Milestone 2 Timeline — Sprint Breakdown (Weeks 7–18)

### Sprint 1: Data Model & Engine Spike (Weeks 7–8)

**Goal:** Lock schemas and prove generator approach with fixtures.

| Task | Owner | Deliverable |
|---|---|---|
| S1.1 | Product/UX | Demo workflow and wireframe packet |
| S1.2 | Layout Engineer | Catalog, inventory, layout TypeScript models |
| S1.3 | Layout Engineer | Validator v0: bounds, collision, inventory counts |
| S1.4 | Layout Engineer | Generator spike with seeded deterministic output |
| S1.5 | App Engineer | Expo navigation/app shell skeleton |
| S1.6 | QA | Fixture plan and first invalid/valid cases |

**Gate:** `src/layout` can generate and validate a simple connected layout from fixture data.

---

### Sprint 2: Catalog & Inventory Flow (Weeks 9–10)

**Goal:** User can browse catalog and edit owned quantities.

| Task | Owner | Deliverable |
|---|---|---|
| S2.1 | App Engineer | Catalog list/detail screens |
| S2.2 | App Engineer | Inventory quantity editing and filters |
| S2.3 | Layout Engineer | Seed catalog 30+ entries with validation |
| S2.4 | App Engineer | Persistence adapter v0 |
| S2.5 | QA | Catalog/inventory validation tests |
| S2.6 | UX | Empty/error copy pass |

**Gate:** Demo inventory can be entered, saved, reset, and reloaded.

---

### Sprint 3: Generator Integration (Weeks 11–12)

**Goal:** UI can request and display valid generated layouts.

| Task | Owner | Deliverable |
|---|---|---|
| S3.1 | Layout Engineer | Generator v1: constraints, theme filter, required categories |
| S3.2 | Layout Engineer | Diagnostics for unsatisfiable constraints |
| S3.3 | App Engineer | Generator setup screen |
| S3.4 | App Engineer | Layout result preview screen |
| S3.5 | QA | Determinism and inventory-overuse tests |
| S3.6 | UX/UI | Preview readability pass |

**Gate:** User taps Generate and receives a valid readable layout or actionable failure reason.

---

### Sprint 4: Save, Export, and Manual Control (Weeks 13–14)

**Goal:** Layouts become reusable artifacts, not transient previews.

| Task | Owner | Deliverable |
|---|---|---|
| S4.1 | App Engineer | Save/rename/favourite layout |
| S4.2 | App Engineer | Export layout JSON |
| S4.3 | App Engineer | Import/export inventory JSON |
| S4.4 | Layout Engineer | Locked tile regeneration support |
| S4.5 | QA | Round-trip import/export fixtures |
| S4.6 | UX | Demo script draft and usability review |

**Gate:** Saved layout and inventory JSON round-trip through schema validation.

---

### Sprint 5: Device QA & Performance (Weeks 15–16)

**Goal:** Functional demo is robust on target device.

| Task | Owner | Deliverable |
|---|---|---|
| S5.1 | QA | Android/Expo preview test pass |
| S5.2 | Layout Engineer | Performance profiling and timeout handling |
| S5.3 | App Engineer | Error boundaries and recovery states |
| S5.4 | App Engineer | Accessibility baseline fixes |
| S5.5 | UX/UI | Schematic thumbnail/icon polish |
| S5.6 | Producer | Sign-off evidence checklist |

**Gate:** P0 criteria are green in internal test pass; P1 gaps documented.

---

### Sprint 6: VS Lock & Steering Demo (Weeks 17–18)

**Goal:** Ship a stable functional layout generation demo and supporting evidence.

| Task | Owner | Deliverable |
|---|---|---|
| S6.1 | All | P0 bug fix sweep |
| S6.2 | QA | Final regression: catalog, inventory, generator, save/export |
| S6.3 | Layout Engineer | Final deterministic fixture report |
| S6.4 | App Engineer | CI/web export smoke build evidence |
| S6.5 | Product/UX | Final 6–8 minute demo script |
| S6.6 | Producer | Known issues and follow-up backlog |
| S6.7 | Leads | Acceptance criteria review and sign-off |

**Gate:** Functional VS accepted or explicitly blocked with known issues.

---

## 8. Dependencies & Risk Summary

### 8.1 Critical Path Dependencies

| Dependency | Source | Impact if Missed |
|---|---|---|
| Product direction | PRD_v2.0 | Confirms TileKeeper is a physical-tile inventory and layout utility, not a game |
| Technical architecture | TECHNICAL_ARCHITECTURE_v2.0 | Confirms Expo/TypeScript/custom layout engine foundation |
| Seed catalog schema | VS Sprint 1 | Blocks inventory and generator integration |
| Layout validator | VS Sprint 1–2 | Blocks trustworthy generation |
| Persistence adapter | VS Sprint 2–4 | Blocks save/export acceptance criteria |
| Android/Expo preview path | Tooling pipeline | Blocks device proof |

### 8.2 Top Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R-VS1 | Layout generation produces technically valid but unhelpful layouts | Medium | High | Add UX review fixtures; expose warnings/unused/missing; allow locked tile regeneration |
| R-VS2 | Seed catalog quality is too thin to prove real product value | Medium | High | Prioritise representative categories and explicit source/rights notes; define minimum 30 entries |
| R-VS3 | Edge compatibility rules become ambiguous | Medium | Medium | Keep VS connector taxonomy small; document assumptions in fixtures |
| R-VS4 | SQLite integration costs more time than expected | Medium | Medium | Use repository interface; temporary JSON adapter allowed if schema remains stable |
| R-VS5 | Expo/web differences hide mobile performance issues | Medium | Medium | Test on Android preview in Sprint 5, not only web export |
| R-VS6 | Import/export scope expands into full sync/backups | Low | Medium | Gate to local JSON only; cloud sync explicitly out of scope |

---

## 9. Definition of Complete per VS Deliverable

| Deliverable | What "Complete" Means |
|---|---|
| Seed catalog | 30+ validated entries with categories, footprints, edges, themes, and rights notes |
| Inventory | User can edit owned quantities, filter owned/unowned, persist, reset, import, export |
| Layout engine | Deterministic generator and validator produce valid connected layouts from owned inventory |
| Diagnostics | Unsatisfiable requests explain missing pieces or conflicting constraints |
| Layout preview | Mobile-readable grid/graph preview with placement details and warnings |
| Save/export | Layout JSON saves locally, exports, validates, and reloads |
| Technical foundation | TypeScript schemas, isolated `src/layout`, CI typecheck/tests/web export pass |
| Demo evidence | README/demo script, test output, known issues, and sign-off checklist ready |

---

## 10. Sign-Off Block

| Role | Name | Signature | Date |
|---|---|---|---|
| Product Lead (proxy) | | | |
| Tech Lead (proxy) | | | |
| UX/UI Lead (proxy) | | | |
| QA Lead (proxy) | | | |
| Producer (proxy) | | | |
| Steering Committee Representative | | | |

**Sign-off means:**

- The v1.0 playable-session scope is formally retired for Milestone 2.
- The v2.0 functional layout generation demo is the accepted VS target.
- Acceptance criteria are realistic and will be evaluated honestly.
- Any scope changes after sign-off require a formal change request.

---

*Document end. v2.0 replaces the playable defence-session slice with the functional catalog/inventory/layout-generation app demo.*
