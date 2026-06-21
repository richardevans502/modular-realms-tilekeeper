# Modular Realms TileKeeper — Risk Register v2.0

**Status:** Corrected active register — tool/app baseline  
**Version:** 2.0  
**Date:** 2026-06-03  
**Owner:** Project PM (Nova proxy)  
**Review Cadence:** Weekly during M2–M3; bi-weekly during M4–M5; monthly post-launch  
**Supersedes:** `RISK_REGISTER_v1.0.md` for active delivery decisions

## Scope Baseline for v2.0

Risk Register v1.0 mixed two materially different product baselines:

- **Utility/tool app baseline:** mobile catalog, owned inventory, deterministic layout generation, saved layouts, and export/import for physical Modular Realms terrain planning.
- **Game-development baseline:** mobile strategy/realm-builder with Keeper classes, waves, resources, combat, art/audio pass, and 12–18 minute tutorialised playthrough.

For this register, the active scope is the corrected tool/app architecture defined in `TECHNICAL_ARCHITECTURE_v2.0.md`:

> TileKeeper is a local-first catalog, inventory, deterministic layout-planning, and export mobile app for physical Modular Realms terrain tiles. It is not a combat game, not a real-time renderer project, and not a game-balance programme.

Game-development risks are retained only as retired/watchlist items in Appendix B so they do not continue to distort priority, staffing, acceptance gates, or contingency spend.

Related documents:

- `TECHNICAL_ARCHITECTURE_v2.0.md` — active technical baseline
- `PRD.md` — active product origin for catalog/inventory/layout utility scope
- `milestone_plan.md` — partially stale; use only where it matches utility-app scope
- `M1_PIVOT_RECONCILIATION.md` — conflict evidence; not accepted as active game scope unless steering reverses this baseline
- `risk-burndown-tracker_v2.0.md` — probability tracking for this register

---

## 1. Risk Scoring Methodology

### Probability Scale

| Rating | Likelihood | Quantitative Range |
|---|---:|---:|
| **Low (L)** | Unlikely in normal conditions; would surprise the team | 0–30% |
| **Medium (M)** | Possible; has precedent in comparable projects | 31–60% |
| **High (H)** | Likely if no mitigation is applied; known uncertainty exists now | 61–100% |

### Impact Scale

| Rating | Effect on Project | Examples |
|---|---|---|
| **Low (L)** | Minor schedule/cost variance; absorbed within buffer | < 1 week slip; < £500 unplanned spend; no acceptance-gate impact |
| **Medium (M)** | Measurable delay or quality degradation; requires replanning | 1–3 week slip; £500–£2,000; feature scope reduction |
| **High (H)** | Threatens milestone success, trust, launch readiness, or legal/commercial viability | > 3 week slip; > £2,000; major feature cut; release delay; user-data loss |

### Severity Matrix

| Probability \\ Impact | Low (L) | Medium (M) | High (H) |
|---:|:---:|:---:|:---:|
| **High (H)** | Moderate | High | **Critical** |
| **Medium (M)** | Low | Moderate | High |
| **Low (L)** | Low | Low | Moderate |

### Action Thresholds

- **Critical:** Immediate steering escalation; dedicated owner; mitigation plan active before M2 implementation proceeds.
- **High:** Reviewed weekly; owner reports progress; mitigation starts within 48 hours.
- **Moderate:** Tracked in register; reviewed on cadence; owner confirms trigger status.
- **Low:** Monitored passively; re-score if any trigger fires.

---

## 2. Active Top Risks — Tool/App Baseline

### R1 — Scope Baseline Ambiguity Causes the Team to Build the Wrong Product

