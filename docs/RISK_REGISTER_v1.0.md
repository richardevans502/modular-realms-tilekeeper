# Modular Realms: TileKeeper — Risk Register v1.0

> **RETIRED DOCUMENT**
>
> **Status:** Superseded  
> **Superseded by:** `RISK_REGISTER_v2.0.md`  
> **Retired date:** 2026-06-03  
> **Reason:** Re-assessed against v2.0 tool/app scope; mixed utility/game risks no longer valid for active planning.  
> **Action:** Do not use for active delivery decisions. Refer to `RISK_REGISTER_v2.0.md` for current risk authority.

---

> **Scope Status:** Superseded by `RISK_REGISTER_v2.0.md` (2026-06-03) for active delivery decisions.
> This document is retained for historical context only. It mixed utility/app and game-development risks before the v2.0 tool/app baseline re-assessment.

**Status:** Superseded — historical reference only  
**Version:** 1.0  
**Date:** 2026-06-02  
**Owner:** Project PM (Nova proxy)  
**Review Cadence:** Weekly during Milestones 2–4; bi-weekly during M1, M5, and post-launch

**Related Documents:**
- [Steering Committee Review Minutes Template](steering-committee-minutes-template.md)
- [Risk Burndown Tracker](risk-burndown-tracker.md)
- [GDD v1.0](GDD.md) | [VS Scope](VS_SCOPE.md) | [Technical Architecture](TECHNICAL_ARCHITECTURE.md) | [Art Bible](art-bible-ui-style-guide.md)

---

## 1. Risk Scoring Methodology

### Probability Scale

| Rating | Likelihood | Quantitative Range |
|--------|-----------:|-------------------:|
| **Low (L)**    | Unlikely in normal conditions; would surprise the team | 0–30% |
| **Medium (M)** | Possible; has precedent in comparable projects | 31–60% |
| **High (H)**   | Likely if no mitigation applied; seen before | 61–100% |

### Impact Scale

| Rating | Effect on Project | Examples |
|--------|-------------------|----------|
| **Low (L)**    | Minor schedule/cost variance; absorbed within buffer | < 1 week slip; < £500 unplanned spend |
| **Medium (M)** | Measurable delay or quality degradation; requires replanning | 1–3 week slip; £500–£2,000; feature scope reduction |
| **High (H)**   | Threatens milestone success, team viability, or commercial outcome | > 3 week slip; > £2,000; major feature cut or launch delay |

### Risk Severity Matrix

| Probability \ Impact | Low (L) | Medium (M) | High (H) |
|---------------------:|:-------:|:----------:|:--------:|
| **High (H)**         | Moderate | High | **Critical** |
| **Medium (M)**       | Low | Moderate | High |
| **Low (L)**          | Low | Low | Moderate |

### Severity Action Thresholds

- **Critical:** Immediate escalation; dedicated owner, daily stand-up coverage, contingency invoked if available
- **High:** Tracked at every review; weekly status to PM; mitigation plan must be active within 48 hours of identification
- **Moderate:** Tracked in register; reviewed at scheduled cadence; owner confirms progress
- **Low:** Monitored passively; re-evaluated if any triggers fire

---

## 2. Top 10 Project Risks

### R1 — Layout Engine Performance Bottleneck on Low-End Devices

| Field | Value |
|-------|-------|
| **Description** | The deterministic layout generation algorithm (heuristic + combinatorial search across tile adjacency rules) may exceed the 500 ms budget on mid-range Android devices when inventory exceeds ~50 tiles or multi-biome constraints are applied. Corruption spread simulation and biome blending matrix calculations add additional CPU load. |
| **Category** | Technical — Performance |
| **Probability** | **Medium (M)** |
| **Impact** | **High (H)** |
| **Severity** | **High** |
| **Triggers** | Layout generation > 1 s on Android test device (M3); frame drop below 30 FPS during layout preview; user feedback citing sluggishness |
| **Current Status** | Open — no performance baseline exists yet; M2 will produce first measurements |
| **Mitigation Owner** | Tech Lead |
| **Mitigation Actions** | 1. Cap search depth at bounded N tiles with graceful "approximate" mode (M2). 2. Pre-compute compatibility lookup tables by tile-type + rotation (M2). 3. Profile on representative Android 10 device before M3 exit. 4. Fall back to rule-based greedy placement if heuristic search times out (M3). 5. Move layout generation to a background thread / Worklet to avoid main-thread stall (M3). |
| **Contingency** | If engine cannot meet 500 ms target, defer "themed generation" (dungeon/city/wilderness variants) to M4; ship with greedy-only placement for M3. |
| **Deadline** | Performance gate: M3 Exit |
| **Review Frequency** | Weekly from M2 Week 1 |

