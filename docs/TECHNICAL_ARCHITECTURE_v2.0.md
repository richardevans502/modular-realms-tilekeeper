# Modular Realms TileKeeper — Technical Architecture v2.0

Status: Corrected architecture baseline
Owner: Nova (proxy technical architect)
Date: 2026-06-03
Supersedes: `TECHNICAL_ARCHITECTURE_v0.2_GAME_CONCEPT_DEPRECATED.md`

## 1. Executive decision

TileKeeper is a local-first catalog, inventory, and deterministic layout-planning mobile app for physical Modular Realms terrain tiles. It is not a real-time game, not a combat simulator, and not a rendering-engine project.

Selected architecture:

- App shell: Expo React Native with TypeScript.
- Persistence: SQLite through Expo SQLite for local structured data.
- Validation: Zod schemas for catalog packs, backups, and generated-layout imports.
- Layout generation: custom deterministic TypeScript rules engine under `src/layout`.
- Catalog updates: optional Cloudflare-hosted signed JSON manifests and pack files.
- Backup/export: portable JSON backup, plus generated layout exports as PNG, JSON, and PDF.
- CI/CD: GitHub Actions running TypeScript checks, schema tests, solver tests, and Expo export smoke builds.

Primary product promise:

- Users can browse known Modular Realms tile types.
- Users can record the exact tiles they physically own.
- Users can ask the app for buildable layouts constrained by their inventory.
- Users can export a readable map and machine-readable placement graph for tabletop preparation or downstream 3D/tooling workflows.

## 2. Explicitly rejected architecture

The following are removed from the technical baseline and must not drive implementation:

- Godot 4 app skeleton or any game-engine-first architecture.
- Unity fallback planning.
- Real-time 2D/3D rendering requirements such as 60 FPS board effects, particles, or engine scene graphs.
- Combat, damage resolution, wave spawning, enemy AI, build phases, or defence encounters.
- Game session save/load state.
- Analytics based on combat success, funnel progression, or play-session outcomes.
- Biome-combat adjacency rules.

The only rendering requirement in this architecture is a clear schematic 2D top-down layout preview and export pipeline. Any richer visualisation is future optional tooling, not an architectural dependency.

## 3. System context

```text
+---------------------------------------------------------------+
| Android / iOS app — Expo React Native + TypeScript            |
|                                                               |
|  Screens: Inventory, Catalog, Layout Generator, Exports,      |
|  Settings                                                     |
|                                                               |
|  Local SQLite DB                                              |
|  - official catalog cache                                     |
|  - user inventory                                             |
|  - custom tiles                                               |
|  - generated/saved layouts                                    |
|  - import/export metadata                                     |
|                                                               |
|  Pure TypeScript packages                                     |
|  - src/catalog                                                |
|  - src/inventory                                              |
|  - src/layout                                                 |
|  - src/export                                                 |
|  - src/shared schemas                                         |
+--------------------------+------------------------------------+
                           |
                           | optional HTTPS catalog refresh
                           v
+---------------------------------------------------------------+
| Cloudflare Worker / static catalog host                       |
|                                                               |
|  GET /catalog/manifest.json                                   |
|  GET /catalog/packs/{packId}.json                             |
|  GET /catalog/assets/{assetId}                                |
|                                                               |
|  Storage: R2/KV for versioned signed catalog packs             |
+---------------------------------------------------------------+
```

Baseline rule: the app remains useful offline after installation and/or after a catalog pack is cached. Cloud access improves catalog freshness; it must not be required to view inventory or generate layouts from already-known data.

## 4. Module boundaries

Recommended source layout:

```text
src/
  app/                 React Native screens, navigation, view models
  catalog/             official/custom tile definitions and pack loading
  inventory/           owned quantity model, storage location, condition
  layout/              deterministic solver, placement graph, validators
  export/              PNG/JSON/PDF generation adapters
  storage/             SQLite repositories and migrations
  shared/              IDs, Zod schemas, units, checksums, date/version helpers
```

Hard dependency rules:

- `src/layout` must not import React, React Native, SQLite, navigation, network, or UI packages.
- `src/layout` accepts plain typed input and returns plain typed output.
- `src/catalog` owns catalog-pack parsing and schema migration.
- `src/inventory` owns user-owned quantities and custom tile references.
- `src/export` consumes a validated placement graph; it does not decide tile legality.
- UI code may call the solver through a thin async service wrapper, but solver determinism must be unit-testable without a device or simulator.

## 5. Tile data model V2

A tile type represents a physical object. A physical tile can expose multiple faces; each face can have its own name, visual description, edge sockets, and reference assets. The data model must not flatten a two-sided tile into one logical surface.

```ts
type TileType = {
  id: string;
  schemaVersion: 2;
  slug: string;
  displayName: string;
  packId?: string;
  setName?: string;
  category:
    | 'room'
    | 'corridor'
    | 'wall'
    | 'doorway'
    | 'stair'
    | 'junction'
    | 'scatter'
    | 'custom';
  physical: PhysicalTileSpec;
  faces: TileFace[];
  tags: string[];
  sourceReferences: SourceReference[];
  discontinued?: boolean;
  notes?: string;
};

type PhysicalTileSpec = {
  footprint: TileFootprint;
  thicknessMm?: number;
  material?: 'card' | 'resin' | 'plastic' | 'mdf' | 'unknown' | string;
};

type TileFootprint = {
  unit: 'grid-cell' | 'mm' | 'inch';
  width: number;
  height: number;
  occupiedCells?: Array<{ x: number; y: number }>;
  shape: 'rect' | 'polyomino' | 'freeform';
};

type TileFace = {
  id: string;
  name: string;
  sideLabel?: 'A' | 'B' | string;
  visualDescription: string;
  edges: FaceEdge[];
  imageRef?: AssetRef;
  tags: string[];
};

type FaceEdge = {
  side: 'n' | 'e' | 's' | 'w' | string;
  span?: { start: number; end: number };
  socket: SocketType;
  passable: boolean;
  notes?: string;
};

type SocketType =
  | 'wall'
  | 'path'
  | 'doorway'
  | 'open-room'
  | 'blocked'
  | 'stairs-up'
  | 'stairs-down'
  | 'custom';
```

Example: a 3x1 corridor tile may have face A as cracked-stone path sockets on east/west edges, while face B may be a wooden-wattle wall section with wall sockets on north/south edges. The solver must treat those faces as different placement candidates while still consuming one physical inventory item.

## 6. Socket compatibility V2

Socket compatibility is a catalog-level rule set, not a visual-theme rule and not an AI judgement. It must be explicit, versioned, and testable.

```ts
type SocketCompatibilityRule = {
  id: string;
  schemaVersion: 2;
  a: SocketType;
  b: SocketType;
  compatible: boolean;
  bidirectional: boolean;
  requiresAlignment?: 'full-span' | 'overlap' | 'point-contact';
  reason?: string;
};
```

Initial compatibility table:

| Socket A | Socket B | Compatibility | Notes |
|---|---|---|---|
| `wall` | `wall` | yes | continuous wall seam |
| `path` | `path` | yes | traversable path continuity |
| `doorway` | `doorway` | yes | doorway aligns to doorway |
| `doorway` | `open-room` | yes | doorway opens into room |
| `open-room` | `open-room` | yes | open interior connection |
| `blocked` | any passable socket | no | blocked edge cannot connect to traversable edge |
| `stairs-up` | `stairs-down` | yes | only if future 3D/z-layer support is enabled |

Catalog authors can add pack-specific compatibility rules, but generated layout validity must always be derived from explicit rules in the active catalog version.

## 7. Dimension-aware grid model

Tiles are not assumed to be uniform 1x1 cells. The solver uses a discrete planning grid with dimension-aware occupied cells.

Requirements:

- Rectangular tiles such as 3x3, 3x1, 2x2, and 1x2 must occupy their full footprint.
- Polyomino tiles can define explicit `occupiedCells` within a bounding box.
- Rotation changes occupied cells and edge orientation.
- Placement legality must check bounds, occupied-cell collisions, and edge-socket compatibility.
- The UI may render a simplified schematic, but the saved layout graph must preserve exact footprint, face, rotation, and adjacency decisions.