| Field | Value |
|---|---|
| **Description** | Active planning artifacts still contain conflicting utility-app and game-slice assumptions. If uncorrected, implementation may split between catalog/inventory/layout tooling and game systems such as Keepers, waves, combat, art/audio, and session pacing. |
| **Category** | Governance / Scope |
| **Probability** | **High (H)** |
| **Impact** | **High (H)** |
| **Severity** | **Critical** |
| **Triggers** | M2 task references Keeper/combat/wave systems; developers cite `GDD.md` or `VS_SCOPE.md` as implementation authority; milestone gate requires both utility and game acceptance criteria; old risk IDs used without v2.0 mapping. |
| **Current Status** | Mitigating — v2.0 register establishes active tool/app risk baseline but downstream docs still need headers/index. |
| **Mitigation Owner** | PM |
| **Mitigation Actions** | 1. Publish this v2.0 register and v2.0 burndown tracker. 2. Add retirement/erratum headers or a docs index marking active vs historical planning artifacts. 3. Update M2 task specs to reference `TECHNICAL_ARCHITECTURE_v2.0.md` and utility-app acceptance gates only. 4. Require scope-baseline check in every steering review before GO/NO-GO decisions. |
| **Contingency** | If ambiguity persists, pause M2 implementation and hold a steering decision: utility app vs game. Do not attempt a hybrid milestone. |
| **Deadline** | Before M2 Sprint 1 task execution |
| **Review Frequency** | Weekly until closed |

---

### R2 — Modular Realms Brand, Data, and Image Permission Risk

| Field | Value |
|---|---|
| **Description** | TileKeeper depends on references to Modular Realms product names, dimensions, categories, faces, sockets, and possibly images. Without permission or a safe editorial/data-use approach, the catalog may need to be renamed, paraphrased, user-entered only, or stripped of official imagery. |
| **Category** | Legal / Business / Content |
| **Probability** | **Medium (M)** |
| **Impact** | **High (H)** |
| **Severity** | **High** |
| **Triggers** | No response from brand owner after 4 weeks; takedown/objection; inability to reuse product images; source terms prohibit republishing metadata; app-store review flags trademark confusion. |
| **Current Status** | Open — no permission evidence captured in active docs. |
| **Mitigation Owner** | PM / Business Lead |
| **Mitigation Actions** | 1. Draft permission/partnership request covering product names, dimensions, screenshots/images, and attribution. 2. Design catalog schema with source references and user-custom entries so official packs are optional. 3. Use manually written descriptive metadata rather than copied marketing text. 4. Avoid official logos in app icon/store metadata unless permission is granted. |
| **Contingency** | Rebrand as a generic modular terrain planner; ship with user-authored/custom catalog and optional community pack import. Budget £100 for trademark/legal consultation. |
| **Deadline** | First outreach by M2 Week 2; decision by M3 midpoint |
| **Review Frequency** | Bi-weekly until permission posture is resolved |

---

### R3 — Face-Aware Tile Data Model Is Under-Specified or Wrong

| Field | Value |
|---|---|
| **Description** | Real physical tiles may be double-sided, rectangular, polyomino, irregular, or have edge spans that do not align to a simple 1x1 grid. If schema v2 cannot represent physical reality, every downstream feature — inventory, solver, export, migration, and user trust — is compromised. |
| **Category** | Technical / Data Model |
| **Probability** | **Medium (M)** |
| **Impact** | **High (H)** |
| **Severity** | **High** |
| **Triggers** | First 20 catalogued tiles require ad-hoc fields; users cannot represent A/B faces; layout solver ignores physical quantity when face choices differ; custom tile creation cannot encode common Modular Realms pieces. |
| **Current Status** | Open — architecture defines a strong candidate model but it needs fixture validation against real tiles. |
| **Mitigation Owner** | Tech Lead |
| **Mitigation Actions** | 1. Build a representative fixture set covering room, corridor, wall, doorway, stair, junction, scatter, double-sided, and non-1x1 tiles. 2. Validate all fixtures through Zod schemas. 3. Run solver candidate expansion against fixtures before UI implementation. 4. Freeze schema v2 only after migration/import tests pass. |
| **Contingency** | Add schema extension fields and mark v2.0 as beta; block public catalog-pack publishing until v2.1 migration is proven. |
| **Deadline** | M2 schema foundation exit |
| **Review Frequency** | Weekly during M2 |

---

### R4 — Deterministic Layout Solver Complexity Exceeds Mobile Performance Budget

