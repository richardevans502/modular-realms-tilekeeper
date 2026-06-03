# Modular Realms: TileKeeper — M1 Pivot Reconciliation Document

**Document ID:** STEER-7  
**Version:** 1.0  
**Date:** 2026-06-03  
**Owner:** Nova, proxy project lead  
**Status:** Formal scope correction — awaiting Rich / publisher confirmation  
**Decision Type:** Steering correction, baseline reset, artifact retirement  

---

## 1. Executive Decision

Milestone 1 contains a material product-scope conflict that must be corrected before Milestone 2 work proceeds.

The project began as a **Modular Realms inventory and layout-planning utility app**. During M1 design work it pivoted into **Modular Realms: TileKeeper**, a mobile-first strategic realm-builder game using modular tiles, Keeper assignment, resource chains, and defence waves.

This document formally reconciles that pivot.

### Steering Decision

The accepted forward scope is:

> **TileKeeper is now a mobile-first strategy / realm-builder game, not a pure inventory-and-layout utility app.**

The utility-app concepts — catalog metadata, inventory, saved layouts, source references, and local-first data portability — remain useful as supporting infrastructure where they serve the game. They are no longer the product's primary milestone scope, acceptance gate, or marketing promise.

### Immediate Consequence

The previous M1 foundation sign-off is downgraded from **GO** to:

> **CONDITIONAL GO — only after this reconciliation is accepted and downstream docs are updated or explicitly retired.**

MWAHAHA, the scope gremlin has been dragged into the light. No more pretending the inventory app and the defence game are the same deliverable.

---

## 2. Why This Correction Is Required

### 2.1 The Conflict

The current document set contains two incompatible product baselines:

| Baseline | Representative Artifacts | Product Promise | M2 Gate |
|---|---|---|---|
| **Original utility app** | `PRD.md`, `milestone_plan.md`, portions of `TECHNICAL_ARCHITECTURE.md` | Catalog owned tiles, generate layouts, save/export plans | Inventory → layout → save loop in under 3 minutes |
| **Pivoted strategy game** | `GDD.md`, `VS_SCOPE.md`, `VS_SCOPE_SIGNOFF.md`, `art-bible-ui-style-guide.md` | Place realm tiles, assign Keepers, gather resources, survive defence waves | 12–18 minute authored playable vertical slice |

These baselines are not merely different levels of detail. They define different users, gameplay loops, build priorities, staffing needs, acceptance criteria, and risks.

### 2.2 Specific Contradictions

| Area | Utility-App Baseline | Game Baseline | Reconciliation |
|---|---|---|---|
| Core loop | Inventory → catalog → generate layout → save/export | Place → assign → gather/craft → defend → expand → upgrade | Game loop becomes primary; inventory/catalog becomes supporting meta-system only when needed |
| M2 duration | Weeks 7–14 | Weeks 7–18 in VS Scope | Re-baseline M2 into prototype/renderer slice; full playable VS may span M2+M3 unless explicitly funded |
| Target platform | iOS preferred for user-testing density in milestone plan | Android primary for VS; iOS deferred | Android primary accepted for game VS; iOS remains later parity target |
| Tech rationale | React Native because this is not a real-time 3D game | React Native used for game-like schematic 2D strategy | Renderer risk must be reclassified as core product risk, not a minor preview concern |
| Acceptance criteria | Valid layout from test inventory, 60% layout algorithm coverage | 3-wave playable tutorial, Keeper skills, art/audio pass | Game VS criteria supersede utility-app M2 criteria |
| Art scope | Schematic tile labels and accessible UI | Biome identity, Keeper portraits, corruption, audio/music | Art/audio become milestone-gating game deliverables |
| Risk register | Catalog curation and layout complexity dominate | Balance, renderer, tutorial pacing, combat clarity dominate | Risk register requires game-pivot amendment |

---

## 3. Formal Scope Correction

### 3.1 Product Identity

**Corrected product statement:**

Modular Realms: TileKeeper is a mobile-first strategy realm-builder about assembling modular terrain tiles into a living realm, assigning specialised Keepers, managing resource chains, and defending the Hearth from escalating threats. The experience should remain tactile, readable, offline-friendly, and compatible with modular terrain metadata, but the shipped value proposition is a playable strategy game rather than a collection-management utility.

### 3.2 Product Pillars After Pivot

1. **Place with intent** — tile placement affects traversal, production, defence, corruption, and future expansion.
2. **Keepers make the board alive** — assignments, skills, morale, fatigue, and class identity transform static layouts into authored strategy.
3. **Defend what you build** — threats attack the player's actual realm, not a disconnected combat arena.
4. **Mobile-readable depth** — square-grid, compact-board strategy optimised for phone sessions.
5. **Metadata still matters** — tile definitions, sockets, footprints, source references, and local persistence remain important implementation foundations.

### 3.3 Primary In-Scope for Next Baseline

For the re-baselined vertical slice, the following are in scope:

- Android-first Expo React Native / TypeScript app shell.
- Square-grid board with deterministic tile placement, rotation, legal-edge validation, and undo/redo.
- One authored Temperate biome slice.
- Hearth, Meadow, Forest, Stone, Path, Water/Creek, Ruin, Wall/Gate/Bridge/Watchtower/Wardstone-level defensive interactions as defined by the VS subset.
- Two Keeper classes: Forager and Warden.
- Assignment, fatigue, morale, XP, and one functional equipment slot per Keeper.
- One tutorialised 12–18 minute playthrough.
- One 3-wave defence encounter.
- Schematic but art-directed visuals matching the Art Bible.
- First-pass audio required for gameplay feedback.
- Session-local save/restore sufficient for backgrounding and demo continuity.

### 3.4 Explicitly Out of Scope After Pivot

The following original utility-app items are no longer M2/M3 gating unless reintroduced by a later change-control decision:

- Full owned-tile inventory management UI.
- Complete Modular Realms product catalog coverage.
- Saved user-generated layouts as a standalone planner feature.
- JSON import/export backup as a vertical-slice requirement.
- Missing-tile recommendation workflow.
- Catalog browsing as a primary navigation tab.
- Manual curation of 80%+ real-world Modular Realms commercial tiles as a milestone exit criterion.
- Marketing the app as a practical collection-management companion before the game loop is proven.

These systems may return later as meta-progression, collection, or companion features. For now, they must not pollute the vertical-slice acceptance gate. Scope demons hate fences; we build fences anyway.

---

## 4. Artifact Retirement and Supersession Plan

No artifact should be deleted. Retired artifacts remain useful history, but they must stop acting as active scope authority.

### 4.1 Artifact Status Matrix

| Artifact | Current Problem | New Status | Required Action |
|---|---|---|---|
| `docs/PRD.md` | Defines the project as inventory/layout utility app | **Retired as product baseline** | Add header note: superseded by `GDD.md` + this reconciliation; preserve for historical origin and reusable metadata concepts |
| `docs/milestone_plan.md` | M2/M3 gates still describe utility-app delivery | **Superseded for M2+** | Rewrite or replace after steering acceptance; keep only as pre-pivot baseline until then |
| `docs/TECHNICAL_ARCHITECTURE.md` | Selects Expo for utility-app reasons and says TileKeeper is not a real-time game | **Requires amendment** | Keep Expo/TS decision, but update rationale around schematic 2D strategy game and promote renderer risk |
| `docs/GDD.md` | Strongest current game-scope source | **Active baseline** | Keep as primary game design source after acceptance |
| `docs/VS_SCOPE.md` | Defines game VS but conflicts with milestone plan and signoff report | **Active with caveat** | Keep as candidate VS baseline; patch timeline mapping and dependencies after this document is accepted |
| `docs/VS_SCOPE_SIGNOFF.md` | Sign-off still references conflicted M1 artifacts | **On hold** | Do not sign until artifact retirement headers and acceptance criteria are corrected |
| `docs/M1_FOUNDATION_SIGNOFF_REPORT.md` | Incorrectly declares cross-document consistency | **Superseded / corrected** | Add erratum pointing to this STEER-7 document; downgrade GO to Conditional GO |
| `docs/RISK_REGISTER_v1.0.md` | Mixes utility risks and game risks without acknowledging pivot | **Requires amendment** | Add pivot risk and re-score renderer, game balance, session length, audio/art delivery |
| `docs/art-bible-ui-style-guide.md` | Aligned with game identity | **Active baseline** | Keep; reference as visual authority for game slice |
| `assets/README.md` | Locks art conventions; compatible with game slice | **Active support artifact** | Keep; no change required beyond reference update if needed |

### 4.2 Retirement Header Template

Use this exact header on retired/superseded artifacts:

```md
> **Scope Status:** Superseded by STEER-7 (`docs/M1_PIVOT_RECONCILIATION.md`).
> This document is retained for historical context and reusable concepts only. It is not an active milestone acceptance authority unless explicitly reactivated by change control.
```

### 4.3 Erratum Header Template

Use this exact header on sign-off or review artifacts that made now-invalid claims:

```md
> **Erratum — 2026-06-03:** STEER-7 identified a material scope pivot from inventory/layout utility app to mobile strategy game. Any prior claim of full cross-document consistency is corrected to Conditional GO pending artifact retirement and acceptance-criteria re-baseline.
```

---

## 5. Revised Acceptance Criteria

### 5.1 STEER-7 Acceptance Criteria

This reconciliation is accepted only when all of the following pass:

| ID | Criterion | Pass Threshold |
|---|---|---|
| S7.1 | Steering owner confirms game-pivot direction | Rich / publisher explicitly accepts or amends the corrected product identity |
| S7.2 | Retired artifacts are marked | `PRD.md`, `milestone_plan.md`, and `M1_FOUNDATION_SIGNOFF_REPORT.md` have status/erratum headers or replacement docs |
| S7.3 | Active baseline list is unambiguous | Project README or docs index identifies active vs retired planning artifacts |
| S7.4 | Technical architecture is amended | Architecture rationale acknowledges strategy-game rendering and reclassifies renderer/performance risk |
| S7.5 | Risk register is amended | Pivot risk plus game-specific M2/M3 risks are tracked with owners and triggers |
| S7.6 | VS acceptance gate is corrected | VS criteria are explicitly game-slice criteria and no longer mixed with utility-app inventory/layout gates |
| S7.7 | No active milestone gate references retired scope | M2 work items do not require full inventory/catalog/save/export unless tied directly to the game slice |