---

### R2 — Manual Tile Catalog Curation Outpaces Development Schedule

| Field | Value |
|-------|-------|
| **Description** | The complete Modular Realms tile catalog (official sets across multiple biomes) must be manually curated into structured JSON. Based on similar curation tasks, this could take 2–4 hours per unique tile type including research, dimension verification, compatibility mapping, and source referencing. With potentially 100+ tiles, this is a long critical path. |
| **Category** | Content — Scope / Resources |
| **Probability** | **High (H)** |
| **Impact** | **High (H)** |
| **Severity** | **Critical** |
| **Triggers** | Fewer than 30 tiles catalogued by M2 Week 6; curation backlog trending > 80 tiles remaining at M3 midpoint; no community volunteers recruited |
| **Current Status** | Open — 10 representative tiles defined for VS; curation pipeline exists in JSON schema only |
| **Mitigation Owner** | PM |
| **Mitigation Actions** | 1. Define "minimum viable catalog" at 40 tiles covering Temperate + Cave biomes for M3 launch (M2 exit gate). 2. Recruit 2–3 community volunteers from Modular Realms Discord/forum with style guide and validation checklist (M2). 3. Batch-create tile templates using spreadsheet-to-JSON pipeline (M2 Week 3). 4. Accept community-sourced tiles under review process with attribution (ongoing). 5. Defer third-party / legacy tile support to M4. |
| **Contingency** | If catalog < 60 tiles by M3 Week 4, reduce MVP scope to Temperate-only; move Cave/Desert/Ice to M4 content update. Budget £150 for temporary contractor curation burst if volunteers insufficient. |
| **Deadline** | Catalog gate: M3 Exit (≥80% target) |
| **Review Frequency** | Weekly from M2 Week 1 |

---

### R3 — Keeper Class / Skill Tree Balance Disrupts Vertical Slice Playability

| Field | Value |
|-------|-------|
| **Description** | The GDD defines 6 Keeper classes (Forager, Warden, Architect, Weaver, Cartographer, Steward) with unique skill trees, equipment durability, and progression curves. If class abilities or tile-placement bonuses are unbalanced, the vertical slice demo will feel broken regardless of UI polish, undermining stakeholder confidence. |
| **Category** | Design — Game balance |
| **Probability** | **Medium (M)** |
| **Impact** | **High (H)** |
| **Severity** | **High** |
| **Triggers** | Playtest sessions show > 50% players gravitating to a single class; stakeholder feedback cites "no reason to play X"; XP curve deviates > 20% from target milestones |
| **Current Status** | Open — balance parameters in GDD are theoretical; first playtest will be M2 |
| **Mitigation Owner** | Design Lead (or PM if unfilled) |
| **Mitigation Actions** | 1. Implement only Forager + Warden for M2 (reduce blast radius); validate core loop before adding remaining 4 classes (M2). 2. Create reference spreadsheet with XP-to-level, yield-scaling, and corruption-probability targets (M2). 3. Run at least two internal playtest sessions before M2 exit with 3+ participants (M2). 4. Define "acceptable imbalance" tolerance: no class > 2× more efficient than any other at same investment level (M3). |
| **Contingency** | If balance cannot be achieved by M3 exit, ship VS with Forager/Warden only; gate remaining classes behind " coming soon" with cosmetic unlock preview. |
| **Deadline** | Balance gate: M3 Exit |
| **Review Frequency** | Bi-weekly during M2; weekly during M3 |

---