| Field | Value |
|---|---|
| **Description** | The solver must account for inventory quantities, tile footprint, face choice, rotation, socket compatibility, table bounds, connectedness, and missing-tile suggestions. Double-sided and irregular tiles can multiply candidate count quickly, making naive backtracking slow or memory-heavy on mobile. |
| **Category** | Technical / Algorithm Performance |
| **Probability** | **Medium (M)** |
| **Impact** | **High (H)** |
| **Severity** | **High** |
| **Triggers** | Common layout generation > 500 ms; large layouts exceed 2 s without cancellation; solver produces non-deterministic outputs for same seed; memory spikes or UI thread stalls; pathological custom tiles lock generation. |
| **Current Status** | Open — architecture recommends deterministic heuristics but no benchmark exists. |
| **Mitigation Owner** | Tech Lead |
| **Mitigation Actions** | 1. Implement solver as pure TypeScript module independent from React Native. 2. Memoize socket compatibility and rotated footprints. 3. Constrain top-N result count, trace depth, and search time budget. 4. Add benchmark fixtures for small, medium, and pathological inventories. 5. Run solver asynchronously with cancellation and graceful partial-result messaging. |
| **Contingency** | Ship M2 with manual-assisted placement validation and limited suggested layouts; defer full optimiser/ranked alternatives to M3. |
| **Deadline** | First benchmark by M2 Week 3; budget gate by M2 exit |
| **Review Frequency** | Weekly during M2–M3 |

---

### R5 — Catalog Curation and Source Referencing Takes Longer Than Planned

| Field | Value |
|---|---|
| **Description** | Even without game content, a useful tool requires accurate tile definitions, dimensions, faces, categories, sockets, and source references. Manual curation can become the critical path if every official tile needs interpretation, validation, and review. |
| **Category** | Content / Operations |
| **Probability** | **High (H)** |
| **Impact** | **Medium (M)** |
| **Severity** | **High** |
| **Triggers** | Fewer than 20 validated tile definitions by M2 midpoint; unresolved source fields for common pieces; curation review discovers repeated schema errors; no minimum viable catalog defined. |
| **Current Status** | Open — representative examples only; no active complete catalog. |
| **Mitigation Owner** | PM / Catalog Owner |
| **Mitigation Actions** | 1. Define minimum viable catalog as 25–40 high-frequency tiles for M2/M3, not 80% of all products. 2. Use spreadsheet-to-JSON conversion with schema validation. 3. Track source reference, confidence level, and reviewer for every tile. 4. Recruit community reviewers only after permission posture is safe. |
| **Contingency** | Launch with custom/user-authored catalog workflow plus a small starter pack; defer official comprehensive catalog to post-MVP. Budget £150 for targeted curation burst if needed. |
| **Deadline** | MVC definition by M2 Week 1; 25 validated fixtures by M2 exit |
| **Review Frequency** | Weekly during M2–M3 |

---

### R6 — Import/Export or Migration Bug Causes User Data Loss

| Field | Value |
|---|---|
| **Description** | The app promises local-first ownership records and portable backups. A bad SQLite migration, malformed backup, or lossy export/import path can corrupt inventory, custom tiles, saved layouts, or catalog references, damaging trust more severely than most feature defects. |
| **Category** | Technical / User Trust |
| **Probability** | **Medium (M)** |
| **Impact** | **High (H)** |
| **Severity** | **High** |
| **Triggers** | Import accepts malformed JSON; migration drops custom tile fields; export cannot round-trip a saved layout; schema version mismatch creates duplicate inventory; support report cites lost catalog or inventory data. |
| **Current Status** | Open — architecture defines safeguards but implementation not proven. |
| **Mitigation Owner** | Tech Lead |
| **Mitigation Actions** | 1. Validate all imports and backups with strict Zod schemas. 2. Wrap import/migration writes in SQLite transactions with rollback. 3. Add fixture tests for v1-to-v2 tile migration, backup round-trip, and invalid payload rejection. 4. Add import preview before destructive changes. |
| **Contingency** | Disable import for public builds until round-trip tests are green; provide export-only backup as interim protection. |
| **Deadline** | Before any public beta build |
| **Review Frequency** | Weekly during M2–M4 |

