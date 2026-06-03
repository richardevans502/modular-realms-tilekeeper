# Modular Realms: TileKeeper
## Milestone 2 — Vertical Slice Scope v2.0: Leadership Sign-Off Document

**Version:** 2.0  
**Date:** 2026-06-03  
**Owner:** Nova, Code Maid of the Silver Castle  
**Status:** Signed — all proxy leads approved  
**Full Detail:** See `VS_SCOPE.md` (M2 — Vertical Slice Scope Document v2.0)  
**PRD Reference:** PRD v2.0 — authoritative inventory/layout-generator product direction  
**Technical Architecture Reference:** TECHNICAL_ARCHITECTURE v2.0 — Expo React Native + TypeScript + deterministic layout engine  
**Supersedes:** VS Scope v1.0 playable session / defence encounter scope  
**Target Demo Date:** Week 18

---

## 1. What We Are Committing To

TileKeeper Milestone 2 commits to a **functional layout generation demo**, not a miniature playable game session.

The signed scope proves the actual app value proposition: a Modular Realms owner can catalog tiles, mark owned quantities, choose layout constraints, generate a valid connected layout using only owned pieces, inspect the result, save it, and export it.

The demo answers: **"Can this app turn a user's owned Modular Realms tiles into useful, valid layout plans on a real device?"**

The v1.0 direction — authored 15-minute playthrough, Keeper AI, economy, defence waves, art/audio pass — is formally removed from Milestone 2. Those items were game-slice scope, not app-foundation scope.

---

## 2. Scope Summary — What Is IN

*For full detail, refer to `VS_SCOPE.md` sections 3–9.*

### Functional Product Slice

- **Seeded catalog:** 30–40 representative tile definitions with category, physical tile/face metadata, footprint, edge metadata, theme tags, and rights/source notes.
- **Inventory management:** owned quantity editing, owned/unowned filtering, local persistence, demo reset, inventory JSON import/export.
- **Layout generation engine:** deterministic TypeScript engine under `src/layout`, isolated from React Native, using catalog + inventory + constraints to produce valid connected layouts.
- **Validation:** bounds, collisions, inventory counts, connectivity, edge compatibility, required pieces, locked placements, and custom tile metadata checks.
- **Functional UI:** home/demo launcher, catalog, inventory, generator setup, layout result, layout detail, settings/about.
- **Save/export:** saved layouts persist locally; layout JSON exports and validates; inventory JSON round-trips with useful errors; visual PNG/PDF-ready export remains preferred but non-gating for this VS.
- **Technical foundation:** typed schemas, tests, CI typecheck, unit tests, and Expo web export smoke build.

### Demo Workflow

The Week 18 demo shows this complete path:

1. Launch app on Android target device / Expo preview.
2. Browse seeded catalog.
3. Set owned quantities for a representative inventory.
4. Choose table/theme/max-tile/required-piece constraints.
5. Generate a valid connected layout.
6. Inspect warnings, missing requirements, unused tiles, and placement details.
7. Lock or swap at least one tile and regenerate around it.
8. Save and export the resulting layout JSON.

### Quality Bar

- Generated layouts must be valid, connected, and inventory-safe.
- Unsatisfiable requests must fail gracefully with actionable diagnostics.
- Same input + seed must produce the same output.
- Layout previews must be readable enough for a user to build from.
- Data must survive app restart and round-trip through JSON export/import.
- CI evidence must show typecheck, unit tests, and web export smoke build passing.

---

## 3. What Is Explicitly OUT

| Category | Out-of-Scope Items | Rationale |
|---|---|---|
| Gameplay | 15-minute authored session, win/lose states, scripted tutorial defence | Replaced by functional app workflow |
| Keepers | Keeper classes, skills, AI, XP, morale, fatigue, portraits | Not needed for catalog/inventory/layout proof |
| Combat/Economy | Enemies, waves, structures, resource ticks, corruption | Game mechanics are outside app-foundation VS |
| Art/Audio | Biome art pass, animations, ambient loops, music, SFX, mastering | Schematic UI and readable previews are enough |
| Catalog | Full production Modular Realms catalog | Seeded representative catalog only |
| Platform | Store-ready Android/iOS packages | Expo preview plus web export smoke for VS; EAS later |
| Cloud | Accounts, sync, catalog update service, entitlements | Local-first only |
| Capture | Barcode scanning, OCR, image recognition | Manual entry only |
| Social/Monetisation | Community browser, IAP, subscriptions, premium entitlements | Deferred until product model approval |