### R4 — iOS Native Build Pipeline Unverified Due to Missing Apple Account

| Field | Value |
|-------|-------|
| **Description** | The project targets iOS 15+ but no Apple Developer Program account is enrolled, and no macOS runner or EAS paid tier is configured. iOS simulator builds pass in CI, but App Store/TestFlight packaging, code signing, and entitlement verification remain unproven. This is a hard blocker for M4 soft launch on iOS. |
| **Category** | Technical — Platform / Build |
| **Probability** | **Medium (M)** |
| **Impact** | **High (H)** |
| **Severity** | **High** |
| **Triggers** | Apple Developer enrollment still pending at M3 Week 6; EAS iOS build fails with signing error; provisioning profile mismatch |
| **Current Status** | Open — architecture document notes this as deferred to "when Apple account is available" |
| **Mitigation Owner** | Tech Lead |
| **Mitigation Actions** | 1. Enroll Apple Developer Program (£79/year) in M1 budget (M1 Week 6). 2. Verify EAS iOS simulator build in CI using Expo's free macOS builder before M2 exit (M2). 3. Generate and archive first TestFlight build as M3 deliverable, even if not submitted (M3). 4. Maintain Android as primary test platform for M2-M3 to prevent iOS dependency from blocking vertical slice demo. |
| **Contingency** | If iOS builds remain blocked at M4, soft-launch Android-only with iOS promised within 4 weeks; accept NPS gap on Android data only. |
| **Deadline** | First TestFlight build: M3 Exit |
| **Review Frequency** | Bi-weekly during M1-M2; weekly during M3 |

---

### R5 — Expo / React Native Framework Limitations for Custom Rendering

| Field | Value |
|-------|-------|
| **Description** | The custom layout engine must render schematic tile placements (hex/square grids, biome overlays, adjacency indicators, corruption visualisation). React Native's built-in View-based rendering may not achieve 60 FPS for > 150 placements or complex biome blending. A jump to react-native-skia or a WebView canvas adds dependency risk. |
| **Category** | Technical — Framework / Rendering |
| **Probability** | **Medium (M)** |
| **Impact** | **Medium (M)** |
| **Severity** | **Moderate** |
| **Triggers** | Pan/zoom frame times > 16 ms on iPhone 8 / mid-range Android; UI thread blocked > 50 ms during layout preview; need to re-engineer renderer in M3 |
| **Current Status** | Open — architecture recommends View-based first, with Skia or custom native module as fallback if budget exceeded |
| **Mitigation Owner** | Tech Lead |
| **Mitigation Actions** | 1. Prototype renderer with native RN Views limited to 50 placements + simple polygons; measure frame budget (M2 Week 2). 2. Evaluate react-native-skia as parallel spike during M2; accept if prototype shows > 2× improvement (M2). 3. Implement tile culling and level-of-detail: small tiles shown as coloured rectangles, detail on zoom (M3). 4. Defer animated transitions and particle effects to M4. |
| **Contingency** | If neither View nor Skia meets 60 FPS, accept 30 FPS cap with "high performance" device flag for M3; investigate native module (Swift/Kotlin) for M4. |
| **Deadline** | Renderer decision: M2 Exit |
| **Review Frequency** | Weekly during M2-M3 |

---

### R6 — Modular Realms Brand / IP Permissions for Tile Catalog

| Field | Value |
|-------|-------|
| **Description** | TileKeeper's commercial viability depends on association with Modular Realms. Use of product images, set names, and dimensional data for the catalog requires either a formal relationship or a clear fair-use editorial position. If the Modular Realms brand owner objects, the app identity and marketing position may need significant rework. |
| **Category** | Legal / Business |
| **Probability** | **Low (L)** |
| **Impact** | **High (H)** |
| **Severity** | **Moderate** |
| **Triggers** | Cease-and-desist or takedown request; no response to outreach after 4 weeks; brand owner launches competing app |
| **Current Status** | Open — no outreach initiated yet; architecture document flags this as a later-milestone unknown |
| **Mitigation Owner** | PM / Business Lead |
| **Mitigation Actions** | 1. Draft partnership / licensing approach email by M2 Week 2; send to Modular Realms contact (M2). 2. Prepare fallback branding: generic "Modular Tile Planner" with user-imported catalog (M2). 3. Ensure all catalog content is user-enterable/customisable to avoid hard dependency on official data (M2 architecture already supports this). 4. Document source references and fair-use rationale for every tile attribution (ongoing). |
| **Contingency** | If brand relationship fails, rebrand as independent "Tile Planner" app with user-driven catalog; absorb 2-week delay for store metadata + UI copy changes. Budget £100 for trademark check / legal consultation if needed. |
| **Deadline** | First outreach: M2 Week 2; resolution target: M3 Week 4 |
| **Review Frequency** | Bi-weekly during M2-M3 |