### 5.2 Re-Baselined M2 Entry Criteria

M2 may begin only when:

- STEER-7 is accepted or explicitly overridden by Rich.
- Active baseline set is confirmed:
  - `GDD.md`
  - `VS_SCOPE.md` after timeline/dependency patch
  - `TECHNICAL_ARCHITECTURE.md` after strategy-game amendment
  - `art-bible-ui-style-guide.md`
  - `RISK_REGISTER_v1.0.md` after pivot amendment
- Retired utility documents are clearly marked.
- Android-first VS delivery is accepted.
- Renderer prototype and core placement framework are first-sprint priorities.

### 5.3 Re-Baselined Vertical Slice Exit Criteria

The VS exit gate is the game-slice gate, not the utility-app gate:

#### P0 — Must Pass

1. Start-to-finish authored playthrough completes without crash, soft-lock, or progression blocker.
2. Player can place, rotate, confirm, undo, and redo square-grid tiles with clear legal/illegal feedback.
3. Board state drives production, Keeper assignment, traversal, and threat routing.
4. Forager and Warden are both playable, assignable, and mechanically distinct.
5. At least one Keeper skill per class affects the board state in a visible, testable way; full six-skill target remains preferred if schedule allows.
6. One 3-wave defence encounter spawns, paths, resolves combat, and supports win/lose outcomes.
7. Tutorial teaches placement, assignment, structure build, wave preparation, and resolution rewards.
8. Temperate schematic art is readable and matches the Art Bible palette at mobile scale.
9. Audio feedback exists for placement, UI confirmation, wave warning, combat impact, and victory/defeat.
10. Android demo build runs on target device or emulator with no P0 defects.

#### P1 — Should Pass

1. Session length lands in the 12–18 minute target.
2. Frame rate is stable at 30 fps minimum during normal play.
3. App resumes from background without losing current session state.
4. Touch targets meet mobile accessibility minimums.
5. Tutorial skip path is available for repeat demos.
6. At least one automated test suite covers placement validation and deterministic combat/wave resolution.
7. All visible text is free of placeholder/TBD/coming-soon strings.

#### P2 — Non-Gating

- Full inventory management.
- Standalone catalog browsing.
- JSON import/export backup.
- Full six-skill implementation if one-per-class proof is accepted as M2 prototype scope.
- iOS build.
- Particle effects, haptics, voice-over, advanced analytics.

---

## 6. Change-Control Rules After Reconciliation

Once this document is accepted:

1. Any attempt to restore utility-app features as milestone gates requires a formal change request.
2. Any attempt to remove Keeper assignment, defence waves, or authored game-loop proof from the VS requires a formal change request.
3. Retired artifacts may be mined for data-model ideas, but not cited as active acceptance authority.
4. M2 planning must reference the active artifact list in §5.2.
5. Future sign-off reports must include an explicit scope-baseline check before declaring GO.

---

## 7. Recommended Next Actions

| Priority | Action | Owner | Deadline |
|---|---|---|---|
| P0 | Rich confirms whether the game pivot is accepted | Rich / Publisher | Before M2 task execution |
| P0 | Apply retirement/erratum headers to conflicted artifacts | PM / Nova | Within 1 working day of acceptance |
| P0 | Patch VS Scope timeline to distinguish M2 prototype from full VS completion | Design + PM | Before sprint planning |
| P1 | Amend Technical Architecture for strategy-game renderer assumptions | Tech Lead | Before renderer spike |
| P1 | Amend Risk Register with pivot and game-slice risks | PM | Before first risk review |
| P1 | Produce active-doc index in README or `docs/README.md` | PM | Before downstream agents begin implementation |

---

## 8. Formal Sign-Off

| Role | Name | Decision | Date | Notes |
|---|---|---|---|---|
| Product / Publisher | Rich | Pending | — | Must accept or amend pivot direction |
| Project Lead Proxy | Nova | Recommended | 2026-06-03 | Recommends accepting game pivot and retiring utility-app baseline |
| Technical Lead Proxy | Nova | Conditional | 2026-06-03 | Expo/TS still viable, but architecture rationale needs amendment |
| Design Lead Proxy | Nova | Recommended | 2026-06-03 | GDD + VS Scope provide coherent game direction once old scope is retired |

---

## 9. Final Ruling

The project may continue as **Modular Realms: TileKeeper — mobile strategy realm-builder** only after the old inventory/layout utility baseline is formally retired or marked historical.

Until then, M2 implementation should not begin, because the current artifact set can command two different teams to build two different products. That is how schedule demons breed in the walls.

**Recommended status:** Conditional GO pending Rich confirmation and artifact-header updates.

*End of STEER-7 Pivot Reconciliation Document*