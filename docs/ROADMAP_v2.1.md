# Modular Realms: TileKeeper — Roadmap v2.1

**Version:** 2.1 (provisional)
**Date:** 2026-09-12
**Author:** Labby, Lady of the Silver Castle
**Status:** ⚠️ PROVISIONAL — awaiting Rich's approval and post-launch usage data
**Supersedes:** the roadmap direction outlined in `docs/milestone_plan-HeliosCore.md` § M6
**Research basis:** `docs/ROADMAP_v2.1_RESEARCH_REPORT.md`

---

## 1. Purpose

Choose the next major product expansion direction for after v1.0 ships, from six candidates, and define the *observable triggers* that will confirm or overturn the choice once real usage data exists.

**Critical framing (unchanged from research):** no user data exists yet. This roadmap sets the *planning* direction and the *decision gates*. The *committed* build direction is finalised only after v1.0 launch data.

---

## 2. The Six Options at a Glance

| # | Option | Effort | Offline-safe | Data-gated? | Provisional stance |
|--:|---|---|---|---:|---|
| 1 | Tablet optimisation | Medium | ✅ | **Yes** | Dormant — wait for device mix |
| 2 | **Web companion app** | Med–Large | ✅ | No | 🟢 **PREFERRED** |
| 3 | Cloud sync (Google Drive/Dropbox/OneDrive) | Large | ⚠️ opt-in | **Yes** | Dormant — wait for backup demand |
| 4 | **Advanced solver constraints** | Medium | ✅ | No | 🟢 **CO-PRIORITY** |
| 5 | Official catalog partnership | Unknown | ✅ | Partially | Dormant — wait for active user base |
| 6 | Community catalog contributions | Med–Large | ✅ | **Yes** | Dormant — wait for contribution appetite |

---

## 3. Provisional v2.1 Direction (Rich to approve)

> **"Web companion app + deeper solver constraints, gated on v1.0 launch data."**

Two strands:

- **Strand A — Web companion (lead).** Convert the proven Expo-web artifact into a genuine browser layout viewer/planner that reuses the pure-TypeScript solver and catalog pipeline. Local-first, no account, works from a URL. This is the cheapest second surface and least hostage to unknown usage.
- **Strand B — Advanced solver constraints (co-priority).** Extend `LayoutGoal` with room-shape, symmetry, and themed-layout constraints. Determinism preserved via solver versioning. Pure product-value depth, no external dependency.

Both are **safe if we're wrong about the user base**: web is an already-proven export surface; solver depth never reduces value.

---

## 4. Decision Gates — What Will Confirm or Overturn the Direction

Final direction is confirmed (or changed) at the **v2.1 confirmation gate**, ~4–6 weeks after v1.0 public release, based on:

| Data source | What we look for | Gates / triggers |
|---|---|---|
| Store device split | Share of tablet (iPad/Android) sessions | ≥ **15% tablet** → promote Option 1 above Strand A |
| Store / support issues | Mentions of "web", "desktop", "laptop", "browser", "print from computer" | ≥ **5 such mentions** → confirm Strand A as lead |
| Store / support issues | Mentions of "lose my data", "back up", "another device" | ≥ **3** → promote Option 3 (cloud sync) |
| Layout goal feature usage | Requests for rooms / symmetry / themes in feedback or diagnostics | Any recurring theme request → confirm Strand B scope |
| Catalog coverage complaints | "can't find tile X", "add set Y" | ≥ **3** → promote Option 6 (community) |
| Partnership interest | Modular Realms reach-out, or proof of **solid active user base** to present | Active users + willingness → open Option 5 |

**Rule:** an option dormant now is re-evaluated only when its trigger fires. We do not build data-gated options speculatively.

---

## 5. Immediate Next Step (Pre-Launch, No Data Needed)

The only prerequisite for every option is that **v1.0 actually ships and users have it in hand**. Therefore the immediate priority sequence is unchanged from the M6/M5 plan:

1. Merge / commit the working tree (master → gh-pages reconciliation, known issue #3).
2. Build the **v1.0 Release Candidate** (Android, M5-BUILD-2).
3. Submit to Google Play Store.
4. Begin collecting the data that feeds the §4 gates.

Until this ships, no v2.1 build work should start — consistent with Rich's post-launch deferral authority on v1.1 scope.

---

## 6. Provisional Sequencing (Post-Confirmation, ~v1.2)

Once the confirmation gate passes (or a trigger fires), the likely v1.2 sequence:

| Phase | Work | Trigger |
|---|---|---|
| P0 | v1.0 release + data collection | — |
| P1 | Confirm gates (§4) | 4–6 wks of usage data |
| P2 | **Strand A** web companion OR Option 1/3 if trigger fires | Gate outcome |
| P2 | **Strand B** solver constraints | Gate outcome |
| P3 | Option 5/6 only if their trigger fires | — |

Sequencing is kept flexible so the gates, not this table, drive the build.

---

## 7. Open Questions for Rich

1. **Approve the provisional direction?** (Web companion + solver constraints as the planning lead.)
2. **Approve waiting for usage data before committing builds?** (Recommended — matches the deferral already applied to v1.1.)
3. **Can we proceed on the v1.0 RC build** (merge + build + submit) so the data gates can start collecting?
4. **Any strategic steer** on tablet vs. web as a *known* preference, if you have one independent of usage data?

---

## 8. Document Control

| Version | Date | Author | Change |
|---|---|---|---|
| 2.0 | 2026-06-19 | Nova | Baseline M6 roadmap direction (deferred decision) |
| 2.1 | 2026-09-12 | Labby | Engineering-led evaluation of six options; provisional recommendation (web companion + solver constraints); decision-gate framework; dormant options with triggers |

---

*End of Roadmap v2.1 (provisional)*
