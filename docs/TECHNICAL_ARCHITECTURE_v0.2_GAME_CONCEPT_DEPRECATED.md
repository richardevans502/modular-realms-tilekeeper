# TileKeeper Technical Architecture — DEPRECATED GAME-CONCEPT BASELINE

> **RETIRED DOCUMENT**
>
> **Status:** Superseded  
> **Superseded by:** `TECHNICAL_ARCHITECTURE_v2.0.md`  
> **Retired date:** 2026-06-03  
> **Reason:** Scope pivot from game-concept baseline to v2.0 tool/app architecture (Expo RN + deterministic layout engine).  
> **Action:** Do not use for implementation decisions. Refer to `TECHNICAL_ARCHITECTURE_v2.0.md` for active architecture authority.

---

Deprecation notice: this document has been superseded by `TECHNICAL_ARCHITECTURE_v2.0.md`. It is retained only for audit/history and must not be used to drive implementation decisions.

Status: Deprecated foundation architecture baseline
Owner: Nova (proxy technical architect)
Date: 2026-06-02

## 1. Executive decision

TileKeeper should be built as a local-first cross-platform mobile app using Expo React Native with TypeScript, backed by a small custom deterministic layout engine rather than Unity, Godot, or a bespoke native app.

Recommended stack:

- App shell: Expo React Native, TypeScript, Expo Router when screens begin.
- Layout engine: custom TypeScript package under `src/layout`, isolated from UI.
- Local storage: SQLite via Expo SQLite for structured app data, plus JSON export/import for user backups.
- Cloud services: optional and low-touch; default product should work offline with no account.
- CI/CD: GitHub Actions running TypeScript checks, unit tests, Expo export smoke build, and later EAS Build for Android/iOS packages.

Why this is the right call:

- TileKeeper is an inventory/planning tool with visual layout previews, not a real-time 3D game.
- Unity/Godot would add binary asset pipelines, larger app size, store complexity, and runtime overhead without solving the core CRUD/search/layout problems.
- A custom layout engine is small, testable, deterministic, and portable.
- Expo gives fast Android/iOS iteration, simple packaging, and enough native access for SQLite, file export/import, image handling, and future entitlements.

## 2. Engine/framework evaluation

| Option | Strengths | Weaknesses | Fit |
|---|---|---|---|
| Unity | Mature 2D/3D renderer, asset tooling, mobile export, store familiarity | Heavy runtime, license/platform overhead, awkward for inventory-heavy UI, larger build, overkill for offline planner | Reject |
| Godot 4 | Lightweight game engine, good 2D tooling, open source, mobile export | Mobile app UX/navigation/storage ecosystem weaker than React Native/Flutter; less direct fit for forms/search/import/export | Reject for M1; revisit only if layout preview becomes game-like |
| Flutter | Excellent mobile UI, strong performance, single codebase | Dart-only engine would be separate from common JS tooling; less aligned with existing Node availability in workspace | Viable alternative |
| React Native + Expo | Strong mobile app fit, TypeScript, large ecosystem, EAS build, easy web/preview export, good local-first packages | Native prebuild/EAS discipline needed; canvas/layout preview needs careful performance budget | Select |
| Fully custom native Android/iOS | Maximum platform control | Two codebases or KMP complexity, slow foundation phase, more CI burden | Reject |

Final selection: Expo React Native + TypeScript + custom deterministic layout engine.

## 3. Product architecture overview

TileKeeper is local-first. The app remains useful with no network, no account, and no active cloud services. Cloud capabilities are additive:

- Catalog update manifests: fetch optional versioned tile catalog packs.
- Entitlement checks: optional store receipt / premium feature state.
- Analytics: anonymous event counts only when enabled.
- Save sync: future optional account-backed sync; not required for vertical slice.

Core modules:

- `catalog`: canonical tile definitions, source references, categories, compatibility tags.
- `inventory`: user-owned quantities, custom tiles, import/export.
- `layout`: deterministic generation and validation of tile placements.
- `shared`: schema, validation, serialization, IDs, date/version helpers.
- `app/ui`: React Native screens and view models once implementation begins.