---

### R7 — Closed-Beta Feedback Contradicts PRD/GDD Priorities

| Field | Value |
|-------|-------|
| **Description** | The M4 closed-beta cohort (Modular Realms community) may request features or UX changes that conflict with the GDD's phased scope (e.g., demanding cloud sync, multiplayer, or 3D preview before core loop is solid). Unclear prioritisation could destabilise M4-M5 planning. |
| **Category** | Product / Scope |
| **Probability** | **Medium (M)** |
| **Impact** | **Medium (M)** |
| **Severity** | **Moderate** |
| **Triggers** | > 30% of beta feedback requests fall outside M5 scope; NPS comments cite missing features explicitly deferred to roadmap v2; stakeholder pressure to absorb scope |
| **Current Status** | Open — beta not yet launched |
| **Mitigation Owner** | PM |
| **Mitigation Actions** | 1. Prior to M4 beta invite, publish "What's in / What's out" page linked from beta onboarding (M4 Week 1). 2. Tag all analytics and feedback with feature-area buckets; monthly report showing request volume vs. roadmap alignment (M4). 3. Maintain a public Trello/GitHub Projects "post-launch wishlist" to acknowledge but defer requests (M4). 4. Define "scope change" threshold in CCB process: any request > 2 dev-weeks requires formal CCB review. |
| **Contingency** | If overwhelming feedback demands a scope pivot, invoke Change Control Board; evaluate against M5 buffer weeks. Accept delaying v1.1 to M5+4 weeks if the pivot is commercially justified. |
| **Deadline** | Beta scope communication: M4 Week 1 |
| **Review Frequency** | Weekly during M4; bi-weekly during M5 |

---

### R8 — Team Capacity Reduction (Illness, Competing Projects, Attrition)

| Field | Value |
|-------|-------|
| **Description** | The project assumes one full-time engineer + one part-time designer for M1-M2, scaling to two engineers for M3-M5. If capacity drops below this (illness, competing priorities, or departure), schedule milestones will compress dangerously. |
| **Category** | Resource / Schedule |
| **Probability** | **Medium (M)** |
| **Impact** | **Medium (M)** |
| **Severity** | **Moderate** |
| **Triggers** | Engineer unavailability > 2 weeks during any milestone; designer cannot deliver Art Bible draft by M1 exit; second engineer not onboarded by M3 Week 2 |
| **Current Status** | Open — team size is an assumption in milestone plan |
| **Mitigation Owner** | PM |
| **Mitigation Actions** | 1. Build 1 buffer week into every milestone schedule (already in plan). 2. Maintain "deferrable feature list" per milestone so scope can flex down without breaking critical path (ongoing). 3. Document architecture and onboarding guide so a replacement engineer can be productive within 3 days (M2). 4. Cross-train on CI pipeline and build commands so both engineers can cut releases (M3). |
| **Contingency** | If capacity drops below 0.5 FTE engineer for > 2 weeks, push current milestone exit by equivalent duration. Maintain list of contractor/freelance contacts (React Native / UI design) with day-rate agreements for burst capacity (budget £500–£1,000 for up to 2-week contractor engagement). |
| **Deadline** | Onboarding docs: M2 Exit |
| **Review Frequency** | Weekly during all milestones |

---

### R9 — Analytics / Entitlements / Cloud Services Cost Escalation