---

### R7 — Catalog Refresh Supply Chain or Integrity Failure

| Field | Value |
|---|---|
| **Description** | Optional remote catalog packs improve freshness but introduce trust and update risks: fake packs, checksum mismatch, incompatible schema versions, bad assets, CDN/Worker outage, or accidental publication of broken catalog data. |
| **Category** | Security / Operations |
| **Probability** | **Medium (M)** |
| **Impact** | **Medium (M)** |
| **Severity** | **Moderate** |
| **Triggers** | Manifest checksum mismatch; app loads unsigned/incompatible pack; pack update breaks existing layouts; Cloudflare host unavailable during refresh; admin secret leaks into mobile bundle or CI logs. |
| **Current Status** | Open — Cloudflare manifest model is optional and unimplemented. |
| **Mitigation Owner** | Tech Lead / DevOps |
| **Mitigation Actions** | 1. Treat refresh as optional; app remains functional offline. 2. Verify SHA-256 before caching; add signatures before official public catalog publishing if feasible. 3. Use `minimumAppVersion` and schema validation. 4. Maintain previous known-good pack and rollback path. 5. Keep catalog publishing credentials out of app and CI logs. |
| **Contingency** | Disable remote refresh and ship bundled starter catalog until pipeline is proven. |
| **Deadline** | Before enabling remote catalog UI |
| **Review Frequency** | Bi-weekly during M3–M4 |

---

### R8 — Inventory Entry UX Is Too Slow for Real Collections

| Field | Value |
|---|---|
| **Description** | The product succeeds only if users can enter and maintain owned tile quantities quickly. If adding repeated quantities, custom tiles, storage locations, or condition metadata is tedious, users may abandon the app before reaching layout generation. |
| **Category** | Product / UX |
| **Probability** | **Medium (M)** |
| **Impact** | **Medium (M)** |
| **Severity** | **Moderate** |
| **Triggers** | Playtesters need > 10 minutes to enter a small starter collection; repeated taps for quantity changes; custom tile form abandonment; feedback says spreadsheet is easier. |
| **Current Status** | Open — PRD states quick inventory entry as a goal; no tested flow exists. |
| **Mitigation Owner** | Product / UX Lead |
| **Mitigation Actions** | 1. Prototype claim-owned-tile flow before polishing catalog browsing. 2. Support quantity steppers, batch add, duplicate, recently used, and quick search. 3. Keep optional metadata hidden behind advanced edit. 4. Usability-test with at least 3 realistic collection-entry scenarios. |
| **Contingency** | Ship CSV/JSON import template or bulk-edit table mode for power users. |
| **Deadline** | M2 UX prototype gate |
| **Review Frequency** | Bi-weekly during M2–M3 |

---

### R9 — Expo/React Native Platform Constraints Block SQLite, Files, or PDF Export

| Field | Value |
|---|---|
| **Description** | Expo React Native is suitable for the app baseline, but platform APIs for SQLite migrations, document sharing, PDF generation, file permissions, signing, and background/resume behaviour can behave differently across Android and iOS. Signed iOS physical-device/TestFlight validation is now explicitly deferred until Apple Developer credentials exist, so Android is the v1.0 RC platform gate while iOS remains a tracked post-M5 parity risk. |
| **Category** | Technical / Platform |
| **Probability** | **Medium (M)** |
| **Impact** | **Medium (M)** |
| **Severity** | **Moderate** |
| **Triggers** | PDF renderer incompatible with managed Expo; Android file sharing fails; iOS document picker/export requires entitlement changes; SQLite migration behaves differently on device; EAS build fails after adding native dependency. |
| **Current Status** | Mitigating — architecture names export targets but renderer choice remains open; iOS simulator builds have succeeded, while signed iOS/TestFlight builds are deferred pending Apple Developer/App Store Connect credential setup. |
| **Mitigation Owner** | Tech Lead |
| **Mitigation Actions** | 1. Spike SQLite migration, JSON export, PNG export, and PDF generation on Android device/emulator early. 2. Prefer Expo-compatible libraries; record native-module requirements before dependency lock. 3. Keep JSON export as first-class fallback even if PDF slips. 4. Keep Android build/release checks as the M5 gate. 5. Add signed iOS physical-device/TestFlight smoke tests only after Apple Developer credentials/runners exist. |
| **Contingency** | Ship JSON + PNG export first; defer PDF to v1.1 or require EAS dev client/custom native module. If Apple credentials remain unavailable, release Android v1.0 and track iOS/TestFlight parity in M6+. |
| **Deadline** | Export spike by M2.4 |
| **Review Frequency** | Weekly during export implementation |

