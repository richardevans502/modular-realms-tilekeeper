# Modular Realms TileKeeper — Risk Burndown Tracker v2.0

**Status:** Baseline established for corrected tool/app risk register  
**Updated:** 2026-06-03  
**Owner:** PM (Nova proxy)  
**Source Register:** `RISK_REGISTER_v2.0.md`  
**Supersedes:** `risk-burndown-tracker.md` for active risk tracking

## How to Read This Tracker

- **H** = High probability (61–100%)
- **M** = Medium probability (31–60%)
- **L** = Low probability (0–30%)
- **–** = Not yet assessed
- **✓** = Risk closed, accepted, or retired

Colour coding:

- 🔴 **H** = actively threatening; immediate attention
- 🟡 **M** = possible; monitor closely
- 🟢 **L** = unlikely; passive monitoring
- ⚫ **✓** = resolved / closed

This v2.0 tracker follows the active tool/app register only. Retired game-development risks are not tracked here unless formally reactivated by change control.

---

## Baseline Probabilities — 2026-06-03

| ID | Risk | Baseline P | Target P at M2 Exit | Target P at M3 Exit | Target P at M5 Exit |
|---|---|:---:|:---:|:---:|:---:|
| R1 | Scope baseline ambiguity | 🔴 H | 🟢 L | ⚫ ✓ | ⚫ ✓ |
| R2 | Brand/data/image permission | 🟡 M | 🟡 M | 🟢 L | ⚫ ✓ |
| R3 | Face-aware data model wrong | 🟡 M | 🟢 L | ⚫ ✓ | ⚫ ✓ |
| R4 | Solver complexity/performance | 🟡 M | 🟡 M | 🟢 L | ⚫ ✓ |
| R5 | Catalog curation backlog | 🔴 H | 🟡 M | 🟢 L | ⚫ ✓ |
| R6 | Import/export data loss | 🟡 M | 🟡 M | 🟢 L | ⚫ ✓ |
| R7 | Catalog refresh integrity | 🟡 M | – | 🟢 L | ⚫ ✓ |
| R8 | Inventory-entry UX friction | 🟡 M | 🟢 L | ⚫ ✓ | ⚫ ✓ |
| R9 | Expo platform/export constraints | 🟡 M | 🟡 M | 🟢 L | ⚫ ✓ |
| R10 | Privacy/store compliance | 🟢 L | – | 🟢 L | ⚫ ✓ |
| R11 | Preview/export readability | 🟡 M | 🟡 M | 🟢 L | ⚫ ✓ |
| R12 | Team capacity/tooling gaps | 🟡 M | 🟢 L | 🟢 L | 🟢 L |

---

## Probability Over Time — Review Snapshots

### M2 — Schema / Inventory / Solver MVP — Weekly Reviews

| ID | Risk | Baseline | W1 | W2 | W3 | W4 | M2 Exit |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|
| R1 | Scope baseline ambiguity | 🔴 H | – | – | – | – | – |
| R2 | Brand/data/image permission | 🟡 M | – | – | – | – | – |
| R3 | Face-aware data model wrong | 🟡 M | – | – | – | – | – |
| R4 | Solver complexity/performance | 🟡 M | – | – | – | – | – |
| R5 | Catalog curation backlog | 🔴 H | – | – | – | – | – |
| R6 | Import/export data loss | 🟡 M | – | – | – | – | – |
| R7 | Catalog refresh integrity | 🟡 M | – | – | – | – | – |
| R8 | Inventory-entry UX friction | 🟡 M | – | – | – | – | – |
| R9 | Expo platform/export constraints | 🟡 M | – | – | – | – | – |
| R10 | Privacy/store compliance | 🟢 L | – | – | – | – | – |
| R11 | Preview/export readability | 🟡 M | – | – | – | – | – |
| R12 | Team capacity/tooling gaps | 🟡 M | – | – | – | – | – |

M2 exit target:

- R1 at Low or Closed after active-doc index / retirement headers are applied.
- R3 at Low after real tile fixtures validate schema v2.
- R4 benchmarked with deterministic small/medium inventories.
- R5 has minimum viable catalog defined and at least 25 validated fixtures.
- R8 inventory-entry prototype usability-tested.
- R12 scripts and CI baseline in place.

---

### M3 — Export / Catalog Refresh / Cross-Platform Hardening — Weekly Reviews