| Field | Value |
|-------|-------|
| **Description** | The architecture plans for Cloudflare Workers, optional Sentry, and PostHog. During beta and post-launch, traffic could exceed free-tier limits, or DDoS/abuse of analytics endpoints could trigger overage charges. RevenueCat is revenue-share based but adds a vendor dependency. |
| **Category** | Financial / Operational |
| **Probability** | **Medium (M)** |
| **Impact** | **Medium (M)** |
| **Severity** | **Moderate** |
| **Triggers** | Cloudflare Workers egress exceeds 100K requests/day; Sentry error volume exceeds 5K events/month; RevenueCat fee structure changes post-integration |
| **Current Status** | Open — cost projection is £0–£5/month foundation, £7–£75/month early production |
| **Mitigation Owner** | Tech Lead (technical); PM (financial) |
| **Mitigation Actions** | 1. Implement strict rate-limiting and payload caps on all cloud endpoints before analytics go live (M3). 2. Use Cloudflare Analytics Engine (or disabled analytics) as zero-cost default; enable PostHog only if free-tier capacity confirmed (M3). 3. Monitor Cloudflare dashboard weekly during beta; set billing alerts at £10 and £25 thresholds (M4). 4. Evaluate open-source Sentry alternative (e.g., GlitchTip) if volume outpaces free tier (M5). |
| **Contingency** | Budget contingency of £200 for first 6 months of services overage. If costs exceed £100/month before revenue, disable non-essential analytics and rely on store-reported crash rates only. |
| **Deadline** | Rate limiting active: M3 Exit |
| **Review Frequency** | Monthly during M4-M5 |

---

### R10 — Data Export Format Compatibility and User Lock-in Concerns

| Field | Value |
|-------|-------|
| **Description** | TileKeeper commits to local-first operation with JSON export/import. If the format is unstable, undocumented, or incompatible with future versions, users may lose data or avoid adoption. This is both a user-trust risk and a support burden. |
| **Category** | Technical / User Trust |
| **Probability** | **Low (L)** |
| **Impact** | **Medium (M)** |
| **Severity** | **Low** |
| **Triggers** | Schema version mismatch on import > 3 times in beta; user feedback citing "lost my catalog"; App Store review mentions data loss |
| **Current Status** | Open — backup envelope format defined in architecture; migration strategy outlined but not implemented |
| **Mitigation Owner** | Tech Lead |
| **Mitigation Actions** | 1. Freeze JSON export schema at v1 by M3 exit; document field definitions in public-facing README (M3). 2. Implement automated migration tests: export v1 -> app update -> import -> assert equality (M3). 3. Include schema version detection in import flow; reject incompatible versions with clear message + support link (M3). 4. Publish schema spec as open source if community requests interoperability (M5). |
| **Contingency** | If schema instability emerges, build conversion tool for every supported version pair; limit active supported versions to current + previous + original. |
| **Deadline** | Schema freeze: M3 Exit |
| **Review Frequency** | Bi-weekly during M3-M4 |

---

## 3. Summary Risk Severity Distribution

| Severity | Count | Risk IDs |
|----------|------:|----------|
| **Critical** | 1 | R2 |
| **High** | 4 | R1, R3, R4, R5 |
| **Moderate** | 4 | R6, R7, R8, R9 |
| **Low** | 1 | R10 |
| **Total** | **10** | — |

**Steering Committee Attention:**
- **Immediate (M1-M2):** R2 (catalog curation), R4 (iOS build), R5 (renderer decision)
- **Mid-term (M2-M3):** R1 (performance), R3 (balance), R6 (brand permissions), R8 (team capacity)
- **Late (M4-M5):** R7 (beta feedback), R9 (costs), R10 (data compatibility)

---

## 4. Contingency Budget Recommendations

