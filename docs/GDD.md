# Modular Realms: TileKeeper — Design Document v1.1

Status: Steering revision — utility-app scope realigned
Date: 2026-06-03
Owner: Nova, Code Maid of the Silver Castle
Target platform: Android and iOS mobile
Document purpose: Define the product-facing design for the TileKeeper mobile app: tile catalog, owned inventory, layout creation, layout generation, adjacency validation, import/export, and scope boundaries.

---

## 0. v1.1 change summary

This revision replaces the earlier game-heavy concept with the practical product defined by the PRD and technical architecture.

Major changes:
- Reframes TileKeeper as a local-first mobile utility for Modular Realms hobbyists, collectors, and game masters.
- Replaces character, battle, and timed encounter systems with tile catalog, inventory, layout building, validation, and saved-layout workflows.
- Promotes adjacency validation from a secondary mechanic to the central rules engine.
- Defines a curated catalog model that can support official references, user-defined tiles, custom compatibility metadata, and future catalog packs.
- Defines inventory quantity rules so generated layouts never consume more tiles than the user owns unless explicitly allowed as a shopping-list / missing-tile suggestion.
- Aligns terminology with the Expo React Native + TypeScript architecture and local-first SQLite storage plan.

Design north star:
TileKeeper should answer, quickly and confidently: “What tiles do I have, what can I build with them, and what am I missing for the layout I want?”

---

## 1. High concept

Modular Realms: TileKeeper is a mobile-first collection and layout planning app for people who own, browse, or plan tabletop terrain made from Modular Realms-style tiles.

The app helps users:
- Browse a structured tile catalog.
- Record which tiles they own and how many of each are available.
- Add custom or legacy tiles when the official catalog is incomplete.
- Assemble layouts manually on a grid.
- Generate valid layout suggestions from owned inventory.
- Validate edge compatibility, adjacency, footprint collisions, table bounds, and missing-tile requirements.
- Save reusable layouts for campaigns, encounters, display boards, and shopping plans.
- Export/import data so the user is never locked into a single device.

The fantasy is not tactical combat. The fantasy is being the organised game master with a beautifully indexed terrain collection and a layout plan that actually works on the table. Tiny demon cackle, but practical.

---

## 2. Product pillars

1. Inventory truth first
   - The app must always distinguish between catalog tiles that exist and tiles the user actually owns.
   - Layout suggestions must respect owned quantities by default.
   - Missing tiles are surfaced as helpful shopping or wishlist information, not hidden errors.

2. Fast cataloging
   - Adding a common tile should take only a few taps.
   - Quantity adjustment must be quicker than editing a full record.
   - Bulk edit, duplicate, and recent-tile actions matter more than decorative flourish.

3. Valid layouts, clearly explained
   - A user should understand why a placement is legal or illegal before they commit it.
   - Validation messages should name the precise issue: socket mismatch, occupied cells, out-of-bounds footprint, quantity exceeded, disconnected layout, or unmet constraint.

4. Local-first and portable
   - The product must work offline after install and catalog load.
   - User inventory and saved layouts belong to the user.
   - Export/import is a core feature, not a future luxury.

5. Schematic clarity over art dependency
   - The first app version uses readable schematic tile representations.
   - Official imagery is optional and permission-dependent.
   - Shape, orientation, edge type, quantity, and theme must remain legible without relying on detailed art.

6. Extensible catalog, stable rules
   - New tile families, themes, and product sets should fit the same data model.
   - The validation engine must be deterministic and testable.
   - User-defined tiles must use the same compatibility rules as curated tiles.

---

## 3. Target users and jobs-to-be-done

Primary users:
- Tabletop gamers who own Modular Realms terrain.
- Game masters preparing encounters for home campaigns, one-shots, clubs, or conventions.
- Collectors tracking sets, variants, condition, and storage locations.
- Buyers comparing desired layouts against tiles listed on modularrealms.com or other legitimate product references.

Core jobs:
- “I need to know what I own.”
- “I need to build a dungeon/room/corridor layout using only my available tiles.”
- “I want to check whether these pieces connect properly before I unpack boxes.”
- “I want to save this layout for next session.”
- “I want to see which missing pieces would improve this layout.”
- “I own custom or old pieces and need them in the planner too.”