```ts
type PlacementCandidate = {
  tileTypeId: string;
  inventoryItemId?: string;
  faceId: string;
  x: number;
  y: number;
  rotationDeg: 0 | 90 | 180 | 270;
};

type PlacedTile = PlacementCandidate & {
  placementId: string;
  occupiedCells: Array<{ x: number; y: number }>;
  exposedEdges: ResolvedEdge[];
};
```

## 8. Deterministic layout solver engine

The layout engine is a rules engine. It does not call an LLM, generative AI service, or opaque optimiser. Given the same catalog, inventory, goal, seed, and solver version, it must return the same ranked results.

Inputs:

- Active catalog version and socket rules.
- User inventory quantities.
- Optional custom tile definitions.
- Layout goal: target footprint, desired room count, corridor preference, required tile categories, maximum tiles, table bounds, and missing-tile policy.
- Deterministic seed for tie-breaking and reproducible regeneration.

Outputs:

- Valid placement graph.
- Chosen face for every placed physical tile.
- Rotation and grid coordinates for every placement.
- Adjacency list with compatibility evidence.
- Unused inventory summary.
- Missing tile suggestions if the user enables incomplete-plan mode.
- Solver trace summary for explainability.

```ts
type LayoutGoal = {
  id: string;
  name: string;
  tableBounds?: { width: number; height: number };
  targetTileCount?: number;
  requiredCategories?: TileType['category'][];
  requiredTileTypeIds?: string[];
  preferredSockets?: SocketType[];
  allowMissingTiles: boolean;
  requireConnectedGraph: boolean;
  seed: string;
};

type GeneratedLayout = {
  id: string;
  schemaVersion: 2;
  catalogVersion: string;
  solverVersion: string;
  goal: LayoutGoal;
  placements: PlacedTile[];
  adjacency: PlacementAdjacency[];
  score: LayoutScore;
  missingTiles: MissingTileRequirement[];
  trace: SolverTraceSummary;
};
```

Recommended solver approach for M2:

1. Expand the user's inventory into physical tile units.
2. Generate placement candidates by tile type, face, rotation, and legal open positions.
3. Prioritise constrained tiles first: large footprints, rare sockets, required tile IDs, and doorway/junction pieces.
4. Build a connected graph with backtracking and deterministic heuristics.
5. Prune branches on bounds, collision, socket incompatibility, disconnected islands, and inventory exhaustion.
6. Score valid layouts using transparent weights such as connectedness, goal coverage, compactness, and unused required sockets.
7. Return top N layouts plus trace summaries, not just a single opaque result.

Face selection is part of candidate generation. A double-sided tile with two faces and four rotations contributes up to eight candidates before position expansion. This branching factor must be handled deliberately with pruning, memoized compatibility checks, and solver budgets.

## 9. Inventory model

Inventory records physical ownership, not just abstract tile definitions.

```ts
type InventoryItem = {
  id: string;
  schemaVersion: 2;
  tileTypeId: string;
  quantityOwned: number;
  condition?: 'new' | 'good' | 'worn' | 'damaged';
  storageLocation?: string;
  acquiredFrom?: string;
  userLabel?: string;
  notes?: string;
  updatedAt: string;
};
```

Rules:

- The solver must never consume more physical units than `quantityOwned` unless `allowMissingTiles` is true.
- Custom tile types are first-class and can participate in layouts if their faces and sockets validate.
- Inventory import must tolerate old schema records and migrate them to face-aware V2 where possible.
- Users must be able to mark official catalog tiles as owned through a claim workflow rather than manually recreating definitions.

## 10. Catalog update model

Modular Realms may release new packs over time. TileKeeper should support catalog refresh without requiring an app release for every new product.

Catalog pack structure:

