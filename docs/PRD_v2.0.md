# Product Requirements Document: Modular Realms TileKeeper

**Version:** 2.0  
**Status:** Authoritative product direction  
**Date:** 2026-06-03  
**Owner:** Nova, Code Maid of the Silver Castle  
**Supersedes:** `PRD_v1.0_GAME_CONCEPT_DEPRECATED.md`

---

## 1. Product Summary

Modular Realms TileKeeper is a mobile-first dungeon layout generator for tabletop hobbyists who own physical Modular Realms terrain tiles.

The app helps users:

1. Build an accurate inventory of the physical Modular Realms tiles they own.
2. Browse an authoritative catalog of real Modular Realms tile products and packs.
3. Generate valid dungeon layouts using only tiles present in their inventory.
4. Lock preferred tile placements and regenerate the remaining layout.
5. Save, compare, and export visual references for tabletop setup.

TileKeeper is not a standalone digital game. Its value is practical: it turns a user's real-world tile collection into buildable physical dungeon plans.

---

## 2. Problem Statement

Physical modular terrain collections become difficult to plan with as users acquire more sets, double-sided tiles, walls, floors, corridors, doors, specialty pieces, and accessories.

Users need reliable answers to practical planning questions:

- What Modular Realms tiles do I physically own?
- Which side or face of each physical tile is available for a layout?
- Can I build a three-room dungeon with corridor connections from my current inventory?
- Which generated layouts are spatially valid on my table?
- Which exact missing tiles would unlock a desired layout?
- Can I export a clear reference so I can assemble the layout away from the app?

The hard part is not drawing an attractive map. The hard part is generating layouts that respect physical reality: tile counts, dimensions, faces, orientation, and compatible connection edges.

---

## 3. Target Users

### 3.1 Primary Users

- Tabletop game masters who own Modular Realms terrain and need fast dungeon setup plans.
- Modular Realms collectors who want a searchable inventory of owned physical tiles.
- Scenario designers who want repeatable room-and-corridor arrangements for sessions.

### 3.2 Secondary Users

- Buyers comparing desired dungeon layouts against currently owned and available Modular Realms products.
- Clubs or shared tables that manage a group-owned tile collection.
- Content creators who want exportable layout references for build guides or session notes.

---

## 4. Product Principles

1. **Physical truth first.** A generated layout must never require more tiles than the user owns.
2. **Official catalog first.** Tile definitions are based on real, purchasable Modular Realms products and packs.
3. **Constraint clarity.** If a layout cannot be generated, the app explains which constraints failed.
4. **Fast iteration.** Users can regenerate, lock, rotate, and refine layouts quickly.
5. **Local-first utility.** Inventory and saved layouts remain usable offline once catalog data is available.
6. **Exportable by default.** A useful layout must be easy to print, share, or rebuild physically.

---

## 5. Scope for PRD v2.0

### 5.1 In Scope

- Authoritative Modular Realms tile catalog structure.
- Physical inventory tracking by tile type, quantity, face, set, and condition notes.
- Manual tile entry for incomplete catalog coverage.
- Layout goal selection such as room count, corridor style, footprint, theme, and table bounds.
- Deterministic constraint-based layout generation.
- Validation against owned inventory and tile-face availability.
- Socket compatibility checks between adjacent edges.
- Tile locking and partial regeneration.
- Saved layouts and favourites.
- Export to PNG, PDF, and JSON.
- Offline-first storage for inventory and saved layouts.

### 5.2 Out of Scope for v2.0 Product Direction

- Any standalone play loop unrelated to physical tile planning.
- Character progression systems.
- Digital-only structures or tile types that do not correspond to physical terrain.
- Random layouts that ignore owned inventory.
- Complete automated scraping without a separate approval and data-governance decision.
- Manufacturing, fulfillment, or e-commerce checkout.

---

## 6. Core User Journey

### 6.1 Inventory Setup

1. User opens the app and chooses **Inventory**.
2. User adds owned tiles by:
   - selecting from official catalog entries;
   - scanning supported product identifiers where available;
   - duplicating repeated tiles quickly;
   - manually creating custom entries if a tile is missing from the catalog.
3. App stores owned quantity per physical tile definition.
4. App stores notes such as set source, storage box, condition, or custom label.

### 6.2 Layout Generation