---

### R10 — Privacy, Analytics, and Store Compliance Misclassified as Minor

| Field | Value |
|---|---|
| **Description** | Even a local-first utility app must handle privacy labels, backup/export data, optional analytics, catalog network calls, app-store metadata, and user trust. Sending inventory contents by default or mislabeling data collection could create store-review or reputation risk. |
| **Category** | Compliance / User Trust |
| **Probability** | **Low (L)** |
| **Impact** | **High (H)** |
| **Severity** | **Moderate** |
| **Triggers** | Analytics captures tile ownership or custom notes; privacy policy missing or inaccurate; app-store review asks for data-use clarification; export includes unrelated settings or identifiers. |
| **Current Status** | Open — architecture states no default inventory analytics but policy artifact not yet produced. |
| **Mitigation Owner** | PM / Tech Lead |
| **Mitigation Actions** | 1. Default to no analytics for inventory contents. 2. If analytics are added, make them opt-in and aggregate only. 3. Draft privacy policy before closed beta. 4. Audit exports to include only layout/catalog/inventory fields intentionally selected by user. |
| **Contingency** | Disable analytics entirely for initial launch; rely on crash reports and voluntary feedback. |
| **Deadline** | Privacy policy by M4 store-assets gate |
| **Review Frequency** | Bi-weekly from M3 |

---

### R11 — Schematic Preview Performance or Readability Fails on Large Layouts

| Field | Value |
|---|---|
| **Description** | Although game-renderer risks are retired, the app still needs readable schematic previews and exports. Large inventories or layouts up to ~150 placed tiles may stress pan/zoom performance, label density, touch selection, and thumbnail readability. |
| **Category** | Technical / UX Performance |
| **Probability** | **Medium (M)** |
| **Impact** | **Medium (M)** |
| **Severity** | **Moderate** |
| **Triggers** | Pan/zoom jank on 150-tile preview; labels overlap; users cannot identify tile faces/rotation; exported PNG/PDF is unreadable at print scale; UI blocks > 50 ms during preview update. |
| **Current Status** | Open — architecture sets targets but preview renderer not implemented. |
| **Mitigation Owner** | Tech Lead / UX Lead |
| **Mitigation Actions** | 1. Render schematic shapes first; defer detailed images. 2. Use level-of-detail: labels at high zoom, category glyphs at low zoom. 3. Add print/export layouts separate from interactive viewport. 4. Benchmark 25/75/150-tile previews. |
| **Contingency** | Cap interactive preview detail and rely on PDF/PNG export for dense layouts. |
| **Deadline** | Preview spike by M2.4 |
| **Review Frequency** | Weekly during preview/export work |

---

### R12 — Team Capacity and Tooling Gaps Delay Foundation Implementation