| ID | Risk | W1 | W2 | W3 | W4 | W5 | M3 Exit |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|
| R1 | Scope baseline ambiguity | – | – | – | – | – | – |
| R2 | Brand/data/image permission | – | – | – | – | – | – |
| R3 | Face-aware data model wrong | – | – | – | – | – | – |
| R4 | Solver complexity/performance | – | – | – | – | – | – |
| R5 | Catalog curation backlog | – | – | – | – | – | – |
| R6 | Import/export data loss | – | – | – | – | – | – |
| R7 | Catalog refresh integrity | – | – | – | – | – | – |
| R8 | Inventory-entry UX friction | – | – | – | – | – | – |
| R9 | Expo platform/export constraints | – | – | – | – | – | – |
| R10 | Privacy/store compliance | – | – | – | – | – | – |
| R11 | Preview/export readability | – | – | – | – | – | – |
| R12 | Team capacity/tooling gaps | – | – | – | – | – | – |

M3 exit target:

- R2 permission posture resolved or generic/custom-catalog fallback accepted.
- R4 common solver generation meets budget or limited/manual-assisted scope accepted.
- R6 backup/import/export round-trip tests pass.
- R7 catalog-refresh integrity flow proven or deferred.
- R9 JSON/PNG/PDF export platform decision made.
- R11 preview/export readability benchmarked on 25/75/150-tile layouts.

---

### M4 — Beta / Store Readiness — Weekly Reviews

| ID | Risk | W1 | W2 | W3 | W4 | M4 Exit |
|---|---|:---:|:---:|:---:|:---:|:---:|
| R1 | Scope baseline ambiguity | – | – | – | – | – |
| R2 | Brand/data/image permission | – | – | – | – | – |
| R3 | Face-aware data model wrong | – | – | – | – | – |
| R4 | Solver complexity/performance | – | – | – | – | – |
| R5 | Catalog curation backlog | – | – | – | – | – |
| R6 | Import/export data loss | – | – | – | – | – |
| R7 | Catalog refresh integrity | – | – | – | – | – |
| R8 | Inventory-entry UX friction | – | – | – | – | – |
| R9 | Expo platform/export constraints | – | – | – | – | – |
| R10 | Privacy/store compliance | – | – | – | – | – |
| R11 | Preview/export readability | – | – | – | – | – |
| R12 | Team capacity/tooling gaps | – | – | – | – | – |

M4 exit target:

- No Critical risks active.
- R6 and R10 have no open P0/P1 trust/compliance blockers.
- Beta users can enter inventory, generate layouts, save, and export without data loss.
- Store metadata/privacy posture matches actual app behaviour.

---

### M5 — Launch / Post-Launch — Bi-weekly Reviews

| ID | Risk | W1 | W3 | W5 | M5 Exit |
|---|---|:---:|:---:|:---:|:---:|
| R1 | Scope baseline ambiguity | – | – | – | – |
| R2 | Brand/data/image permission | – | – | – | – |
| R3 | Face-aware data model wrong | – | – | – | – |
| R4 | Solver complexity/performance | – | – | – | – |
| R5 | Catalog curation backlog | – | – | – | – |
| R6 | Import/export data loss | – | – | – | – |
| R7 | Catalog refresh integrity | – | – | – | – |
| R8 | Inventory-entry UX friction | – | – | – | – |
| R9 | Expo platform/export constraints | – | – | – | – |
| R10 | Privacy/store compliance | – | – | – | – |
| R11 | Preview/export readability | – | – | – | – |
| R12 | Team capacity/tooling gaps | – | – | – | – |

M5 exit target:

- Public release has no open Critical or High risks.
- R1, R3, R6, R8, R9, and R10 are Closed or accepted at Low.
- R2, R4, R5, R7, R11, and R12 are Low/Monitoring with owners for v1.1.

---

## Cumulative Risk Profile

| Phase | High Probability (🔴) | Medium Probability (🟡) | Low Probability (🟢) | Closed (⚫) | Total Active |
|---|:---:|:---:|:---:|:---:|:---:|
| **Baseline 2026-06-03** | 2 | 9 | 1 | 0 | 12 |
| **M2 Exit Target** | 0 | ≤ 5 | ≥ 5 | ≥ 2 | 12 |
| **M3 Exit Target** | 0 | ≤ 3 | ≥ 5 | ≥ 4 | 12 |
| **M4 Exit Target** | 0 | ≤ 2 | ≥ 4 | ≥ 6 | 12 |
| **M5 Exit Target** | 0 | 0 | ≤ 4 | ≥ 8 | 12 |

---

## Update Instructions

1. After every risk review, update the relevant week column using H/M/L/✓.
2. Record re-scoring rationale in `RISK_REGISTER_v2.0.md` review history if probability or impact changes.
3. Do not add retired game-development risks to this tracker unless change control reactivates the game baseline.
4. If a new active app/tool risk is added, assign the next available ID and backfill baseline as its first assessed value.
5. Keep cumulative profile counts in sync with the latest review snapshot.

---

*Tracker v2.0 — active tool/app baseline.*