1. User selects **Generate Layout**.
2. User chooses a layout goal, for example:
   - 3-room dungeon with corridor connections;
   - compact encounter room;
   - long corridor network;
   - room cluster within a table footprint;
   - theme-filtered layout using stone, wattle, cobble, or cracked-stone faces.
3. User chooses optional constraints:
   - maximum table footprint;
   - required entrances/exits;
   - preferred symmetry or branching;
   - tile sets to include or exclude;
   - minimum/maximum room size.
4. Solver generates one or more valid layouts.
5. User reviews a visual map and inventory usage summary.
6. User locks preferred placements and regenerates the remaining open areas if desired.
7. User saves or exports the result.

### 6.3 Physical Assembly

1. User opens a saved layout at the table.
2. App shows each tile's identity, face, orientation, and placement position.
3. User assembles the physical layout using their owned tiles.
4. User can export or print the same reference for offline setup.

---

## 7. Functional Requirements

### 7.1 Tile Catalog

The tile catalog is the authoritative registry of known Modular Realms physical tile types.

Each catalog entry must include:

- `tile_type_id` — stable unique identifier.
- `official_name` — official Modular Realms product or tile name where known.
- `product_set_name` — official set or pack name, e.g. a named dungeon pack.
- `source_reference` — URL, catalog note, or manual source record.
- `physical_dimensions` — grid footprint such as `3x3`, `3x1`, or another supported shape.
- `physical_thickness_or_profile` — optional physical metadata if relevant to compatibility.
- `faces` — one or more usable sides of the physical tile.
- `edge_sockets_by_face` — socket types for each edge on each face.
- `theme_tags` — visual/material tags such as stone, cracked stone, cobblestone, wooden wattle, corridor, wall, floor.
- `preview_assets` — schematic thumbnail, official image reference where permitted, or placeholder diagram.
- `catalog_status` — verified, manually entered, incomplete, deprecated, or custom.

Catalog entries must distinguish a physical tile from a usable face. A double-sided tile is one physical object with multiple layout-use options, not two independent inventory items.

### 7.2 Tile Face Model

A tile face represents one usable side of a physical tile.

Each face must include:

- `face_id`.
- `face_name` such as plain stone, cracked stone, wooden wattle, or cobblestone.
- `role_tags` such as floor, wall, corridor, doorway, feature, transition, or decorative.
- `edge_sockets` for north, east, south, and west edges, plus additional edge segments if a tile has a non-square or multi-cell footprint.
- `walkable_or_passable` flag where relevant for layout topology.
- `visual_theme_tags`.
- `rotation_rules` defining whether the face can be rotated freely or has a fixed orientation.

Example: a physical tile with wooden wattle on one side and cobblestone on the other can be used as either face in a layout, but only one face can be consumed by a given placement because it is still one physical tile.

### 7.3 Inventory Management

Users must be able to:

- Add owned quantities by tile type.
- Edit quantities.
- Remove or archive entries.
- Track which set or purchase batch a tile came from.
- Add notes for storage location or condition.
- Filter by set, dimensions, theme, face, or compatibility role.
- Mark tiles as unavailable for a layout if they are packed away, damaged, loaned out, or reserved.
- Export and import inventory backups.

Inventory validation must track physical object counts, not face counts. If a user owns two double-sided wattle/cobblestone tiles, a layout may use at most two placements from that physical tile type across both face choices combined.

### 7.4 Layout Goal Selection

The app must support preset and custom layout goals.

Initial goal types:

- Single room.
- Multi-room dungeon.
- Rooms connected by corridors.
- Linear corridor route.
- Branching dungeon route.
- Compact table footprint.
- Feature-focused layout, such as a large central chamber.

Goal parameters:

- Desired number of rooms.
- Room size range.
- Corridor length range.
- Entrance count.
- Exit count.
- Maximum footprint in grid units or real table dimensions.
- Required or excluded tile sets.
- Required theme tags.
- Optional tile budget limits.

### 7.5 Layout Generation

Layout generation must be implemented as a deterministic constraint solver with optional seeded variation.

A valid generated layout must satisfy all hard constraints:

- Uses only tile types present in the user's available inventory.
- Does not use more physical copies than owned.
- Selects only one usable face per physical tile placement.
- Respects tile footprint dimensions.
- Avoids overlapping placements.
- Keeps all placements inside selected table or grid bounds.
- Ensures adjacent edge sockets are compatible.
- Ensures requested room/corridor topology is connected unless the user explicitly asks for separate zones.
- Respects locked placements.

Soft constraints should influence ranking but must not invalidate otherwise legal layouts:

- Theme consistency.
- Visual variety.
- Symmetry preference.
- Minimal unused gaps.
- Preferred room size distribution.
- Fewer rare tiles consumed.
- Easier physical assembly.

The generator must return explanation data with each layout:

- Tiles used by type and quantity.
- Remaining inventory after the layout.
- Constraint decisions and tradeoffs.
- Unsatisfied soft preferences.
- Missing tiles that prevented higher-ranked goals.

### 7.6 Socket Compatibility

Socket compatibility is the rule system that determines whether two adjacent tile edges can touch.

The app must support:

- Named socket types.
- Compatibility matrix, not only exact string matching.
- Directional edges.
- Per-face sockets.
- Rotation-aware sockets.
- Multi-segment edges for larger tiles where a single side spans more than one grid unit.
- Clear error messages for incompatible edges.

Example socket categories may include open floor, wall, doorway, corridor, blocked edge, transition edge, and special connector. Final names must match the Modular Realms catalog vocabulary once verified.

### 7.7 Manual Layout Editing

Users must be able to refine generated layouts manually:

- Lock a tile placement.
- Unlock a tile placement.
- Rotate a placement if permitted.
- Replace one tile with another compatible owned tile.
- Delete a placement and regenerate around the gap.
- Request alternative layouts from the same inventory.
- Show why a manual placement is invalid before committing it.

### 7.8 Saved Layouts and Favourites

Users must be able to:

- Save a generated or manually adjusted layout.
- Name a layout.
- Add notes such as scenario, campaign, session date, table size, or storage box.
- Mark favourites.
- Duplicate a saved layout for variants.
- Compare saved layouts by required inventory.
- Revalidate saved layouts after inventory changes.

If inventory changes make a saved layout impossible, the app must clearly show which tiles are missing or unavailable.

### 7.9 Export

Supported export formats:

- **PNG** — visual map reference for sharing or quick viewing.
- **PDF** — printable assembly guide with tile list and placement diagram.
- **JSON** — structured layout data for backup, interoperability, or external rendering tools.

Exports must include:

- Layout name.
- Tile placement diagram.
- Tile type names.
- Face names.
- Orientation.
- Quantity used.
- Remaining inventory summary where appropriate.
- Generation seed and solver version where appropriate.

### 7.10 Optional AR Overlay

An AR overlay is a future enhancement, not a launch requirement.

If implemented, AR should:

- Detect or let the user define a table surface.
- Scale the layout to physical tile dimensions.
- Show tile placement outlines on the table.
- Preserve a non-AR assembly workflow for users without supported devices.

---

## 8. Data Model Requirements

### 8.1 Core Entities

#### `TileType`

Represents one physical Modular Realms tile definition.

Required fields:

- `id`
- `officialName`
- `productSetName`
- `sourceReferenceId`
- `dimensions`
- `faces`
- `catalogStatus`
- `themeTags`
- `createdAt`
- `updatedAt`

#### `TileFace`

Represents one usable side of a physical tile.

Required fields:

- `id`
- `tileTypeId`
- `name`
- `description`
- `roleTags`
- `edgeSockets`
- `rotationRules`
- `previewAssetId`

#### `EdgeSocket`

Represents one edge or edge segment on a face.

Required fields:

- `direction`
- `segmentIndex`
- `socketType`
- `lengthUnits`

#### `InventoryItem`

Represents user ownership of a physical tile type.

Required fields:

- `id`
- `tileTypeId`
- `quantityOwned`
- `quantityAvailable`
- `sourceSetName`
- `storageLocation`
- `conditionNotes`
- `customLabel`

#### `Layout`

Represents a saved generated or edited dungeon plan.

Required fields:

- `id`
- `name`
- `goalDefinition`
- `placements`
- `inventorySnapshot`
- `solverVersion`
- `generationSeed`
- `createdAt`
- `updatedAt`

#### `LayoutPlacement`

Represents one placed physical tile in a layout.

Required fields:

