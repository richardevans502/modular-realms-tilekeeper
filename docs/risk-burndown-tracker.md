# Modular Realms: TileKeeper — Risk Burndown Tracker v1.0

> **RETIRED DOCUMENT**
>
> **Status:** Superseded  
> **Superseded by:** `risk-burndown-tracker_v2.0.md`  
> **Retired date:** 2026-06-03  
> **Reason:** Follows superseded v1.0 risk register; v2.0 tracker re-aligned with tool/app scope.  
> **Action:** Do not use for active risk tracking. Refer to `risk-burndown-tracker_v2.0.md` for current tracker.

---

> **Scope Status:** Superseded by `risk-burndown-tracker_v2.0.md` (2026-06-03) for active risk tracking.
> This tracker is retained for historical context only and follows the superseded v1.0 mixed utility/game risk set.

**Status:** Superseded — historical reference only  
**Updated:** 2026-06-02  
**Owner:** PM (Nova proxy)  
**Next Update:** After first steering committee review

---

## How to Read This Tracker

- **H** = High probability (61–100%)  
- **M** = Medium probability (31–60%)  
- **L** = Low probability (0–30%)  
- **–** = Not yet assessed (milestone not reached)  
- **✓** = Risk closed (mitigation succeeded or accepted)  

**Colour coding:**
- 🔴 **H** = actively threatening; requires immediate attention
- 🟡 **M** = possible; monitor closely
- 🟢 **L** = unlikely; passive monitoring
- ⚫ **✓** = resolved

---

## Baseline Probabilities (M1 Week 0)

| ID | Risk | Baseline P | Target P at M3 Exit | Target P at M5 Exit |
|----|------|:----------:|:-------------------:|:-------------------:|
| R1 | Layout engine performance bottleneck | 🟡 M | 🟢 L | ⚫ ✓ |
| R2 | Manual tile catalog curation backlog | 🔴 H | 🟢 L | ⚫ ✓ |
| R3 | Keeper class / skill tree imbalance | 🟡 M | 🟢 L | ⚫ ✓ |
| R4 | iOS native build unverified | 🟡 M | 🟢 L | ⚫ ✓ |
| R5 | RN framework rendering limitations | 🟡 M | 🟢 L | ⚫ ✓ |
| R6 | Modular Realms brand/IP permissions | 🟢 L | 🟢 L | ⚫ ✓ |
| R7 | Beta feedback contradicts priorities | 🟡 M | 🟡 M | 🟢 L |
| R8 | Team capacity reduction | 🟡 M | 🟢 L | 🟢 L |
| R9 | Cloud services cost escalation | 🟡 M | 🟡 M | 🟢 L |
| R10 | Export format compatibility | 🟢 L | 🟢 L | ⚫ ✓ |

---

## Probability Over Time — Review Period Snapshots

### Milestone 1 (Foundation, Weeks 0–6) — Bi-weekly Reviews

| ID | Risk | W0 Baseline | W2 Check-in | W4 Check-in | W6 M1 Exit |
|----|------|:-----------:|:-----------:|:-----------:|:----------:|
| R1 | Layout engine performance bottleneck | 🟡 M | – | – | – |
| R2 | Manual tile catalog curation backlog | 🔴 H | – | – | – |
| R3 | Keeper class / skill tree imbalance | 🟡 M | – | – | – |
| R4 | iOS native build unverified | 🟡 M | – | – | – |
| R5 | RN framework rendering limitations | 🟡 M | – | – | – |
| R6 | Modular Realms brand/IP permissions | 🟢 L | – | – | – |
| R7 | Beta feedback contradicts priorities | 🟡 M | – | – | – |
| R8 | Team capacity reduction | 🟡 M | – | – | – |
| R9 | Cloud services cost escalation | 🟡 M | – | – | – |
| R10 | Export format compatibility | 🟢 L | – | – | – |

**M1 Exit Target:** All risks have assigned owners, active mitigation plans, and no new Critical risks introduced.

---

### Milestone 2 (Vertical Slice, Weeks 7–12) — Weekly Reviews

| ID | Risk | W7 | W8 | W9 | W10 | W11 | W12 M2 Exit |
|----|------|:--:|:--:|:--:|:---:|:---:|:-----------:|
| R1 | Layout engine performance bottleneck | – | – | – | – | – | – |
| R2 | Manual tile catalog curation backlog | – | – | – | – | – | – |
| R3 | Keeper class / skill tree imbalance | – | – | – | – | – | – |
| R4 | iOS native build unverified | – | – | – | – | – | – |
| R5 | RN framework rendering limitations | – | – | – | – | – | – |
| R6 | Modular Realms brand/IP permissions | – | – | – | – | – | – |
| R7 | Beta feedback contradicts priorities | – | – | – | – | – | – |
| R8 | Team capacity reduction | – | – | – | – | – | – |
| R9 | Cloud services cost escalation | – | – | – | – | – | – |
| R10 | Export format compatibility | – | – | – | – | – | – |

**M2 Exit Target:** R5 (renderer) decision made; R2 ≥ 30 tiles catalogued; R8 onboarding docs complete; R4 Apple Developer enrolled; first performance baseline for R1.

---

### Milestone 3 (Core Systems, Weeks 13–18) — Weekly Reviews