| Field | Value |
|---|---|
| **Description** | The project assumes lean engineering/design capacity and a working Expo/TypeScript toolchain. Missing Jest/test scripts, unresolved npm audit findings, absent iOS credentials, or single-person knowledge concentration can delay otherwise straightforward app work. The repeated iOS signing blocker is now a known external account dependency rather than an M5 release-candidate gate. |
| **Category** | Resource / Delivery |
| **Probability** | **Medium (M)** |
| **Impact** | **Medium (M)** |
| **Severity** | **Moderate** |
| **Triggers** | Only one engineer can run builds; test script absent when implementation starts; CI not green; illness/unavailability > 2 weeks; Apple/Google account setup delayed. |
| **Current Status** | Mitigating — core TypeScript/Jest/web checks are established; signed iOS/TestFlight work is deferred pending Apple Developer credentials. |
| **Mitigation Owner** | PM / Tech Lead |
| **Mitigation Actions** | 1. Maintain `npm run typecheck`, `npm run test`, `npm run build:web`, and `npm run ci` before feature work scales. 2. Document setup and release commands. 3. Keep M5 Android-first for the v1.0 RC; defer iOS signing/TestFlight until Rich completes Apple Developer/App Store Connect setup. 4. Maintain one-week milestone buffer and deferrable feature list. |
| **Contingency** | Narrow release scope to Android store readiness plus documented iOS simulator evidence; defer signed iOS/TestFlight to M6+. Budget £500 contractor burst only if schedule-critical capacity drops. |
| **Deadline** | Tooling baseline by M2 Week 1 |
| **Review Frequency** | Weekly during M2; bi-weekly after CI stabilises |

---

## 3. Severity Distribution

| Severity | Count | Risk IDs |
|---|---:|---|
| **Critical** | 1 | R1 |
| **High** | 5 | R2, R3, R4, R5, R6 |
| **Moderate** | 6 | R7, R8, R9, R10, R11, R12 |
| **Low** | 0 | — |
| **Total** | **12** | — |

Steering attention:

- **Immediate:** R1 scope baseline, R3 data model fixture proof, R12 tooling baseline, and explicit iOS/TestFlight deferral communications.
- **M2:** R4 solver performance, R5 minimum viable catalog, R8 inventory-entry UX, R9 export/platform spike.
- **M3–M4:** R2 permissions, R6 import/export safety, R7 catalog refresh trust, R10 privacy/store compliance, R11 large-preview readability.

---

## 4. Retired / Reclassified v1.0 Risks

| v1.0 ID | v1.0 Risk | v2.0 Decision |
|---|---|---|
| R1 | Layout engine performance bottleneck | Recast as active R4 solver complexity and R11 schematic preview performance. Remove corruption/biome/game-session assumptions. |
| R2 | Manual tile catalog curation backlog | Retained as active R5, but target is minimum viable catalog, not game-biome content or 80% product coverage by M3 unless explicitly approved. |
| R3 | Keeper class / skill tree balance | Retired to Appendix B. Not an active utility-app risk. |
| R4 | iOS native build pipeline unverified | Folded into active R9/R12. Still relevant as platform/tooling risk, but not a game VS blocker. |
| R5 | Expo/RN custom rendering limitations | Recast as active R9/R11. Real-time game rendering, particle, combat, and 60 FPS requirements are removed. |
| R6 | Modular Realms brand/IP permissions | Retained and strengthened as active R2. |
| R7 | Closed-beta feedback contradicts PRD/GDD priorities | Recast under R1 scope baseline and R8 UX expectations. |
| R8 | Team capacity reduction | Retained as active R12. |
| R9 | Analytics/cloud services cost escalation | Recast as active R7/R10. Catalog refresh is optional; analytics should not include inventory by default. |
| R10 | Data export format compatibility | Strengthened as active R6. |

---

## 5. Contingency Budget Recommendations

| Risk Area | Contingency Allocation | Trigger Condition | Release Authority |
|---|---:|---|---|
| Legal / trademark / permission check | £100 | Brand owner objection, unclear metadata/image rights, or store naming concern | PM + Business Lead |
| Catalog curation burst | £150 | < 25 validated tile definitions by M2 exit or repeated schema-review backlog | PM |
| Test devices / platform tooling | £150 | Need representative Android/iOS device or EAS/Expo tooling beyond free assumptions | Tech Lead + PM |
| Export/PDF native-module spike | £100 | Expo-compatible export path fails and paid library/tooling is required | Tech Lead |
| Contractor burst / capacity cover | £500 | Engineer availability drops below 0.5 FTE for > 2 weeks during critical path | PM |
| Cloudflare/catalog hosting overage | £100 | Remote catalog refresh exceeds expected free/low-cost tier after beta | Tech Lead + PM |
| **Total Recommended Contingency** | **£1,100** | | |