- `id`
- `layoutId`
- `tileTypeId`
- `faceId`
- `position`
- `rotation`
- `locked`
- `footprintCells`

#### `SocketCompatibilityRule`

Represents compatibility between socket types.

Required fields:

- `socketTypeA`
- `socketTypeB`
- `compatibility`
- `notes`

### 8.2 Inventory Snapshot Requirement

Saved layouts must preserve an inventory snapshot at generation time so users can understand what the layout was based on, even if their inventory later changes.

The app must also support revalidation against current inventory.

---

## 9. Solver Requirements

### 9.1 Determinism

Given the same:

- catalog version;
- inventory state;
- goal definition;
- compatibility rules;
- locked placements;
- solver version;
- seed;

the solver must produce the same ranked results.

### 9.2 Constraint Categories

Hard constraints:

- inventory quantity;
- physical dimensions;
- face availability;
- socket compatibility;
- non-overlap;
- bounds;
- locked placements;
- connectivity requirements.

Soft constraints:

- aesthetic theme cohesion;
- visual variety;
- compactness;
- assembly simplicity;
- least-consumptive use of rare tiles;
- user preference ranking.

### 9.3 Failure States

If no layout can be generated, the app must provide a useful explanation such as:

- not enough room-capable tiles;
- missing corridor connectors;
- incompatible locked placement;
- table footprint too small;
- requested room count exceeds available tile count;
- selected theme filter leaves too few compatible tiles.

Failure explanations should include suggested changes:

- reduce room count;
- allow additional tile sets;
- unlock specific placements;
- expand footprint;
- add or acquire specific missing tile types.

---

## 10. User Experience Requirements

### 10.1 Primary Navigation

Recommended top-level navigation:

1. **Inventory** — owned physical tiles and availability.
2. **Catalog** — known Modular Realms tile definitions and product packs.
3. **Generate** — layout goal selection and solver results.
4. **Layouts** — saved layouts and favourites.
5. **Settings** — data backup, catalog version, app preferences.

### 10.2 Inventory UX

Inventory entry must be optimised for repeated physical items:

- quantity stepper;
- duplicate last added tile;
- bulk add by pack where catalog data supports it;
- clear distinction between physical tile and tile face;
- filters by set, dimensions, theme, and role;
- warnings when quantity is zero or unavailable.

### 10.3 Layout UX

Generated layouts must show:

- tile outlines scaled to their physical footprint;
- face names or short labels;
- orientation indicators;
- compatible edge markings where useful;
- locked placement indicators;
- tile usage count;
- remaining inventory.

Invalid manual edits must show the specific reason, not a generic failure.

### 10.4 Accessibility

The app must:

- use readable labels and scalable text;
- avoid relying on colour alone for socket compatibility;
- provide high-contrast visual states;
- support touch targets suitable for mobile use;
- make export output readable in print.

---

## 11. Catalog Governance

### 11.1 Source of Truth

The official Modular Realms product catalog is the source of truth for tile names, sets, and real-world product existence.

Because product data may not be available in a structured API, the initial catalog may be manually curated.

### 11.2 Catalog Entry Statuses

- **Verified** — confirmed against official Modular Realms source material.
- **Manual** — manually entered by the project team or user.
- **Incomplete** — known tile but missing required metadata.
- **Custom** — user-defined tile outside official catalog coverage.
- **Deprecated** — retained for old saved layouts but no longer current.

### 11.3 Data Quality Rules

A tile type cannot be considered verified until it has:

- official or source-backed name;
- product set or pack reference;
- physical dimensions;
- at least one face description;
- edge socket definitions for each usable face;
- catalog source reference.

---

## 12. Non-Functional Requirements

### 12.1 Platforms

Initial target platforms:

- Android phones.
- iPhones.

Future platform considerations:

- Android tablets and iPads for larger layout previews.
- Desktop or web companion if mobile layout planning proves too constrained.

### 12.2 Offline Behaviour

The app must remain useful offline for:

- viewing inventory;
- editing inventory;
- generating layouts from locally available catalog data;
- viewing saved layouts;
- exporting saved layouts where platform APIs permit.

Catalog updates may require network access.

### 12.3 Performance

The app should target:

- inventory interactions under 100 ms perceived response;
- first layout result within 5 seconds for common small-to-medium inventories;
- cancellable or backgrounded solving for complex requests;
- smooth pan and zoom for layout preview on target devices.