Experience goals:
- Confidence: “This layout can be built with my current inventory.”
- Speed: “I updated my collection while sorting the box.”
- Clarity: “The app tells me exactly why this connection fails.”
- Flexibility: “I can use official, custom, and imported tiles together.”
- Trust: “My data is local, exportable, and not trapped.”

---

## 4. Primary app loop

The app loop is utility-first:

1. Catalog
   - Browse known tile types.
   - Review dimensions, category, theme, edge metadata, source references, tags, and notes.
   - Add or edit custom tile definitions where official catalog coverage is missing.

2. Inventory
   - Add owned quantities from catalog entries.
   - Adjust quantities, condition, storage location, acquisition notes, and favorites.
   - Filter by set, category, theme, connector type, storage box, or missing metadata.

3. Plan
   - Start from a blank layout, saved template, or generated suggestion.
   - Choose table size, grid units, theme filters, required tile types, maximum tile count, and whether missing tiles may be suggested.

4. Place
   - Drag or tap tiles from available inventory into the board.
   - Rotate tiles in 90-degree increments where supported.
   - Preview footprints, occupied cells, connector edges, and validation status before confirmation.

5. Validate
   - Check bounds, collisions, quantity limits, connector compatibility, required connectivity, and scenario constraints.
   - Show actionable messages and highlight affected edges/cells.

6. Save / export
   - Save the layout with notes, tags, scenario, table size, missing-tile list, and thumbnail.
   - Export inventory/layouts as portable JSON backup.
   - Share or print a layout summary in a later milestone.

---

## 5. Information architecture

Primary navigation:

1. Inventory
   - Owned tile list.
   - Quantity steppers.
   - Quick add/search.
   - Filters and storage-location views.

2. Catalog
   - Known tile type browser.
   - Tile detail pages.
   - Source references.
   - Custom tile creation/editing.

3. Layouts
   - Saved layouts.
   - Manual layout builder.
   - Generated suggestions.
   - Missing-tile reports.

4. Settings
   - Import/export.
   - Catalog version information.
   - Measurement units.
   - Data source notes.
   - Accessibility and analytics preferences.

Navigation rules:
- Inventory and Catalog remain separate because “available tile type” and “owned tile count” are different concepts.
- Layout Builder can open tile details without losing board state.
- Any screen that changes user data must save locally and support undo/confirmation for destructive operations.

---

## 6. Tile catalog design

### 6.1 TileType definition

A TileType is the canonical definition of a tile, independent of whether the user owns it.

Required fields:
- Stable ID / slug.
- Display name.
- Category.
- Footprint.
- Edge metadata.
- Theme tags.
- Compatibility tags.
- Source type: official reference, custom, imported, generated, or unknown.
- Source reference notes.
- Schema version.

Recommended optional fields:
- Set name.
- Product URL.
- Product image reference, if permission allows.
- Collection notes.
- Discontinued / legacy flag.
- Print/material variant.
- Recommended grid unit scale.
- Sort order within a set.

Canonical categories for v1.1:
- Floor.
- Wall.
- Door.
- Stairs.
- Corridor.
- Corner.
- Room.
- Connector.
- Scatter.
- Elevation.
- Custom.

Category is for browsing and filtering. Compatibility is determined by footprint and edge metadata, not category alone.

### 6.2 Catalog source policy

The Modular Realms website is the primary public reference for product information, but the app must not depend on automated scraping or unapproved image reuse.

Source rules:
- Manually curated metadata is acceptable for foundation planning.
- Every official-style catalog entry should include a source reference field.
- Product images are optional and permission-dependent.
- Users must be able to create custom entries without official metadata.
- Imported catalog packs must declare source and schema version.

### 6.3 Custom tile handling

Custom tiles are first-class citizens.

A custom tile can define:
- Name.
- Category.
- Footprint size.
- Occupied cells for non-rectangular shapes.
- Edge connector types.
- Theme tags.
- Notes and storage location defaults.
- Optional photo or schematic thumbnail in a later milestone.