Module rule: `src/layout` must not import React, React Native, storage, navigation, or network modules. It accepts plain data and returns plain data. That keeps the layout demon testable, portable, and delightfully chewable.

## 4. Server/cloud topology

Baseline M1 architecture uses no mandatory backend. Recommended cloud footprint is a tiny serverless edge stack that can be enabled later without changing app data models.

```text
+-------------------------+       optional HTTPS        +-----------------------------+
| Android / iOS app       |---------------------------->| Cloudflare Worker API       |
| Expo React Native       |                             | /catalog, /entitlements,    |
| SQLite local database   |<----------------------------| /analytics, /sync           |
+-------------------------+    signed JSON responses    +-------------+---------------+
                                                                   |
                                                                   v
                                                      +-----------------------------+
                                                      | Cloudflare R2 / KV / D1     |
                                                      | catalog packs, manifests,   |
                                                      | anonymous analytics, sync   |
                                                      +-----------------------------+
```

Recommended services:

- Cloudflare Workers: tiny API surface, good free tier, global edge, easy cron/catalog publishing.
- Cloudflare R2: static catalog packs and app-downloadable reference assets if permission allows.
- Cloudflare D1 or Supabase: only if optional sync/user accounts become approved.
- Sentry: crash reporting for production builds.
- PostHog Cloud or Cloudflare Analytics Engine: low-volume anonymous product analytics.
- RevenueCat or native store APIs: entitlement abstraction if premium tiers/one-off purchase need cross-store validation.

Initial server endpoints:

- `GET /catalog/manifest.json`: latest catalog version, checksum list, minimum app version.
- `GET /catalog/packs/{version}.json`: signed catalog pack.
- `POST /analytics/event`: optional anonymous event ingest; rejects PII.
- `POST /entitlements/verify`: optional store receipt validation; not needed for offline core.
- `POST /sync/*`: future only; disabled until accounts are explicitly approved.

## 5. Data model

All persisted records include:

- `id`: stable UUID or deterministic slug where appropriate.
- `schemaVersion`: integer used by migrations.
- `createdAt` / `updatedAt`: ISO-8601 UTC strings.
- `source`: `official`, `custom`, `imported`, or `generated`.

### 5.1 Tile catalog

```ts
type TileType = {
  id: string;
  schemaVersion: 1;
  slug: string;
  displayName: string;
  setName?: string;
  category: 'floor' | 'wall' | 'door' | 'stairs' | 'scatter' | 'connector' | 'custom';
  footprint: TileFootprint;
  edges: TileEdge[];
  themes: string[];
  tags: string[];
  imageRef?: AssetRef;
  sourceReferences: SourceReference[];
  notes?: string;
  discontinued?: boolean;
};

type TileFootprint = {
  grid: 'square' | 'rect' | 'polyomino' | 'freeform';
  widthUnits: number;
  heightUnits: number;
  occupiedCells?: Array<{ x: number; y: number }>;
};

type TileEdge = {
  side: 'n' | 'e' | 's' | 'w' | string;
  connectorType?: string;
  passable?: boolean;
  tags: string[];
};

type SourceReference = {
  label: string;
  url?: string;
  capturedAt?: string;
  licenseNote?: string;
};
```

### 5.2 Inventory / Keeper state

`KeeperState` is the user-owned local state: inventory quantities, custom tile definitions, app settings, generated/saved layouts, and migration metadata.

```ts
type KeeperState = {
  schemaVersion: 1;
  profileId: string;
  inventory: InventoryItem[];
  customTileTypes: TileType[];
  savedLayouts: SavedLayout[];
  preferences: KeeperPreferences;
  migrationLog: MigrationRecord[];
};

type InventoryItem = {
  id: string;
  tileTypeId: string;
  quantityOwned: number;
  condition?: 'new' | 'good' | 'worn' | 'damaged';
  storageLocation?: string;
  acquiredFrom?: string;
  notes?: string;
  updatedAt: string;
};

type KeeperPreferences = {
  measurementUnits: 'grid' | 'inches' | 'cm';
  defaultThemeFilter?: string;
  analyticsOptIn: boolean;
};
```

### 5.3 Layout maps and placements

Layouts are serialised as normalized graph/grid data, not as pixels. UI can render them any way it likes.

