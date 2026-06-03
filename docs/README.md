# Modular Realms: TileKeeper — Active Artifact Index

> **Project:** Modular Realms: TileKeeper  
> **Milestone:** M2 — Sprint 1  
> **Date:** 2026-06-03  
> **Board:** `modular_realms_tilekeeper`

This index lists every document in the `docs/` directory, its current authority status, and its cross-references. Treat **Active** documents as authoritative for implementation decisions; treat **Superseded** and **Historical** documents as read-only context.

---

## Active Documents

| Document | Status | Description | Cross-References |
|---|---|---|---|
| `PRD_v2.0.md` | Active | Authoritative product direction: catalog, inventory, deterministic layout generation for physical Modular Realms tiles. | ↔ `TECHNICAL_ARCHITECTURE_v2.0.md` (architecture), ↔ `milestone_plan.md` (delivery phases), ↔ `VS_SCOPE.md` (M2 demo scope) |
| `TECHNICAL_ARCHITECTURE_v2.0.md` | Active | Corrected architecture baseline: Expo React Native + TypeScript + SQLite + custom deterministic layout engine. | ↔ `PRD_v2.0.md` (product requirements), ↔ `milestone_plan.md` (build phases), ↔ `architecture-notes.md` (original notes) |
| `GDD.md` | Active | Game Design Document v1.1 — utility-app scope realigned; tile catalog, inventory, layout rules, adjacency validation. | ↔ `PRD_v2.0.md` (product scope), ↔ `art-bible-ui-style-guide.md` (visual direction) |
| `VS_SCOPE.md` | Active | Milestone 2 Vertical Slice Scope v2.0 — functional layout generation demo, not a playable game session. | ↔ `VS_SCOPE_SIGNOFF.md` (signed commitment), ↔ `PRD_v2.0.md` (requirements), ↔ `milestone_plan.md` (M2 phase) |
| `VS_SCOPE_SIGNOFF.md` | Active | Leadership sign-off for M2 v2.0 scope: all proxy leads approved. | ↔ `VS_SCOPE.md` (detailed scope) |
| `M1_PIVOT_RECONCILIATION.md` | Active | STEER-7 formal scope correction: records the pivot from utility app → realm-builder game → corrected tool/app direction. | ↔ `M1_FOUNDATION_SIGNOFF_REPORT.md` (M1 review), ↔ all `_DEPRECATED.md` / `_v1.0.md` files (retired scope) |
| `RISK_REGISTER_v2.0.md` | Active | Corrected risk register for tool/app baseline: delivery risks, not game-development risks. | ↔ `risk-burndown-tracker_v2.0.md` (probability tracking), ↔ `milestone_plan.md` (phase gates) |
| `risk-burndown-tracker_v2.0.md` | Active | Probability tracking for the v2.0 risk register through M2–M5. | ↔ `RISK_REGISTER_v2.0.md` (source risks) |
| `milestone_plan.md` | Active | Milestone Plan v2.0 — re-baselined delivery phases for the utility/tool product. | ↔ `PRD_v2.0.md`, ↔ `TECHNICAL_ARCHITECTURE_v2.0.md`, ↔ `VS_SCOPE.md` |
| `art-bible-ui-style-guide.md` | Active | Art Bible & UI Style Guide v0.1 pre-production — mood, palette, typography, biome boards. | ↔ `GDD.md` (design intent), ↔ `TECHNICAL_ARCHITECTURE_v2.0.md` (Expo/React Native stack) |
| `steering-committee-minutes-template.md` | Active | Template for steering committee review minutes and risk status updates. | — |

---

## Superseded Documents

> ⚠️ **These documents are non-authoritative.** They are retained for historical context only. Do not use them for implementation decisions.

| Document | Status | Description | Superseded By | Retirement Header |
|---|---|---|---|---|
| `PRD_v1.0_GAME_CONCEPT_DEPRECATED.md` | Superseded | Original PRD for an inventory-only utility app. Scope was subsumed and corrected in v2.0. | `PRD_v2.0.md` | ✅ Yes — "RETIRED DOCUMENT" block at top |
| `TECHNICAL_ARCHITECTURE_v0.2_GAME_CONCEPT_DEPRECATED.md` | Superseded | Original architecture baseline before the M1 pivot reconciliation. | `TECHNICAL_ARCHITECTURE_v2.0.md` | ✅ Yes — "Deprecation notice" block at top |
| `RISK_REGISTER_v1.0.md` | Superseded | Mixed utility/game risk register created before scope correction. | `RISK_REGISTER_v2.0.md` | ✅ Yes — "Scope Status: Superseded" block at top |
| `risk-burndown-tracker.md` | Superseded | v1.0 probability tracker for the old mixed-scope risk set. | `risk-burndown-tracker_v2.0.md` | ✅ Yes — "Scope Status: Superseded" block at top |

---

## Historical Documents

| Document | Status | Description | Cross-References |
|---|---|---|---|
| `M1_FOUNDATION_SIGNOFF_REPORT.md` | Historical | Milestone 1 cross-document consistency review; records the state before the STEER-7 pivot. | ↔ `M1_PIVOT_RECONCILIATION.md` (scope correction), ↔ all v1.0 M1 documents |
| `architecture-notes.md` | Historical | Initial free-form architecture notes from project inception. Superseded by `TECHNICAL_ARCHITECTURE_v2.0.md`. | ↔ `TECHNICAL_ARCHITECTURE_v2.0.md` |

---

## Version Map

| Product Area | Active Version | Superseded Version |
|---|---|---|
| Product Requirements | `PRD_v2.0.md` | `PRD_v1.0_GAME_CONCEPT_DEPRECATED.md` |
| Technical Architecture | `TECHNICAL_ARCHITECTURE_v2.0.md` | `TECHNICAL_ARCHITECTURE_v0.2_GAME_CONCEPT_DEPRECATED.md` |
| Risk Register | `RISK_REGISTER_v2.0.md` | `RISK_REGISTER_v1.0.md` |
| Risk Tracking | `risk-burndown-tracker_v2.0.md` | `risk-burndown-tracker.md` |
| Milestone Plan | `milestone_plan.md` (v2.0) | v1.0 embedded in M1 foundation docs |
| Vertical Slice Scope | `VS_SCOPE.md` + `VS_SCOPE_SIGNOFF.md` (v2.0) | VS Scope v1.0 (not retained as file) |
| Game Design | `GDD.md` (v1.1) | GDD v1.0 (reviewed in `M1_FOUNDATION_SIGNOFF_REPORT.md`) |

---

## Quick Navigation for New Developers

1. Start here: `README.md` in the project root for quickstart commands.
2. Understand scope: `M1_PIVOT_RECONCILIATION.md` explains what changed and why.
3. Read the product brief: `PRD_v2.0.md`.
4. Check the tech stack: `TECHNICAL_ARCHITECTURE_v2.0.md`.
5. See what's being built in M2: `VS_SCOPE.md`.