| Risk Area | Contingency Allocation | Trigger Condition | Release Authority |
|-----------|------------------------|-------------------|-------------------|
| Catalog curation burst (contractors/volunteer incentives) | £150 | < 60 tiles curated by M3 Week 4 | PM |
| iOS build / Apple Developer overhead | £100 | Apple enrollment delayed > 2 weeks beyond M2 | PM |
| Team capacity (contractor burst) | £500 | Engineer unavailability > 2 weeks | PM |
| Services overage (Cloudflare, Sentry, etc.) | £200 | Monthly bill exceeds £25 before revenue | Tech Lead + PM |
| Legal consultation (trademark, brand) | £100 | Cease-and-desist or formal objection received | PM + Business Lead |
| Rebranding / store metadata rework | £50 (time cost) | Modular Realms relationship fails | PM |
| Performance optimisation tools/devices | £100 | Need additional test devices or profiling tools | Tech Lead |
| **Total Recommended Contingency** | **£1,200** | | |

**Budget Governance:**
- All contingency spends > £100 require verbal approval from PM and Tech Lead.
- Contingency spend is logged against the triggering risk ID in the register.
- Unused contingency at M5 exit becomes "post-launch buffer" for v1.1 polish.

---

## 5. Risk Review Cadence

| Milestone Phase | Cadence | Review Focus |
|-------------------|---------|--------------|
| **M1 (Foundation)** | Bi-weekly | Register completeness, owner assignments, initial trigger monitoring |
| **M2 (Vertical Slice)** | **Weekly** | Performance baseline, renderer prototype, catalog rate, iOS pipeline |
| **M3 (Core Systems)** | **Weekly** | Catalog completeness, balance, dual-OS builds, schema freeze, cloud costs |
| **M4 (Polish / Soft Launch)** | **Weekly** | Beta feedback triage, crash rates, NPS, store readiness, cost monitoring |
| **M5 (Launch / Post-Launch)** | Bi-weekly | Crash rate trend, v1.1 scope, roadmap v2, cost stabilisation |
| **Post-M5 (Ongoing)** | Monthly | Register archival; new risks from live ops; lessons learned |

**Review Format:**
1. Owner reports on each open risk: status, triggers assessed, actions completed, actions planned.
2. Evaluate any new risks identified since last review; score and add to register.
3. Review recently closed risks for premature closure or re-emergence.
4. PM records minutes with decisions and action items; stored in project docs.

---

## 6. Escalation Criteria and Change Control Board (CCB)

### 6.1 Escalation Criteria

An issue must be escalated to the CCB when **any** of the following conditions are met:

| # | Escalation Trigger | Escalation Path | Response SLA |
|---|-------------------|-----------------|-------------:|
| E1 | Risk severity rises to **Critical** (new or existing risk) | Immediate call/email to CCB chair + all members | 24 hours |
| E2 | Milestone exit gate criteria cannot be met without scope, schedule, or budget change | Tech Lead → PM → CCB review before gate date | 48 hours |
| E3 | Any unplanned spend > £100 requiring contingency draw | PM → CCB chair for approval | 24 hours |
| E4 | Team capacity drops below 0.5 FTE engineer for > 2 weeks | PM → CCB review for schedule adjustment | 48 hours |
| E5 | Legal or IP issue emerges (brand objection, licence query, trademark conflict) | PM → CCB + external counsel if retained | 72 hours |
| E6 | Technical approach requires pivot after M2 (e.g., abandon React Native, change layout engine paradigm) | Tech Lead → CCB review | 72 hours |

### 6.2 Change Control Board Composition

| Role | Responsibility | Current Representative |
|------|--------------|----------------------|
| **Chair** | Final arbiter on scope, schedule, budget changes; owns CCB meeting cadence | PM |
| **Technical Authority** | Evaluates technical feasibility, architectural impact, and build pipeline readiness | Tech Lead |
| **Design Authority** | Evaluates UX, game balance, and accessibility impact of proposed changes | Design Lead (or PM proxy if vacant) |
| **Business / Stakeholder** | Validates commercial and brand alignment; approves budget | Project Sponsor / Stakeholder Rep |

**Quorum:** Chair + one other authority required for decisions ≤ £200; full board required for decisions > £200 or milestone-date changes.

### 6.3 CCB Process

