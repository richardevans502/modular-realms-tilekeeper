# Modular Realms: TileKeeper — Roadmap v2.1 Research Report

**Author:** Labby, Lady of the Silver Castle
**Date:** 2026-09-12
**Status:** ⚠️ PROVISIONAL — no real usage data yet (see §1)
**Board:** `modular_realms_tilekeeper`
**Supersedes / feeds into:** `docs/ROADMAP_v2.1.md`
**Related:** `docs/V1_1_SCOPE.md`, `docs/milestone_plan-HeliosCore.md`, `docs/TECHNICAL_ARCHITECTURE_v2.0.md`

---

## 1. Honest Precondition: There Is No Usage Data Yet

This task's core premise is "real usage data and v1.1 feedback." As of writing:

- The **v1.0 Release Candidate build has not been built or shipped**. M5 sign-off is accepted, but M5-BUILD-2 (v1.0 RC) is still pending.
- The app has **not been released to any store**; there is **no public or internal beta in users' hands**.
- There are **zero GitHub Issues, zero support requests, zero diagnostics exports, zero beta feedback traces** on this board.
- M6-T5 (v1.1 scope) was **formally deferred until post-launch** by Rich's authority for exactly this reason. The current task (M6-T6) has the same data dependency.

This report therefore does **not** pretend to rank options on actual user feedback. No such signal exists, and fabricating it would be malpractice. What it does provide is the **most useful thing producible now**: a rigorous engineering-led evaluation of all six options against the real technical architecture, risk register, effort and cost, plus a **decision-gate framework** — so that the moment real usage data lands, the right choice can be made fast and defensibly. A provisional recommendation is offered with explicit conditions.

---

## 2. Evaluation Framework

Six options are scored on five axes grounded in reality (not guessing at users):

| Axis | Meaning |
|---|---|
| **Architectural fit** | Does the codebase/architecture v2.0 already support it, or does it require new subsystems? |
| **Risk** | Against `RISK_REGISTER_v2.0-HeliosCore.md` (permission, offline-first, scope-creep, build-platform concerns). |
| **Effort** | Small / Medium / Large, using the established M-milestone vocabulary. |
| **Value ceiling** | How strongly it advances the product promise (inventory → layout → export for physical tile owners / GMs). |
| **Data-sensitivity** | How much it *depends* on real usage data before it can be justified. High = must wait; Low = can proceed on engineering merit alone. |

---

## 3. Option-by-Option Assessment

### Option 1 — Tablet optimisation (iPad / Android tablet UI)

- **Architectural fit:** Medium. React Native is inherently responsive, but the current screens target phone metrics. Layout-goal / preview screens with pan-zoom already handle larger canvases, but navigation, touch targets, and multi-pane layouts would need a deliberate tablet pass.
- **Risk:** Low. Pure UI; no new subsystems; no offline-first conflict.
- **Effort:** Medium.
- **Value ceiling:** Medium-High. GMs and club tables were named secondary users in the PRD; a large tabletop planner genuinely benefits from a bigger canvas. But no evidence yet that actual users are on tablets.
- **Data-sensitivity:** HIGH. Whether to invest depends entirely on what devices users actually open the app on. Store analytics / crash reports will answer this cheaply post-launch.

### Option 2 — Web companion app (browser-based layout viewer/planner)

- **Architectural fit:** **HIGH — strongest of the six.** The architecture already ships a `dist-web` build and `npm run build:web` passes CI. `Expo React Native` + `expo export:web` already produces a browser version of the same solver + catalog + preview pipeline. The solver is pure TypeScript with no React/SQLite/network imports, so it ports cleanly.
- **Risk:** Low-Medium. Stays local-first (client-side). No cloud account. Reuses tested code paths. Risk is marginal — web surface needs its own responsive pass and touch/pointer parity.
- **Effort:** Medium-Large (a real web skin / responsive pass — not just the existing build artifact).
- **Value ceiling:** High. A browser planner is the single most natural second surface for a tabletop prep tool: users planning layouts can do it on a laptop at the table, then carry the export to the table. It also de-risks a "thin viewer" that needs nothing but a URL.
- **Data-sensitivity:** LOW-MEDIUM. The engineering foundation (Expo web + pure solver) is already proven and cheap to maintain regardless of usage. This is the option least hostage to an unknown user base.

### Option 3 — Cloud sync (optional encrypted backup to Google Drive/Dropbox/OneDrive)

- **Architectural fit:** Medium. Already partially designed — M4 AC mentions "OAuth-based links to Google Drive, OneDrive, Dropbox for encrypted backup/restore." But no cloud client code exists; it needs OAuth, encryption envelope, and provider-specific SDKs.
- **Risk:** HIGH against the core principle. The architecture is explicit that "cloud is opt-in, additive only — app remains fully functional offline," and the security model says "Do not send inventory contents to analytics by default" and treats remote stores as untrusted. A sync feature is the largest surface for data-handling obligations (OAuth token storage, provider TOS, privacy policy revision).
- **Effort:** Large.
- **Value ceiling:** Medium. Backup/restore already works locally via JSON export/import. Remote sync is convenience, not a core capability unlock.
- **Data-sensitivity:** HIGH. You cannot justify the privacy/security surface and licensing overhead without evidence users are losing data or demanding remote backup.

### Option 4 — Advanced solver constraints (room shapes, symmetry, themed layouts)