| ID | Risk | W13 | W14 | W15 | W16 | W17 | W18 M3 Exit |
|----|------|:---:|:---:|:---:|:---:|:---:|:-----------:|
| R1 | Layout engine performance bottleneck | – | – | – | – | – | – |
| R2 | Manual tile catalog curation backlog | – | – | – | – | – | – |
| R3 | Keeper class / skill tree imbalance | – | – | – | – | – | – |
| R4 | iOS native build unverified | – | – | – | – | – | – |
| R5 | RN framework rendering limitations | – | – | – | – | – | – |
| R6 | Modular Realms brand/IP permissions | – | – | – | – | – | – |
| R7 | Beta feedback contradicts priorities | – | – | – | – | – | – |
| R8 | Team capacity reduction | – | – | – | – | – | – |
| R9 | Cloud services cost escalation | – | – | – | – | – | – |
| R10 | Export format compatibility | – | – | – | – | – | – |

**M3 Exit Target:** R1 ≤ 500 ms on target device; R2 ≥ 40 tiles; R3 two classes balanced; R4 TestFlight build generated; R5 60 FPS or accepted 30 FPS; R6 outreach resolved or rebrand complete; R10 schema frozen and migration tested.

---

### Milestone 4 (Polish / Soft Launch, Weeks 19–24) — Weekly Reviews

| ID | Risk | W19 | W20 | W21 | W22 | W23 | W24 M4 Exit |
|----|------|:---:|:---:|:---:|:---:|:---:|:-----------:|
| R1 | Layout engine performance bottleneck | – | – | – | – | – | – |
| R2 | Manual tile catalog curation backlog | – | – | – | – | – | – |
| R3 | Keeper class / skill tree imbalance | – | – | – | – | – | – |
| R4 | iOS native build unverified | – | – | – | – | – | – |
| R5 | RN framework rendering limitations | – | – | – | – | – | – |
| R6 | Modular Realms brand/IP permissions | – | – | – | – | – | – |
| R7 | Beta feedback contradicts priorities | – | – | – | – | – | – |
| R8 | Team capacity reduction | – | – | – | – | – | – |
| R9 | Cloud services cost escalation | – | – | – | – | – | – |
| R10 | Export format compatibility | – | – | – | – | – | – |

**M4 Exit Target:** Closed beta NPS ≥ 40; R7 feedback triaged and scope protected; R9 costs within £25/month; no Critical risks remaining.

---

### Milestone 5 (Launch / Post-Launch, Weeks 25–30+) — Bi-weekly Reviews

| ID | Risk | W25 | W27 | W29 | W30+ M5 Exit |
|----|------|:---:|:---:|:---:|:------------:|
| R1 | Layout engine performance bottleneck | – | – | – | – |
| R2 | Manual tile catalog curation backlog | – | – | – | – |
| R3 | Keeper class / skill tree imbalance | – | – | – | – |
| R4 | iOS native build unverified | – | – | – | – |
| R5 | RN framework rendering limitations | – | – | – | – |
| R6 | Modular Realms brand/IP permissions | – | – | – | – |
| R7 | Beta feedback contradicts priorities | – | – | – | – |
| R8 | Team capacity reduction | – | – | – | – |
| R9 | Cloud services cost escalation | – | – | – | – |
| R10 | Export format compatibility | – | – | – | – |

**M5 Exit Target:** App Store live; R1–R6 closed or accepted; R7–R10 at Low or accepted; contingency spend logged; lessons learned captured.

---

## Cumulative Risk Profile Over Time

This section tracks the total "risk mass" of the project — the count of High-probability risks should decrease as mitigations take effect.

| Milestone Phase | High (🔴) | Medium (🟡) | Low (🟢) | Closed (⚫) | Total Active |
|-----------------|:---------:|:-----------:|:--------:|:-----------:|:------------:|
| **M1 W0 (Baseline)** | 1 | 7 | 2 | 0 | 10 |
| **M1 W6** | – | – | – | – | – |
| **M2 W6** | – | – | – | – | – |
| **M3 W6** | – | – | – | – | – |
| **M4 W6** | – | – | – | – | – |
| **M5 Exit** | – | – | – | – | – |

**Target trajectory:**
- M1 Exit: 0 Critical, ≤ 4 High, ≤ 5 Medium, ≥ 1 Low/Closed
- M2 Exit: 0 Critical, ≤ 2 High, ≤ 5 Medium, ≥ 3 Low/Closed
- M3 Exit: 0 Critical, 0 High, ≤ 4 Medium, ≥ 6 Low/Closed
- M4 Exit: 0 Critical, 0 High, ≤ 2 Medium, ≥ 8 Low/Closed
- M5 Exit: 0 Critical, 0 High, ≤ 1 Medium, ≥ 9 Low/Closed

---

## Update Instructions

1. **After each review meeting**, update the corresponding week column in the milestone tables.
2. **Use the same H/M/L scale** as the Risk Register (not exact percentages).
3. **When a risk is closed**, mark all future columns as ✓ and add closure date to the Review History in the Risk Register.
4. **If a risk's probability increases**, add a comment note explaining why (e.g., "Trigger fired: renderer prototype failed Skia spike").
5. **If new risks are added**, insert rows with the next available ID (R11, R12...) and backfill baseline as the first assessed value.
6. **Update the Cumulative Risk Profile** to visualise overall project health trend.

---

*Tracker version 1.0 — Modular Realms: TileKeeper Project*