Budget governance:

- Spend above £100 requires PM approval and a matching risk ID entry.
- Do not spend contingency on game-only systems unless steering formally reactivates the game baseline.
- Unused contingency becomes post-launch support buffer.

---

## 6. Risk Review Cadence

| Phase | Cadence | Review Focus |
|---|---|---|
| **M2 — Schema / inventory / solver MVP** | Weekly | Scope baseline, fixture validation, solver benchmark, tooling, MVC catalog |
| **M3 — Exports / catalog refresh / cross-platform hardening** | Weekly | Import/export round-trip, platform file/PDF behaviour, catalog trust, permissions |
| **M4 — Beta / store readiness** | Weekly | UX friction, privacy policy, crash reports, data-loss prevention, store metadata |
| **M5 — Launch / post-launch** | Bi-weekly | Android release readiness, support burden, catalog-update health, solver performance reports, iOS/TestFlight deferral status, roadmap v1.1 |
| **Post-M5** | Monthly | Register archival, live-ops issues, source-data changes, lessons learned |

Review format:

1. Confirm active scope baseline before discussing risks.
2. Each owner reports trigger status, mitigation progress, and next action.
3. Re-score probability/impact if evidence has changed.
4. Add new risks only if they are tool/app risks or steering has formally reactivated game scope.
5. Update `risk-burndown-tracker_v2.0.md` after the review.

---

## 7. Escalation Criteria and Change Control

An issue must be escalated when any of the following occur:

| # | Escalation Trigger | Escalation Path | Response SLA |
|---|---|---|---:|
| E1 | Scope ambiguity causes competing implementation instructions | PM → steering owner | 24h |
| E2 | Any active risk rises to **Critical** | Owner → PM → steering owner | 24h |
| E3 | Solver/schema failure threatens M2 exit criteria | Tech Lead → PM | 48h |
| E4 | Data-loss or privacy issue is discovered | Tech Lead → PM → steering owner | 24h |
| E5 | Brand/IP objection or store naming concern emerges | PM → Business Lead → external advice if needed | 72h |
| E6 | Tool/app baseline is challenged by request to restore game systems | PM → formal change-control review | 48h |
| E7 | Unplanned spend above £100 is requested | Requesting owner → PM approval | 24h |

Change-control posture:

- Reintroducing Keepers, combat, waves, authored game sessions, art/audio-gated VS, or game balance as milestone criteria requires formal steering approval.
- Removing catalog/inventory/layout/export from the active app baseline also requires formal steering approval.
- Historical docs may inform ideas, but only active docs can define acceptance gates.

---

## 8. Maintenance

### Owner Responsibilities

Each risk owner is accountable for:

- Monitoring triggers and early-warning signs.
- Reporting status at every scheduled review.
- Updating mitigation actions and deadlines.
- Escalating when criteria fire.
- Moving status through Open → Mitigating → Monitoring → Closed/Escalated.

### Status Definitions

| Status | Definition |
|---|---|
| **Open** | Risk identified; no mitigation fully underway yet. |
| **Mitigating** | Mitigation actions in progress; owner reports on cadence. |
| **Monitoring** | Mitigation deployed; risk reduced but triggers still watched. |
| **Closed** | Risk eliminated, accepted, or no longer applies; rationale documented. |
| **Escalated** | Risk exceeds owner authority and is under steering/change-control review. |
| **Retired** | Risk belongs to a non-active baseline and must not drive delivery unless reactivated. |

### Document Control

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-06-02 | Nova | Original risk register; mixed utility-app and game-slice risks. |
| 2.0 | 2026-06-03 | Nova | Corrected active risks to tool/app baseline; reclassified game-development risks; added scope-baseline risk and app-specific data, solver, export, catalog, privacy, and UX risks. |

### Review History

