# Catalog Publishing Workflow

This document defines the repeatable process for publishing Modular Realms TileKeeper catalog packs without an app code release.

## Catalog publication shape

A publication is a static HTTPS directory containing:

```text
manifest.json
packs/<pack-id>.json
```

The app only needs the manifest URL. The manifest lists every pack envelope, and each pack envelope contains validated tile definitions plus optional source, asset, and migration metadata.

### Manifest envelope

```json
{
  "payload": {
    "schema_version": 1,
    "catalog_version": "2026.06.catalog",
    "generated_at": "2026-06-19T12:00:00.000Z",
    "packs": [
      {
        "id": "starter-online",
        "version": "2026.06.19",
        "url": "https://catalog.example/releases/2026.06.catalog/packs/starter-online.json",
        "sha256": "<sha256 of canonical pack payload>",
        "signature": "<optional HMAC/Ed25519 signature>"
      }
    ]
  },
  "sha256": "<sha256 of canonical manifest payload>",
  "signature": "<optional HMAC/Ed25519 signature>"
}
```

### Pack envelope

```json
{
  "payload": {
    "schema_version": 1,
    "id": "starter-online",
    "version": "2026.06.19",
    "minimum_app_version": "1.0",
    "tiles": ["TileType records from src/shared/schemas.ts"],
    "sources": [
      {
        "label": "Manual measurement notes",
        "url": "https://example.test/source",
        "accessed_at": "2026-06-19",
        "license": "Used as reference only"
      }
    ],
    "assets": [
      {
        "id": "starter-pack-reference-image",
        "type": "image",
        "url": "https://example.test/starter.png",
        "sha256": "<asset sha256>",
        "alt": "Reference photo for curation only"
      }
    ],
    "migrations": [
      {
        "id": "legacy-seed-v0-to-pack-v1",
        "from_schema_version": 0,
        "to_schema_version": 1,
        "applied_at": "2026-06-19T12:00:00.000Z",
        "notes": "Mapped legacy seed fields into TileType fields."
      }
    ]
  },
  "sha256": "<sha256 of canonical pack payload>",
  "signature": "<optional HMAC/Ed25519 signature>"
}
```

Rules:

- `schema_version: 1` is the current app-consumable catalog pack schema.
- `catalog_version` is the release train across the manifest; each pack also has its own `version`.
- Tile IDs are stable. Do not rename IDs unless a migration record explains the mapping.
- `sources` stores curation evidence and permissions context; it does not imply the app may redistribute official art or copy.
- `assets` stores checksummed external references. The app validates pack metadata and tile data; asset download/display remains a separate permission decision.
- Higher manifest schema versions are rejected with a friendly “requires newer TileKeeper” message instead of corrupting local cache.

## Build input

Create a publication input JSON file:

```json
{
  "catalogVersion": "2026.06.catalog",
  "generatedAt": "2026-06-19T12:00:00.000Z",
  "baseUrl": "https://catalog.example/releases/2026.06.catalog/",
  "packs": [
    {
      "id": "starter-online",
      "version": "2026.06.19",
      "tiles": [],
      "sources": [],
      "assets": []
    }
  ]
}
```

For pre-v1 seed records, use `legacyTiles` instead of `tiles`; the builder migrates `tile_type_id`, `official_name`, `product_set_name`, and `theme_tags` into app `TileType` fields and records a migration entry.

## Publishing steps

1. Curate or update pack input JSON.
2. Record source references and permission notes in `sources`.
3. Add asset URLs and sha256 checksums where external reference assets are included.
4. Build static envelopes:

   ```sh
   npm run catalog:build -- --input catalog-publication.json --output-dir dist/catalog
   ```

   For HMAC signatures compatible with the app refresh verifier:

   ```sh
   CATALOG_HMAC_SECRET='<shared secret>' npm run catalog:build -- --input catalog-publication.json --output-dir dist/catalog
   ```

5. Upload `dist/catalog/manifest.json` and `dist/catalog/packs/*.json` to the static host/CDN without changing app code.
6. Smoke-test the hosted manifest URL with `refreshCatalogFromManifest` or the Settings catalog refresh UI.
7. Keep the prior hosted catalog directory until users have had time to refresh, because offline users may still reference older pack versions.

## Verification checklist

- [ ] `npm test -- src/catalog/catalogPackBuilder.test.ts src/catalog/catalogRefresh.test.ts --runInBand`
- [ ] `npm run typecheck`
- [ ] Manifest and pack envelopes contain sha256 values generated from canonical payload JSON.
- [ ] Pack source and asset references are present for every new official or manually curated tile group.
- [ ] Migration records exist for renamed IDs, deprecated tiles, or legacy seed-shape input.
- [ ] A fresh SQLite catalog refresh can fetch the manifest + pack and upsert the new tile without a code release.

## Rollback

Publish a new manifest version that points back to the previous known-good pack versions. Do not mutate already-published envelope files in place; immutable URLs make checksum and support investigations sane.