Validation requirements:
- Custom tiles must pass the same footprint and edge schema validation as catalog tiles.
- Invalid custom tile definitions must be rejected with clear field-level errors.
- Custom IDs must not collide with curated catalog IDs.

---

## 7. Inventory management

### 7.1 InventoryItem definition

An InventoryItem records the user's owned quantity for a TileType.

Required fields:
- Inventory item ID.
- TileType ID.
- Quantity owned.
- Updated timestamp.

Optional fields:
- Condition: new, good, worn, damaged.
- Storage location: box, shelf, drawer, bag, campaign case.
- Acquisition source.
- Purchase date.
- Notes.
- Favorite flag.
- Hidden / archived flag.

Quantity rules:
- Quantity owned must be a non-negative integer.
- Quantity zero is allowed only when preserving notes/history; default views should hide zero-count items unless filters show them.
- Generated layouts consume quantity by TileType ID unless the user chooses “allow missing tiles.”
- Manual layouts may temporarily exceed quantity, but the validation panel must flag the overage.

### 7.2 Fast inventory workflows

Required workflows:
- Search catalog and add tile to inventory.
- Increment/decrement owned quantity from list view.
- Add multiple copies at once.
- Duplicate an inventory entry for a custom variant.
- Filter inventory by category, theme, set, location, and missing metadata.
- Archive a tile without deleting historical layouts.

Destructive actions:
- Deleting a custom TileType that appears in saved layouts is blocked by default.
- Reducing quantity below the amount used in a saved layout is allowed, but saved layouts show warnings when reopened.
- Bulk delete requires confirmation and export reminder.

### 7.3 Inventory validation

Inventory validation checks:
- TileType reference exists.
- Quantity is valid.
- Custom tile definitions are schema-valid.
- Archived tile references are handled gracefully.
- Import does not create duplicate records without a merge decision.

---

## 8. Layout model

### 8.1 Grid foundation

Primary layout model for v1.1: square grid with rectangular and polyomino footprints.

Reasoning:
- Matches the technical architecture baseline.
- Simple to validate and render on mobile.
- Supports most practical table-planning needs.
- Keeps layout generation deterministic and testable.

Coordinate model:
- Integer coordinates `(x, y)`.
- Each placement has one anchor cell.
- Rectangular tiles occupy `widthUnits × heightUnits` cells.
- Polyomino tiles define occupied cells relative to the anchor.
- Rotation is stored as 0, 90, 180, or 270 degrees where legal.
- `zIndex` may support stacked/elevation previews later, but v1.1 validation treats collision in 2D unless elevation mode is explicitly enabled in a future milestone.

Table size:
- Layouts may define a table or board boundary in grid units.
- If no table size is set, the builder uses an expandable canvas with warnings for very large layouts.
- Generated layouts should require explicit max tile count or table bounds to avoid unbounded search.

### 8.2 Layout object

A saved layout contains:
- Layout ID.
- Name.
- Description / scenario notes.
- Table size.
- Constraints.
- Placements.
- Missing tile requirements.
- Tags.
- Favorite flag.
- Created/updated timestamps.
- Schema version.

A placement contains:
- Placement ID.
- TileType ID.
- Optional inventory item reference.
- Position.
- Rotation.
- Locked flag.
- Adjacency results.
- Validation messages.

### 8.3 Manual placement workflow

Manual placement flow:
1. User chooses a tile from inventory or catalog.
2. App shows available owned quantity and current usage count.
3. User drags/taps tile onto board.
4. App previews footprint, edge connectors, rotation, and validation status.
5. User rotates if needed.
6. Legal placement confirms immediately or on explicit tap depending on setting.
7. Illegal placement can be cancelled, rotated, or kept as a planned/missing tile if the current mode allows it.

Undo/redo:
- Undo/redo applies to layout edits, not app-wide inventory changes.
- Minimum undo stack target: 10 layout actions.
- Actions include placement, removal, move, rotation, lock/unlock, and constraint change.
- Saved layout writes should not corrupt undo history.

---

## 9. Edge and adjacency rules

### 9.1 Edge metadata

Each placed tile exposes edges after rotation.

Baseline edge sides:
- North.
- East.
- South.
- West.