| Date | Reviewer | Risks Reviewed | Key Decisions / Actions Taken |
|---|---|---|---|
| 2026-06-03 | Nova (proxy PM) | R1–R12 | Created v2.0 register; classified game-development risks as retired unless steering reactivates game baseline. |
| 2026-06-19 | Nova | R9, R12 | Formally deferred signed iOS physical-device/TestFlight parity from M5 to M6+ pending Apple Developer/App Store Connect credentials; Android remains the v1.0 release-candidate gate. |

---

## Appendix A — Active Quick Reference

| ID | Risk | P | I | Severity | Owner | Status | Deadline | Contingency |
|---|---|:-:|:-:|---|---|---|---|---|
| R1 | Scope baseline ambiguity | H | H | **Critical** | PM | Mitigating | Before M2 Sprint 1 | Pause M2; steering decision |
| R2 | Brand/data/image permission | M | H | High | PM / Business | Open | M3 midpoint | Rebrand/custom catalog; £100 legal |
| R3 | Face-aware data model wrong | M | H | High | Tech Lead | Open | M2 schema exit | v2.1 migration before public packs |
| R4 | Solver complexity/performance | M | H | High | Tech Lead | Open | M2 exit | Manual-assisted layouts |
| R5 | Catalog curation backlog | H | M | High | PM / Catalog Owner | Open | M2 exit | Small starter pack; £150 curation burst |
| R6 | Import/export data loss | M | H | High | Tech Lead | Open | Public beta | Export-only until tests green |
| R7 | Catalog refresh integrity | M | M | Moderate | Tech Lead / DevOps | Open | Remote refresh UI | Bundled catalog only |
| R8 | Inventory-entry UX friction | M | M | Moderate | Product / UX | Open | M2 UX gate | Bulk import/table mode |
| R9 | Expo platform/export constraints and deferred iOS signing | M | M | Moderate | Tech Lead | Mitigating | M2.4 / M6+ iOS parity | JSON+PNG first; defer PDF; Android v1.0 first |
| R10 | Privacy/store compliance | L | H | Moderate | PM / Tech Lead | Open | M4 store gate | Disable analytics |
| R11 | Preview/export readability | M | M | Moderate | Tech Lead / UX | Open | M2.4 | Detail cap; export-oriented layouts |
| R12 | Team capacity/tooling gaps | M | M | Moderate | PM / Tech Lead | Mitigating | M5 RC / M6+ iOS parity | Android RC first; defer signed iOS/TestFlight; £500 contractor burst |

---

## Appendix B — Retired Game-Development Watchlist

These risks were valid for a strategy-game vertical slice, but they are not active delivery risks for the tool/app baseline. They must not consume M2/M3 mitigation budget unless change control reactivates the game baseline.

| Former / Watch ID | Game Risk | Retired Rationale | Reactivation Trigger |
|---|---|---|---|
| G-W1 | Keeper class / skill tree imbalance | No Keeper classes exist in active app architecture. | Steering approves game scope. |
| G-W2 | Combat/wave AI feels unfun or unclear | No combat, waves, enemies, or defence encounters in active app architecture. | Game VS restored as milestone gate. |
| G-W3 | 12–18 minute tutorial pacing miss | App has utility workflows, not authored play sessions. | Tutorialised game slice restored. |
| G-W4 | Art/audio pipeline blocks vertical slice | App needs schematic UI/export assets, not game art/audio sign-off. | Art/audio become acceptance-gate deliverables. |
| G-W5 | Real-time renderer/particles/60 FPS combat scene | Active preview is schematic layout rendering; 60 FPS game rendering removed. | Game-like board effects become P0/P1 scope. |
| G-W6 | Economy/resource/corruption balance | No resource economy, corruption spread, or game progression in active app architecture. | Realm-builder systems restored. |
| G-W7 | Godot/Unity engine fallback confusion | Game-engine-first architecture explicitly rejected by `TECHNICAL_ARCHITECTURE_v2.0.md`. | Steering rejects Expo/TS utility-app baseline. |

---

*End of Risk Register v2.0 — active tool/app baseline.*
