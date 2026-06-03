# Seed Catalog Pack

This directory contains the hand-curated M2 seed catalog for Modular Realms TileKeeper.

## Files

- `seed-catalog.json` — 36 representative physical tile definitions.
- `loadSeedCatalog.ts` — Zod-backed loader that validates the raw seed pack and returns schema-compatible `TileType` records.

## Naming convention

Raw seed entries use PRD-facing names:

- `tile_type_id`: stable physical tile identifier. Use `mr-seed-<kebab-name>` for this M2 pack.
- `official_name`: plausible human-readable terrain name.
- `product_set_name`: plausible pack or set name.
- `theme_tags`: top-level visual/filter tags.

The loader maps those fields to the shared schema used by storage:

- `tile_type_id` -> `TileType.id`
- `official_name` -> `TileType.name`
- `product_set_name` -> `TileType.product_set`
- `theme_tags` -> `TileType.tags`

## Face model

Each entry describes one physical tile type. A tile may have one face or multiple usable faces when it is double-sided. Inventory counts physical tiles, not faces, so a double-sided tile with two faces is still one owned tile type.

Each face must include:

- `face_id`: unique within the tile.
- `face_name`: display name for exports and browsing.
- `role_tags`: solver/browsing function tags such as `room`, `corridor`, `wall`, or `scatter`.
- `edge_sockets`: explicit compatibility evidence for each relevant edge.
- `rotation_rules`: allowed quarter-turn rotations and whether mirroring is allowed.
- `theme_tags`: visual tags for that face.

## Socket compatibility

`edge_sockets` are deliberately evidence-based. Every socket includes:

- `face`: edge name such as `north`, `east`, `south`, or `west`.
- `socket_type`: `wall`, `path`, `doorway`, `open-room`, `blocked`, `stairs-up`, `stairs-down`, or `custom`.
- `bidirectional`: whether the socket relationship can be matched from either side.
- `reason`: a short human-readable rationale.

Doorway and stair tiles in the seed pack include explicit transition rules so early layout tests can exercise socket matching before the full solver lands.

## Adding a new tile

1. Choose a stable `tile_type_id` in kebab-case. Do not rename existing ids unless you are deliberately migrating saved data.
2. Add dimensions in grid cells and list every occupied cell.
3. Add one or more faces. Double-sided physical tiles should be one entry with multiple faces, not separate entries.
4. Add edge sockets with reasons; avoid vague values like `custom` unless there is a documented reason.
5. Run:

   ```sh
   npm test -- src/catalog/loadSeedCatalog.test.ts --runInBand
   npx tsc --noEmit
   ```

6. If a new category or socket type is needed, update `src/shared/schemas.ts` first and add schema tests.