Edge fields:
- Side.
- Connector type.
- Passable flag.
- Tags.
- Optional width/offset metadata for future detailed matching.

Starter connector types:
- Open.
- Wall.
- Door.
- Corridor.
- Stairs.
- Water.
- Cliff.
- Blocked.
- Universal.
- Unknown.

Connector philosophy:
- “Unknown” is not automatically illegal; it produces a warning unless strict validation is enabled.
- “Universal” can connect to any compatible physical edge unless blocked by scenario constraints.
- Passability is separate from physical compatibility. Two wall edges may be physically compatible but not passable.

### 9.2 Compatibility matrix

Default v1.1 matrix:

| A | Compatible with | Notes |
|---|---|---|
| Open | Open, Door, Corridor, Universal | Normal walkable connection |
| Door | Open, Door, Corridor, Wall, Universal | Door-to-Wall is legal as a doorway seam |
| Corridor | Open, Door, Corridor, Stairs, Universal | Preferred for connected traversal layouts |
| Wall | Wall, Door, Blocked, Universal | Wall-to-Open is a warning or illegal based on strictness |
| Stairs | Corridor, Open, Stairs, Universal | Elevation semantics deferred unless layout mode enables levels |
| Water | Water, Bridge, Universal | Bridge may be represented as Door/Corridor tag or custom connector |
| Cliff | Cliff, Stairs, Wall, Universal | Usually non-passable unless stair/transition tag exists |
| Blocked | Wall, Blocked | Cannot be used for required connected paths |
| Unknown | Any with warning | User/custom metadata incomplete |
| Universal | Any non-conflicting type | Use sparingly; requires source note for curated catalog |

Validation strictness modes:
- Relaxed: unknown connectors warn; wall/open mismatch warns; quantity overage warns.
- Standard: known incompatible connectors block placement; unknown warns; quantity overage warns.
- Strict: unknown connectors, quantity overage, disconnected graph, and wall/open mismatch block valid layout status.

### 9.3 Adjacency validation checks

Placement-level checks:
- Footprint is within bounds if table bounds exist.
- Footprint does not collide with occupied cells.
- Tile exists in catalog or custom definitions.
- Rotation is supported.
- Edge compatibility passes or yields warnings according to validation mode.

Layout-level checks:
- Uses no more of each TileType than owned, unless missing tiles are allowed.
- Required tile types are present.
- Required theme/category filters are met.
- Connected graph requirement is met if enabled.
- Locked tiles remain fixed during generation.
- No orphan tile exists unless disconnected layouts are allowed.
- Missing-tile report is complete and deduplicated.

Validation result severity:
- Info: useful note, not a problem.
- Warning: layout can be saved but should be reviewed.
- Error: layout is invalid under current mode.
- Blocker: placement cannot be committed in current mode.

User feedback requirements:
- Highlight offending cell or edge.
- Name both involved tiles and sides where possible.
- Suggest a fix: rotate, move, swap tile, allow missing, edit custom metadata, or relax validation.

---

## 10. Layout generation

### 10.1 Generation goals

The generator should produce plausible, valid arrangements from inventory. It is a planning assistant, not a black-box perfect optimizer.

User inputs:
- Table size or max tile count.
- Theme/category filters.
- Required tile types.
- Optional seed/start tile.
- Connectivity requirement.
- Validation mode.
- Allow/disallow missing tiles.
- Desired style tags: room-heavy, corridor-heavy, compact, open, symmetric, display board, encounter map.

Generator outputs:
- One or more candidate layouts.
- Validation summary.
- Inventory usage counts.
- Missing tile list if allowed.
- Constraint satisfaction notes.
- Regenerate / refine options.

### 10.2 Generation rules

Hard constraints by default:
- Do not exceed owned quantities.
- Do not overlap footprints.
- Stay within table bounds if defined.
- Respect locked placements.
- Respect strict connector incompatibilities.
- Include required tiles.

Soft preferences:
- Prefer high compatibility score.
- Prefer fewer warnings.
- Prefer compact bounding boxes unless user requests sprawling layout.
- Prefer theme consistency.
- Prefer useful door/corridor continuity.
- Avoid isolated singletons unless scatter placement is explicitly allowed.

