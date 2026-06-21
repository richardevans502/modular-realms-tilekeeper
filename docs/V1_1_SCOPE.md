# Modular Realms: TileKeeper — v1.1 Feature Scope

**Status:** Draft for Rich's approval
**Date:** 2026-06-19
**Author:** Labby, Lady of the Silver Castle
**Source:** Known issues, deferred items, and development gaps from v1.0 (M5 sign-off)

---

## Preamble

The task body asks for v1.1 scope based on "real utility usage." As of this writing, **no real usage data exists** — the v1.0 release candidate has not yet been built, no public beta has been distributed, and GitHub Issues shows zero submissions. The v1.0 RC build (M5-BUILD-2) is itself gated on Rich's sign-off.

Therefore, this v1.1 scope is derived from:

1. **Known issues** documented in the M5 sign-off and project status
2. **Deferred items** formally pushed from M5 to M6+
3. **Review-required items** awaiting human approval
4. **Pre-existing gaps** identified during M2–M5 development
5. **M6 plan deliverables** from the milestone plan

Once real usage data arrives (post-v1.0 release), this scope should be revisited and reprioritised.

---

## Priority Triage

### P0 — Crash / Data Loss

| # | Item | Source | Effort | Notes |
|---|------|--------|--------|-------|
| P0-1 | **Merge master → gh-pages** | Known issue #3 | Small | Master is 10 commits behind gh-pages. The working tree has 47 modified files (986 insertions, 156 deletions). Must be resolved before any RC build. |
| P0-2 | **v1.0 Release Candidate Build** (M5-BUILD-2) | Deferred from M5 | Medium | Gated on Rich's sign-off and the merge above. Android APK for store submission. |
| P0-3 | **iOS Build Parity & Signing** (M5-BUILD-1) | Deferred to M6+ | Large | Blocked on Apple Developer credentials. If credentials become available, this becomes P0. |

### P1 — Major Usability

| # | Item | Source | Effort | Notes |
|---|------|--------|--------|-------|
| P1-1 | **Inventory simplification review** (TK-M5-INVENTORY) | Review-required | Small | Code committed (commit `4f04f19`), 130 tests pass. Needs human review to approve the simplified owned-only library model. |
| P1-2 | **iOS deferral documentation review** (TK-M5-DEFER) | Review-required | Small | Docs updated, M5 now Android-first. Needs human sign-off. |
| P1-3 | **Catalog coverage expansion** | M6 plan / M5 gap | Medium | Current seed catalog has 36 fixtures. Real users will need broader coverage. Add high-frequency tiles from Modular Realms product line. |
| P1-4 | **Catalog maintenance workflow** | M6-T1 | Medium | Repeatable process for adding new tile packs, sources, assets, checksums, and schema migrations without app code changes. |

### P2 — Nice-to-Have

| # | Item | Source | Effort | Notes |
|---|------|--------|--------|-------|
| P2-1 | **Support & diagnostics loop** | M6-T2 | Medium | Import/export troubleshooting, anonymised fixture reproduction, known-issues tracker. |
| P2-2 | **Expo SDK 56 migration** (M7-T1) | Deferred from M6 decision | Large | Would resolve the 18 moderate npm audit vulnerabilities. Zero credible attack surface on offline-first app, but good hygiene. |
| P2-3 | **Physical-device screenshot recapture** | Deferred from M5 | Small | Current screenshots are framed web captures. Rich approved them as-is, but physical-device captures would be better for store listing. |
| P2-4 | **External crash reporter (Sentry)** | Deferred from M5 | Medium | Local-only diagnostics chosen for v1.0. Sentry or similar would give better insight into real-world crashes. |
| P2-5 | **Expo Doctor warning resolution** | Known issue #1 | Small | Non-CNG native-folder warning. Does not block builds but should be cleaned up. |

### P3 — Future / Deferred

| # | Item | Source | Effort | Notes |
|---|------|--------|--------|-------|
| P3-1 | **Roadmap v2.1 decision** | M6-T6 | Research | Tablet optimisation, web companion, cloud sync, advanced solver, official catalog partnership, or community contributions. Needs real usage data to decide. |
| P3-2 | **Tablet optimisation** | M6-T6 option | Large | iPad/Android tablet UI improvements. |
| P3-3 | **Web companion app** | M6-T6 option | Large | Browser-based layout viewer/planner. |
| P3-4 | **Cloud sync** | M6-T6 option | Large | Optional encrypted backup to Google Drive/Dropbox/OneDrive. |
| P3-5 | **Advanced solver constraints** | M6-T6 option | Medium | Room shapes, symmetry, themed layouts. |
| P3-6 | **Official catalog partnership** | M6-T6 option | Unknown | Requires Modular Realms permission. |
| P3-7 | **Community catalog contributions** | M6-T6 option | Medium | User-submitted tile definitions. |

---

## Recommended v1.1 Scope

Given the absence of real usage data, I recommend a **conservative v1.1** focused on:

### Phase 1 — Ship v1.0 First (Gate)
1. Rich approves M5 sign-off
2. Merge master → gh-pages
3. Build v1.0 RC (Android APK)
4. Submit to Google Play Store

### Phase 2 — v1.1 (Immediate Post-Launch)
1. **P1-1** — Review and merge inventory simplification
2. **P1-2** — Review and approve iOS deferral docs
3. **P1-3** — Expand catalog coverage (target: 60–80 fixtures)
4. **P1-4** — Build catalog maintenance workflow
5. **P2-1** — Build support & diagnostics loop
6. **P2-5** — Clean up Expo Doctor warning

### Phase 3 — v1.2 (After First User Feedback)
1. Re-prioritise based on real usage data
2. **P2-2** — SDK 56 migration (if audit concerns grow)
3. **P2-4** — External crash reporter (if crash volume warrants)
4. Begin **P3** research for roadmap v2.1

### Conditional Items
- **P0-3** (iOS build parity) — If Apple Developer credentials become available, promote to P0 immediately
- **P3-1 through P3-7** — Deferred until at least 4–6 weeks of real usage data collected

---

## Open Questions for Rich

1. **Sign-off on M5** — Can you approve the M5 sign-off report so we can proceed to v1.0 RC build?
2. **v1.1 scope** — Does the proposed scope above align with your priorities, or would you like to adjust?
3. **Apple Developer credentials** — Any progress on obtaining these? This is the single biggest blocker for iOS.
4. **Beta distribution** — Would you like to do a small internal beta (via EAS/TestFlight for Android) before public store submission, to gather the "real usage data" this task is asking for?
5. **Inventory simplification** — The code is committed and tests pass. Can you review and approve the simplified owned-only library model?

---

*This document is a living draft. Once real usage data exists, it should be revisited and reprioritised.*