---

## 4. P0 Acceptance Criteria

All P0 criteria must pass for sign-off.

| # | Criterion | Pass Threshold |
|---|---|---|
| P0.1 | App launches to demo workflow | 5/5 launches on Android/Expo preview and web smoke build succeeds |
| P0.2 | Seeded catalog validates | 30+ entries, 0 schema errors, 0 duplicate slugs |
| P0.3 | Inventory edits persist | Quantity edits survive app restart in 5/5 checks |
| P0.4 | Generator returns valid connected layouts | 10 seeded demo runs pass validator |
| P0.5 | Inventory counts are respected | Automated overuse tests pass with 0 violations |
| P0.6 | Unsatisfiable constraints fail gracefully | UI displays missing/conflicting requirements |
| P0.7 | Seeded determinism works | 20 same-input/same-seed repeat tests pass |
| P0.8 | Layout preview is readable | UX proxy can identify tile types, connections, warnings |
| P0.9 | Save/export layout JSON works | Export validates and can be reloaded |
| P0.10 | CI evidence is clean | Typecheck, unit tests, and web export smoke build pass |

P1 criteria may have up to 2 minor fails if documented with owner, severity, and follow-up task.

---

## 5. Resource Commitment

The v2.0 scope is substantially smaller and more product-accurate than v1.0.

| Line | Estimate |
|---|---:|
| Team size | ~3.3 FTE lean app/product foundation team |
| Calendar duration | 12 weeks (Sprints 1–6, Weeks 7–18) |
| Effort | **38 person-weeks** including 20% buffer |
| Seed catalog | 30–40 representative entries |
| UI screens | 6–7 functional screens |
| Assets | Schematic markers/icons only; no final art/audio pass |
| Budget | Lower than v1.0 playable-session scope; no escalation required |

---

## 6. Risk Acceptance

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R-VS1 | Layouts are valid but not useful | Medium | High | UX fixture review, diagnostics, locked-tile regeneration |
| R-VS2 | Seed catalog is too thin | Medium | High | Minimum 30 entries across core categories |
| R-VS3 | Edge compatibility rules become ambiguous | Medium | Medium | Small connector taxonomy and explicit fixtures |
| R-VS4 | SQLite integration slips | Medium | Medium | Repository interface; temporary JSON adapter allowed if schema remains stable |
| R-VS5 | Web preview hides Android performance issues | Medium | Medium | Android/Expo device pass in Sprint 5 |
| R-VS6 | Import/export expands into sync | Low | Medium | JSON-only local export/import; cloud sync out of scope |

---

## 7. Sign-Off Block

By signing below, each lead confirms:

- VS Scope v1.0 playable-session content is retired for Milestone 2.
- VS Scope v2.0 functional layout generation demo is the accepted target.
- P0/P1 criteria are realistic and will be evaluated honestly.
- The reduced resource estimate is accepted.
- Any future scope change requires a formal Change Control Board review.

| Role | Name | Signature | Date |
|---|---|---|---|
| Product Lead (proxy) | Lady Labrynth | Approved via board, 2026-06-03 | 2026-06-03 |
| Tech Lead (proxy) | Nova | Approved via board, 2026-06-03 | 2026-06-03 |
| UX/UI Lead (proxy) | Lady Labrynth | Approved via board, 2026-06-03 | 2026-06-03 |
| QA Lead (proxy) | Nova | Approved via board, 2026-06-03 | 2026-06-03 |
| Producer (proxy) | Lady Labrynth | Approved via board, 2026-06-03 | 2026-06-03 |
| Steering Committee Representative | Nova | Approved via board, 2026-06-03 | 2026-06-03 |

---

**Signature of this document constitutes formal agreement on the Milestone 2 Vertical Slice v2.0 scope for Modular Realms: TileKeeper. The committed deliverable is a functional catalog/inventory/layout-generation app demo, not a playable game session.**

*End of Sign-Off Document*