### 12.4 Privacy and Data Ownership

Inventory and saved layouts are user-owned data.

The app must:

- support local backup/export;
- avoid requiring an account for core local use;
- clearly separate optional remote services from local functionality;
- avoid uploading inventory unless the user explicitly enables a feature requiring it.

---

## 13. Acceptance Criteria

### 13.1 Catalog Acceptance

- User can view catalog tile entries with dimensions, faces, and product set references.
- Verified entries clearly show their source.
- Incomplete entries are labelled and excluded from strict generation unless the user allows them.
- Double-sided tiles are represented as one physical tile with multiple usable faces.

### 13.2 Inventory Acceptance

- User can add, edit, and remove owned tile quantities.
- User can track multiple owned copies of the same physical tile type.
- User can mark copies unavailable.
- Inventory export and import preserve quantities and notes.
- Inventory validation distinguishes physical copies from face choices.

### 13.3 Layout Generation Acceptance

- User can request a three-room dungeon with corridor connections.
- Generator returns only layouts that use owned available tiles.
- Generator never exceeds owned tile quantities.
- Generator validates socket compatibility across adjacent edges.
- Generator respects tile dimensions, rotation, and occupied space.
- Generator explains failure when no valid layout exists.
- User can lock at least one placement and regenerate the remainder.

### 13.4 Export Acceptance

- User can export a generated layout as PNG.
- User can export a printable PDF assembly guide.
- User can export JSON containing placements, tile IDs, face IDs, orientation, and solver metadata.
- Exported references are understandable without live app interaction.

---

## 14. Milestone Recommendations

### M1 — Product Realignment and Data Foundations

- Replace deprecated product direction with PRD v2.0.
- Define catalog schema.
- Define inventory schema.
- Define socket compatibility vocabulary.
- Identify the first official Modular Realms product pack to model.

### M2 — Inventory and Catalog Prototype

- Implement catalog browsing.
- Implement physical inventory entry.
- Support manual tile definitions.
- Support import/export of inventory.
- Build a small verified sample catalog.

### M3 — Constraint Solver Prototype

- Implement deterministic generation from owned inventory.
- Support a simple room-and-corridor goal.
- Validate tile count, dimensions, bounds, and socket compatibility.
- Return failure explanations.

### M4 — Layout Editing and Export

- Add layout preview, tile locking, manual edits, and partial regeneration.
- Add saved layouts and favourites.
- Add PNG, PDF, and JSON export.

### M5 — Catalog Expansion and Polish

- Expand verified Modular Realms tile coverage.
- Improve layout ranking and UX.
- Add richer assembly guides.
- Evaluate AR overlay feasibility.

---

## 15. Open Questions

1. Which Modular Realms product pack should be the first verified sample catalog?
2. What exact socket vocabulary does the physical tile system use, if any, and what names should the app expose?
3. Are official product images or diagrams permitted in the app, or should the app use schematic representations only?
4. Should users be allowed to share custom tile definitions with other users?
5. Should catalog updates ship with app releases or sync through a separate catalog feed?
6. What is the smallest useful layout goal for the first solver prototype?
7. Should table dimensions be entered in real-world units, grid units, or both?

---

## 16. Deprecated Direction Notice

Earlier planning documents explored a different direction. PRD v2.0 is the product authority going forward: TileKeeper is a physical tile inventory and dungeon layout generator for Modular Realms terrain owners.

Any future GDD, vertical-slice, art, architecture, risk, or milestone documents must be checked against this product direction before implementation work proceeds.

---

## 17. Success Metrics

Initial success metrics:

- User can accurately record an owned physical tile inventory.
- User can generate at least one valid room-and-corridor dungeon layout from that inventory.
- Generated layouts never exceed available owned tile counts.
- User can lock a placement and regenerate the rest.
- User can export a clear physical assembly reference.
- User can identify which missing tile types prevent a requested layout.

Longer-term success metrics:

- Users trust generated layouts enough to build from them without manual correction.
- Users maintain inventory over multiple purchases.
- Users save and reuse favourite layouts.
- Catalog coverage expands without breaking old saved layouts.

---

*Document end — PRD v2.0 is the authoritative product requirements document for Modular Realms TileKeeper.*