```ts
type SavedLayout = {
  id: string;
  schemaVersion: 1;
  name: string;
  description?: string;
  tableSize?: { widthUnits: number; heightUnits: number };
  constraints: LayoutConstraints;
  placements: LayoutTilePlacement[];
  missingTiles: MissingTileRequirement[];
  favorite: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

type LayoutTilePlacement = {
  id: string;
  tileTypeId: string;
  inventoryItemId?: string;
  x: number;
  y: number;
  rotationDeg: 0 | 90 | 180 | 270;
  zIndex: number;
  locked?: boolean;
  adjacency: Array<{ placementId: string; side: string; compatible: boolean }>;
};

type LayoutConstraints = {
  themeTags?: string[];
  maxTiles?: number;
  requiredTileTypeIds?: string[];
  allowMissingTiles: boolean;
  requireConnectedGraph: boolean;
};
```

### 5.4 Save serialization

Use two formats:

- SQLite: normal app persistence.
- Portable backup JSON: export/import, support tickets, future sync conflict handling.

Backup envelope:

```json
{
  "app": "modular-realms-tilekeeper",
  "schemaVersion": 1,
  "exportedAt": "2026-06-02T00:00:00Z",
  "catalogVersion": "manual-2026-06",
  "checksum": "sha256-of-payload",
  "payload": {
    "keeperState": {},
    "catalogOverrides": []
  }
}
```

Rules:

- Validate JSON with Zod before import.
- Never trust imported IDs blindly; detect collisions and offer merge/replace.
- Keep migrations pure functions with fixture tests.
- Export should not include analytics identifiers or crash-report user IDs.

## 6. Build and CI/CD pipeline

### 6.1 Target platforms

M1/M2 targets:

- Android APK/AAB through Expo/EAS.
- iOS simulator builds during development.
- iOS App Store/TestFlight through EAS on macOS/cloud when Apple account is available.
- Web export is smoke-test only, not a primary product target.

### 6.2 Local developer commands

Recommended scripts:

- `npm run typecheck`: TypeScript compile check.
- `npm run test`: Jest unit tests for schemas/layout engine.
- `npm run build:web`: Expo static web export smoke build.
- `npm run doctor`: Expo environment diagnostics.
- `npm run ci`: all local CI checks.

### 6.3 GitHub Actions pipeline

Foundation pipeline:

1. Checkout.
2. Setup Node LTS.
3. `npm ci`.
4. `npm run typecheck`.
5. `npm run test -- --runInBand`.
6. `npm run build:web` as smoke build.
7. Upload coverage and export artifacts.

Release pipeline once store credentials exist:

1. PR pipeline above.
2. EAS Build Android preview on release branch.
3. EAS Build iOS simulator preview.
4. Human sign-off.
5. EAS Submit to stores.

### 6.4 Empty project build result

An empty Expo TypeScript project scaffold has been added for the foundation smoke build. Current verified command:

```bash
npm run build:web
```

This runs `expo export --platform web --output-dir dist-web` and proves the selected stack can produce a clean build artifact in the current environment. Verification was performed from a clean copy in the kanban workspace using `npm ci && npm run ci`; the build exported `index.html`, `metadata.json`, and a bundled Expo web entry under `dist-web`. Native Android/iOS packaging remains a CI/EAS task because WSL does not provide Android SDK, Xcode, signing, or Apple tooling.

Dependency audit note: the clean install currently reports 10 moderate npm audit findings in Expo transitive tooling and no high/critical findings. This is not a foundation blocker, but the first implementation sprint should re-run `npm audit`, track Expo SDK advisories, and avoid shipping until high/critical findings are resolved or formally accepted.

## 7. Performance budget

Assumed minimum devices:

- Android: Android 10+, 3 GB RAM, mid-range 2019-era CPU/GPU.
- iOS: iOS 15+, iPhone 8 / SE 2nd generation or later.

Budgets:

| Area | Target |
|---|---|
| Cold launch | < 2.5 s on min-spec device |
| App package | < 60 MB initial target; < 100 MB hard ceiling |
| Runtime RAM | < 180 MB typical, < 250 MB during layout generation |
| Layout generation | < 500 ms for common inventories; < 2 s hard target for larger searches |
| Main-thread stalls | No frame blocked > 50 ms during normal navigation |
| UI preview | 60 FPS pan/zoom for <= 150 placements; graceful degradation above |
| Local DB | < 50 MB for ordinary users; backup JSON < 10 MB typical |
| Network | App fully functional offline after install/catalog load |

Performance tactics:

- Keep layout generation bounded and cancellable.
- Use deterministic heuristics before exhaustive search.
- Memoize compatibility checks by tile type and rotation.
- Render schematic tiles first; defer detailed images.
- Move expensive generation to worker-like async tasks where possible.

## 8. Security and cheat-protection model

TileKeeper is an offline-friendly premium utility. The security model should protect paid access and user data without punishing legitimate offline use.

Principles:

- Local data belongs to the user; export/import remains available.
- No DRM arms race. Protect premium features with reasonable entitlement checks, not hostile lock-in.
- No secrets in the mobile bundle.
- No PII in analytics.
- Treat imported backups and remote catalog packs as untrusted input.

Controls:

- Validate all imported JSON with strict schemas.
- Sign official catalog manifests and verify checksums before applying updates.
- Store entitlement state locally with timestamp and store receipt metadata; allow grace periods for offline use.
- Rate-limit and schema-validate all cloud endpoints.
- Use HTTPS only; reject mixed-content catalog URLs.
- Keep admin/catalog publishing credentials out of CI logs and app bundles.
- Use Sentry source maps only through authenticated upload in CI.

Threats and mitigations:

| Threat | Mitigation |
|---|---|
| Modified backup corrupts app state | Zod validation, collision handling, migration tests |
| Fake catalog pack | Signed manifest + SHA-256 checksums |
| Entitlement bypass | Native store receipt validation / RevenueCat; local grace not permanent trust |
| Analytics leaking PII | Event allowlist, no free-text fields, opt-in preference |
| Cloud endpoint abuse | Rate limit, small payload caps, auth where required |
| Reverse engineering | Acceptable risk for offline utility; do not store backend secrets in app |

## 9. Cost of ownership projection

The recommended architecture is intentionally cheap while the product validates demand.

### Foundation / vertical slice

| Service | Purpose | Expected monthly cost |
|---|---|---:|
| Expo/EAS free tier | Development builds / project tooling | £0 initially |
| GitHub Actions | CI for small repo | £0 on included minutes if private usage remains low |
| Cloudflare Workers/KV/R2 | Optional manifest/catalog hosting | £0–£5 |
| Sentry free/dev tier | Crash reporting | £0 |
| PostHog free tier or disabled | Analytics | £0 |
| Total | | £0–£5/month |

### Early production

| Service | Purpose | Expected monthly cost |
|---|---|---:|
| EAS paid tier if needed | Faster/extra mobile builds | £0–£25 |
| Cloudflare | API/catalog/analytics | £5–£20 |
| Sentry | Crash volume beyond free tier | £0–£20 |
| RevenueCat | Entitlement abstraction | £0 until revenue threshold; then usage/revenue-based |
| Domain/email/misc | Operational overhead | £2–£10 |
| Total | | £7–£75/month |

Cost approval recommendation: approve the foundation footprint at £0–£5/month and defer any paid EAS/RevenueCat/Sentry upgrades until the vertical slice needs store-distributed builds or real users.

## 10. Foundation risks and decisions

Resolved decisions:

- Use Expo React Native + TypeScript.
- Reject Unity/Godot for M1 because the app is data/UI-heavy, not game-engine-heavy.
- Keep layout generation custom, deterministic, and isolated from UI.
- Use local-first SQLite and portable JSON backups.
- Make cloud optional and serverless.

Risks remaining for later milestones, not blockers for M1 foundation:

- Official Modular Realms image/product reuse may require permission.
- Exact tile compatibility rules need GDD/art-bible input.
- Store entitlement approach depends on pricing model.
- iOS native build verification requires Apple account and EAS/macOS runner.

No unresolved blocker risks remain for the foundation architecture. The riskiest unknowns are scoped into later design/legal/store tasks rather than blocking engine selection.