```ts
type CatalogManifest = {
  schemaVersion: 2;
  latestCatalogVersion: string;
  minimumAppVersion: string;
  packs: Array<{
    packId: string;
    version: string;
    url: string;
    sha256: string;
    signature?: string;
    releasedAt: string;
  }>;
};

type CatalogPack = {
  schemaVersion: 2;
  packId: string;
  version: string;
  displayName: string;
  tileTypes: TileType[];
  socketRules: SocketCompatibilityRule[];
  assets?: AssetRef[];
  sourceReferences: SourceReference[];
};
```

Catalog update flow:

1. App checks `GET /catalog/manifest.json` when online and user permits refresh.
2. App compares cached pack versions and downloads newer pack JSON.
3. App verifies checksum and optional signature before storing.
4. App validates pack content through Zod.
5. App presents newly available tile types to the user as claimable catalog entries.
6. User claims owned quantities; inventory changes remain local user data.

## 11. Export pipeline

TileKeeper must produce useful artifacts from a placement graph.

Export targets:

- PNG: raster top-down schematic map for sharing or quick reference.
- JSON: machine-readable placement graph for backup, support, or downstream 3D tools.
- PDF: printable layout reference with title, grid, tile list, missing tiles, and notes.

Export architecture:

```text
GeneratedLayout
  -> validate graph and catalog references
  -> resolve labels, dimensions, and face visuals
  -> render intermediate vector/schematic model
  -> adapters:
       PNG raster renderer
       JSON serializer
       PDF document generator
```

Export rules:

- JSON export preserves `tileTypeId`, `faceId`, coordinates, rotation, footprint, and adjacency evidence.
- PNG/PDF exports are views of the layout graph; they are not the source of truth.
- Exports must include catalog version and solver version for reproducibility.
- Export should not include analytics identifiers, entitlement records, or unrelated local settings.

## 12. Storage and migrations

SQLite tables should be simple, versioned, and migration-friendly.

Recommended baseline tables:

| Table | Purpose |
|---|---|
| `catalog_packs` | cached official/custom catalog packs and manifest metadata |
| `tile_types` | flattened searchable index of active tile definitions |
| `inventory_items` | user-owned physical quantities |
| `custom_tile_types` | user-authored tile definitions |
| `saved_layouts` | generated or manually saved placement graphs |
| `app_settings` | preferences, catalog refresh settings, migration flags |
| `migration_log` | applied schema migrations and timestamps |

Migration principles:

- Keep migrations deterministic and covered by fixture tests.
- Never discard user custom tiles silently.
- Preserve old exports through import adapters where practical.
- V1 single-face tile definitions migrate to V2 by creating a default face named `default` and moving old edges onto that face.

## 13. Security and trust model

TileKeeper is an offline-friendly utility. The security model protects user data and prevents malformed catalog/import payloads from corrupting local state.

Controls:

- Validate all imports and catalog packs with strict Zod schemas.
- Verify catalog checksums and signatures when official signing is enabled.
- Treat remote images/assets as untrusted references; cache only through approved app paths.
- Use HTTPS for catalog refresh.
- Keep admin/catalog-publishing secrets out of the mobile bundle and CI logs.
- Do not send inventory contents to analytics by default.
- If anonymous product analytics are later added, allow opt-in only and restrict events to non-PII counters.

Threats and mitigations:

| Threat | Mitigation |
|---|---|
| Malformed backup breaks local DB | schema validation, transaction rollback, import preview |
| Fake catalog pack | checksum/signature verification |
| Catalog schema drift | manifest `minimumAppVersion`, migration adapters |
| Private inventory leakage | local-first storage, no default sync, export-only user action |
| Solver denial via pathological custom tile set | solver budgets, validation caps, cancellable generation |

## 14. Performance budget

Minimum supported devices:

- Android: Android 10+, 3 GB RAM, mid-range 2019-era CPU.
- iOS: iOS 15+, iPhone 8 / SE 2nd generation or later.

Targets:

| Area | Target |
|---|---|
| Cold launch | < 2.5 s on min-spec device |
| Local DB size | < 50 MB typical catalog + inventory + saved layouts |
| Backup JSON | < 10 MB typical |
| Common layout generation | < 500 ms for small/medium inventories |
| Large layout generation | cancellable, < 2 s default budget before offering refinement |
| UI responsiveness | no normal interaction blocked > 50 ms |
| Schematic preview | smooth pan/zoom for <= 150 placed tiles; graceful simplification above |
| Network | app remains functional offline after catalog cache exists |

Performance tactics:

- Memoize socket compatibility by socket pair and edge span.
- Cache rotated footprints and face-edge transforms.
- Run layout generation asynchronously and expose cancellation.
- Use deterministic heuristic ordering before backtracking.
- Limit top-N result count and trace depth.
- Render schematic shapes first; defer detailed image thumbnails.

## 15. Build, test, and CI/CD

Recommended local scripts:

```bash
npm run typecheck
npm run test
npm run build:web
npm run ci
```

CI pipeline:

1. Checkout.
2. Setup Node LTS.
3. `npm ci`.
4. TypeScript compile check.
5. Unit tests for schemas, migrations, compatibility rules, and layout solver determinism.
6. Fixture tests for catalog import/export and V1-to-V2 migration.
7. Expo web export smoke build.
8. Optional EAS Android/iOS builds once store credentials and signing are approved.

Test priorities:

- Zod rejects malformed catalog packs.
- V1 tile definitions migrate into V2 default-face records.
- Socket compatibility table is symmetric where marked bidirectional.
- Solver returns identical layouts for identical inputs and seed.
- Solver respects inventory quantity limits.
- Solver accounts for face selection and rotation.
- Export JSON round-trips through import validation.

## 16. Implementation milestones

### M2.1 — Schema foundation

- Add V2 TypeScript types and Zod schemas.
- Add V1-to-V2 migration fixtures.
- Add catalog-pack and backup envelope validators.

### M2.2 — Inventory and catalog storage

- Add SQLite migrations and repositories.
- Add catalog pack cache.
- Add claim-owned-tile workflow data services.

### M2.3 — Solver MVP

- Implement socket compatibility resolution.
- Implement dimension-aware placement validation.
- Implement deterministic connected-layout generation with face selection.
- Add solver trace summaries and unit tests.

### M2.4 — Preview and exports

- Add schematic top-down renderer.
- Add JSON export.
- Add PNG export.
- Add PDF export.

### M2.5 — Catalog refresh

- Add manifest fetch.
- Add checksum/signature verification.
- Add pack update UI and conflict handling.

## 17. Architecture decisions locked by v2.0

- Expo React Native + TypeScript remains the selected mobile stack.
- SQLite remains the local source of truth.
- Cloudflare catalog hosting is optional and additive.
- The layout engine is deterministic and custom-built in TypeScript.
- Tile definitions are face-aware; double-sided physical tiles are first-class.
- Socket compatibility is explicit, schema-versioned, and testable.
- Layouts are saved as placement graphs, not images.
- Exported PNG/PDF files are generated views of the placement graph.
- Game-engine systems are out of scope for this product direction.

## 18. Open technical questions

- What exact physical measurement unit should become the canonical planning grid for Modular Realms tiles?
- Which official source fields can be used directly, and which require manual paraphrase or permission?
- Should official catalog packs be signed from day one, or begin with SHA-256 verification and add signatures later?
- Which PDF renderer works best within Expo/EAS constraints for both Android and iOS?
- How many generated layout alternatives should the default UI present before overwhelming the user?

## 19. Definition of architectural done

This architecture is ready for implementation when:

- V2 schemas can represent double-sided tiles with per-face edges.
- Solver tests prove dimension, face, rotation, socket, and inventory constraints.
- Import/export tests prove JSON backup compatibility.
- Preview/export pipeline can render from a placement graph.
- Catalog update flow can fetch, verify, validate, and cache a versioned pack.
- No implementation task depends on Godot, Unity, combat simulation, wave logic, or real-time game-session architecture.

BUILD STATUS: all systems catalogued, inventoried, and solver-cute. No game-engine demons remain.