Timeout behaviour:
- Common inventory generation target: under 500 ms.
- Large inventory hard target: under 2 seconds or cancellable progress.
- If exhaustive search is too expensive, return the best partial candidate with clear explanation.

### 10.3 Missing-tile suggestions

When “allow missing tiles” is enabled, the generator may include tiles the user does not own.

Missing-tile report includes:
- TileType.
- Quantity needed.
- Quantity owned.
- Why it was suggested.
- Source reference if known.
- Possible substitutes from owned inventory.

Missing tiles must never be silently counted as owned.

---

## 11. Saved layouts and reuse

Saved layout use cases:
- Campaign encounter map.
- Convention demo board.
- Display shelf arrangement.
- Shopping target.
- Template for recurring room/corridor pattern.
- Work-in-progress draft.

Layout metadata:
- Name.
- Tags.
- Table size.
- Scenario notes.
- Required sets or themes.
- Favorite flag.
- Created/updated timestamps.
- Validation status at last save.
- Thumbnail or schematic preview.

Reopen behaviour:
- Revalidate against current inventory and catalog versions.
- Show drift if tile metadata changed.
- Preserve original placements even if now invalid, but clearly mark issues.
- Offer repair actions: substitute tile, update metadata, allow missing, duplicate layout, or ignore warning.

Versioning:
- Saved layouts store schema version.
- Future migrations must preserve user notes, placement coordinates, rotation, and missing-tile lists.

---

## 12. Import/export and backup

Export is a foundation requirement.

Export package includes:
- App identifier.
- Schema version.
- Export timestamp.
- Catalog version.
- Checksum.
- Inventory state.
- Custom tile definitions.
- Saved layouts.
- User preferences relevant to layout interpretation.

Export package excludes:
- Analytics identifiers.
- Crash-report IDs.
- Store entitlement secrets.
- Any credential or API token.

Import flow:
1. User selects backup JSON.
2. App validates envelope and checksum.
3. App validates schema.
4. App previews import contents.
5. User chooses merge, replace, or cancel.
6. App detects ID collisions and duplicate custom tiles.
7. App writes import transactionally.
8. App reports success/fail with recovery guidance.

Import must never partially corrupt local state. If a transaction fails, the previous state remains intact.

---

## 13. UI and feedback requirements

### 13.1 Inventory UI

Required feedback:
- Quantity owned visible in list and detail views.
- Quick quantity stepper.
- Low/frictionless search.
- Active filters shown as chips.
- Empty states explain how to add tiles.
- Archived/zero-count items hidden by default but recoverable.

### 13.2 Catalog UI

Required feedback:
- Tile category, footprint, themes, edge diagram, and source reference visible on detail page.
- Custom/official/imported status clearly marked.
- Missing metadata warnings for custom tiles.
- “Add to inventory” and “Use in layout” actions obvious.

### 13.3 Layout Builder UI

Required feedback:
- Board grid and table bounds.
- Tile footprint preview.
- Rotation controls.
- Edge connector overlay.
- Legal/illegal placement colours plus non-colour iconography.
- Inventory use counter: used / owned.
- Validation panel grouped by blocker, error, warning, info.
- Missing-tile list accessible from layout summary.
- Undo/redo state visible.

Accessibility requirements:
- Touch targets at least 44×44 px.
- Do not rely on colour alone for compatibility.
- Text labels for connector types in detail panel.
- Schematic shapes readable at phone scale.
- Support system font scaling where practical.

---

## 14. Data and technical readiness checklist

The design implies these core entities:
- TileType.
- TileFootprint.
- TileEdge.
- SourceReference.
- InventoryItem.
- KeeperState / user profile state.
- SavedLayout.
- LayoutTilePlacement.
- LayoutConstraints.
- ValidationResult.
- MissingTileRequirement.
- CatalogPack.
- ImportExportEnvelope.
- MigrationRecord.
- UserPreferences.

Data principles:
- Rules are data-driven where practical.
- Layout engine accepts plain data and returns plain data.
- Validation is deterministic and seedable for tests.
- Saved layouts store placement, rotation, tile IDs, constraints, and validation metadata separately from rendered pixels.
- Custom and curated tiles share the same schema.
- Balance-like values are not needed; compatibility values belong in catalog/rules config.