```
1. IDENTIFY
   └── Any team member flags trigger via #risk channel / email / stand-up

2. LOG
   └── PM creates CCB ticket with: trigger description, business impact,
       options considered, recommended option, estimated cost/schedule impact

3. REVIEW
   └── CCB convenes (async or sync) within SLA
   └── Each authority votes: Approve / Reject / Request Info
   └── If approved: PM updates milestone plan, risk register, and budget

4. IMPLEMENT
   └── Assigned owner executes approved change
   └── PM monitors against revised plan

5. CLOSE
   └── CCB ticket closed with outcome summary
   └── Lessons learned captured in sprint retrospective
```

### 6.4 Common Change Categories and Default CCB Posture

| Change Category | Default Threshold for CCB Review | Typical Decision Timeline |
|---------------|-----------------------------------|--------------------------:|
| Feature scope addition | > 2 dev-weeks or affecting critical path | 48–72 hours |
| Feature scope removal / deferral | Any removal from current milestone | 24 hours |
| Schedule extension | > 1 week beyond current milestone gate | 48 hours |
| Budget increase | > £100 from contingency or baseline | 24 hours |
| Technology stack change | Any post-M2 | 72 hours |
| Vendor/service change | Any new recurring cost or migration | 48 hours |
| Beta / launch criteria change | Any softening of acceptance criteria | 48 hours (full board) |

---

## 7. Risk Register Maintenance

### Owner Responsibilities

Each risk owner is accountable for:
- Monitoring triggers and early warning signs
- Reporting status at every scheduled review
- Executing mitigation actions by stated deadlines
- Raising escalation (E1–E6) when thresholds are crossed
- Updating risk status in this document (Open → Mitigating → Monitoring → Closed)

### Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 2026-06-02 | Nova (Milestone Plan) | Initial 10 risks from PRD |
| 1.0 | 2026-06-02 | Nova (Risk Register) | Full scoring, mitigations, owners, deadlines, contingency, review cadence, CCB process |
| | | | |

### Review History

| Date | Reviewer | Risks Reviewed | Key Decisions / Actions Taken |
|------|----------|----------------|------------------------------|
| *(to be filled at first review)* | | | |

---

## 8. Risk Status Definitions

| Status | Definition |
|--------|-----------|
| **Open** | Risk identified; no active mitigation in progress; awaiting owner assignment or resource |
| **Mitigating** | Mitigation actions are in progress; owner reports weekly |
| **Monitoring** | Mitigation deployed; risk reduced to acceptable level; periodic check for trigger re-emergence |
| **Closed** | Risk eliminated (mitigation succeeded) or accepted (impact deemed acceptable without further action); documented with rationale |
| **Escalated** | Risk exceeds owner authority; under CCB review |

---

## Appendix A — Risk Register Quick Reference

| ID | Risk | P | I | Sev | Owner | Status | Deadline | Contingency |
|----|------|:-:|:-:|----:|-------|--------|----------|-------------|
| R1 | Layout engine performance bottleneck | M | H | High | Tech Lead | Open | M3 Exit | Defer themed generation to M4 |
| R2 | Manual tile catalog curation backlog | H | H | **Critical** | PM | Open | M3 Exit | £150 burst; scope to Temperate-only |
| R3 | Keeper class / skill tree imbalance | M | H | High | Design Lead | Open | M3 Exit | Ship 2 classes only; gate remainder |
| R4 | iOS native build unverified | M | H | High | Tech Lead | Open | M3 Exit | Android-only soft launch contingency |
| R5 | RN framework rendering limitations | M | M | Moderate | Tech Lead | Open | M2 Exit | 30 FPS cap; native module in M4 |
| R6 | Modular Realms brand/IP permissions | L | H | Moderate | PM | Open | M3 W4 | Rebrand; £100 legal budget |
| R7 | Beta feedback contradicts priorities | M | M | Moderate | PM | Open | M4 W1 | CCB evaluation; buffer week use |
| R8 | Team capacity reduction | M | M | Moderate | PM | Open | M2 Exit | £500 contractor burst |
| R9 | Cloud services cost escalation | M | M | Moderate | Tech Lead + PM | Open | M3 Exit | £200 services overage budget |
| R10 | Export format compatibility | L | M | Low | Tech Lead | Open | M3 Exit | Schema freeze + conversion tools |

---

*End of Risk Register v1.0*