- **Architectural fit:** HIGH. The deterministic solver in `src/layout` is the product's beating heart, already accepts `LayoutGoal` with `tableBounds`, `requiredCategories`, `requiredTileTypeIds`, `preferredSockets`. Room-shape, symmetry, and themed constraints are **natural extensions of the existing goal model** — new constraint inputs and weights, not a new engine. Determinism is preserved by versioning the solver.
- **Risk:** Low. No permission, no cloud, no scope creep (stays firmly in utility scope). The only discipline is determinism/versioning, which the architecture already mandates.
- **Effort:** Medium.
- **Value ceiling:** HIGH. This directly deepens the core promise — better `buildable physical dungeon plans`. Themed/room-shape layouts are exactly what GM users keep asking for in domain terms.
- **Data-sensitivity:** MEDIUM. It's justifiable on engineering merit + domain reasoning (GMs plan themed rooms), but the *priority* and *which* constraints should be weighted by real requests.

### Option 5 — Official catalog partnership with Modular Realms

- **Architectural fit:** LOW-MEDIUM. The catalog update service already supports signed manifest/packs, but a true *partnership* is a legal/business relationship, not an engineering task.
- **Risk:** HIGH. The architecture is explicit: "Any direct use of official images, logos, or product copy requires permission or explicit legal review." Risk R1 (official data cannot be reused directly). This is an external dependency entirely out of our control.
- **Effort:** Unknown (negotiation), engineering portion Medium.
- **Value ceiling:** High if secured (curated official catalog, marketing channel), but entirely gated on a third party we do not control.
- **Data-sensitivity:** MEDIUM-HIGH. Better pursued once there's proof of an active user base to present to Modular Realms, and to justify legal review spend.

### Option 6 — Community catalog contributions (user-submitted tile definitions)

- **Architectural fit:** Medium-High. Custom tile entry is already first-class in M2 (users can create user-defined tile records), and custom tiles participate in layouts. What's missing is a *pipeline*: validation, curation, review, and redistribution of community definitions as a shared catalog pack.
- **Risk:** Medium. Moderation/quality-control burden; risk of malformed or malicious definitions being redistributed (mitigated by Zod validation + signed packs, but curation is a process not a tool). No permission needed — it's user-authored.
- **Effort:** Medium-Large.
- **Value ceiling:** Medium-High. Addresses catalog-coverage gaps (seed is only 36 fixtures) without us hand-curating everything. Risky to build *before* knowing users actually want to contribute.
- **Data-sensitivity:** HIGH. Whether users want to *share* definitions (vs. just use them locally) is a pure usage-data question. Building a contribution pipeline on zero evidence is speculative.

---

## 4. Effort / Cost Summary

| # | Option | Effort | Est. engineering cost | External deps | Offline-first safe? |
|--:|---|---|---:|---|---|
| 1 | Tablet optimisation | Medium | ~2–3 dev-weeks | None | ✅ |
| 2 | Web companion app | Medium–Large | ~3–5 dev-weeks | None | ✅ |
| 3 | Cloud sync | Large | ~6–10 dev-weeks | OAuth + 3 providers, legal | ⚠️ (opt-in, privacy review) |
| 4 | Advanced solver constraints | Medium | ~2–4 dev-weeks | None | ✅ |
| 5 | Official catalog partnership | Unknown | Engineering ~2–3 wks; negotiation unbounded | Modular Realms | ✅ |
| 6 | Community catalog | Medium–Large | ~4–6 dev-weeks | Moderation process | ✅ |

*(Effort estimates are engineering-led, relative to the M-milestone cadence; they are provisional until scoped in an actual sprint.)*

---

## 5. Provisional Recommendation

**Two options stand on engineering merit alone and do not require guessing at the user base:**

1. **Option 2 — Web companion app** (lead): the cheapest, lowest-risk path to a second product surface. Expo web + pure solver are already proven; it reuses tested code and stays local-first. **Least hostage to unknown usage.**
2. **Option 4 — Advanced solver constraints** (co-priority): the deepest pure-value work, natural extension of the existing goal model, no external dependencies, high domain value for GMs.

**Options 1, 3, 5, 6 are genuinely data-gated** (tablet device mix, cloud-sync demand, partnership leverage, contribution appetite). They should remain **dormant with trigger criteria** (see `ROADMAP_v2.1.md`) rather than be built speculatively.

**Provisional v2.1 direction:** *"Web companion + deeper solver constraints, gated on v1.0 launch data."*

This is a **provisional** recommendation. It is deliberately offered to Rich for approval as the planning direction, **not** as a committed build schedule — per the same deferral reasoning Rich already applied to v1.1 scope. The final confirmation must come from real usage data after v1.0 ships.

---

## 6. Why This Is The Right Call Given Zero Data

- **No fabrication.** We refuse to invent "user feedback" to justify a direction.
- **Lowest regret.** Options 2 and 4 are both safe if we're wrong about the user base: web is a proven export; solver depth never reduces value. Options 3/5/6 are large or externally-gated and would be pure gambling without data.
- **Decision-gate discipline.** The roadmap ties every option to a concrete, observable trigger, so the v2.1 direction "self-corrects" once users actually touch the app.
- **Aligns with prior authority.** Rich already deferred feature scope until post-launch; this report keeps that discipline.

---

*End of Research Report*