Technical spec can proceed with these decisions:
- Square grid is the v1.1 baseline.
- Rectangular/polyomino footprints are supported by schema.
- Hex/freeform gameplay-style systems are out of initial scope.
- Catalog, inventory, and layout modules are separate.
- Layout generation is bounded and cancellable.
- Local SQLite plus JSON export/import is the persistence baseline.
- Cloud/catalog updates are optional, not required for offline operation.

---

## 15. Milestone scope boundaries

### 15.1 In scope for foundation / first implementation planning

- Tile catalog browser.
- User inventory with quantities.
- Custom tile definitions.
- Manual layout builder.
- Edge and adjacency validation.
- Inventory-aware layout generation.
- Saved layouts.
- Missing-tile reporting.
- Import/export backup JSON.
- Offline-first local storage.
- Schematic tile visuals.
- Android and iOS mobile targets, with Android primary for earliest device testing.

### 15.2 Explicitly out of scope for v1.1 planning

- Real-time battle systems.
- Character classes, stats, levelling, skills, equipment, or morale.
- Enemy AI, attack paths, damage, health, timed encounters, or survival objectives.
- Resource economies unrelated to physical tile inventory.
- Campaign progression, achievements, metagrowth, or unlock trees.
- Multiplayer/co-op shared editing.
- Public marketplace or user-generated public catalog store.
- Automated scraping of modularrealms.com.
- Official product image reuse without permission.
- Mandatory accounts or cloud sync.
- 3D terrain rendering or physics simulation.
- Hex/freeform layout engine implementation in the first build.
- Monetization and entitlement flow beyond future architecture placeholders.

These exclusions keep the product focused on the actual user problem: catalog, inventory, layout, and validation.

---

## 16. Success metrics

Foundation success metrics:
- User can add at least 20 tile types to inventory.
- User can adjust quantities in under 3 taps from inventory list.
- User can manually create and save a valid layout.
- User can see why an invalid adjacency fails.
- User can generate at least one valid layout from owned inventory.
- User can identify missing tiles for a desired layout.
- User can export and re-import inventory/layout data without loss.

Quality targets:
- Common layout validation completes instantly from the user's perspective.
- Common layout generation completes under 500 ms on target mid-range device.
- Large generation either completes under 2 seconds or returns cancellable partial progress.
- No layout operation should freeze navigation.
- Default views remain readable on phone screens.

Trust targets:
- Export/import round-trip preserves user data.
- Catalog source references are visible.
- The app remains useful offline.
- Custom tiles are not treated as second-class records.

---

## 17. Open questions

Product:
- What is the minimum viable curated catalog size for first beta?
- Which Modular Realms sets/themes should seed the initial catalog?
- Should the first release include shopping-list export, or keep missing-tile reports in-app only?
- Should user photos for custom tiles be supported in the first mobile build or deferred?

Rules:
- What connector taxonomy best matches real Modular Realms pieces?
- Do some tile families require non-cardinal edge matching or partial-edge offsets?
- Should scatter terrain participate in collision validation or be allowed as overlays?
- How should elevation/stairs be represented before multi-level layouts exist?

Business/legal:
- What permission, partnership, or attribution model is needed for official product names/images?
- Should fallback branding be prepared before outreach?

Technical:
- Which renderer path meets pan/zoom requirements: React Native Views first, Skia fallback, or hybrid?
- What import/export schema fields should be frozen before beta?

---

## 18. Sign-off notes

This v1.1 document is complete for steering realignment away from a speculative game design and toward the product described by the PRD and technical architecture.

Sign-off position:
- TileKeeper is an inventory and layout planning app.
- The core design surface is tile metadata, owned quantity, placement, adjacency validation, and saved layouts.
- The validation engine is the heart of the product.
- Game-like character, battle, and timed survival systems are removed from the active scope.
- Downstream VS scope, risk register, and milestone documents should be updated to reference this utility-app baseline before further implementation planning.

BUILD SUCCESS — All systems cute. No critical bugs.
