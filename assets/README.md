# Assets

Placeholder for app icons, tile reference imagery, generated layout thumbnails, and design assets.

Do not add Modular Realms images here unless usage rights are confirmed.

## Locked M1 art conventions

Primary visual guide: `docs/art-bible-ui-style-guide.md`
Design token source: `config/style-tokens.json`

## Asset folder structure

```text
assets/
  environment/
    temperate/{tiles,props,overlays,thumbnails}/
    desert/{tiles,props,overlays,thumbnails}/
    tundra/{tiles,props,overlays,thumbnails}/
    volcanic/{tiles,props,overlays,thumbnails}/
    oceanic/{tiles,props,overlays,thumbnails}/
    corrupted/{tiles,props,overlays,thumbnails}/
  ui/{icons,components,backgrounds}/
  keeper/{poses,expressions}/
  tile-reference/{official-unlicensed,user-custom}/
```

## Naming pattern

Use lowercase kebab-case:

`<domain>/<biome>/<category>/<asset-name>--<variant>.<ext>`

Examples:

- `assets/environment/temperate/tiles/floor-square-2x2--moss-a.svg`
- `assets/environment/desert/overlays/edge-sand-drift--nw.svg`
- `assets/ui/icons/icon-inventory--outline.svg`
- `assets/keeper/poses/keeper-empty-inventory--light.webp`

Every production asset must carry source/rights metadata in the eventual asset catalog. Treat official Modular Realms imagery as reference-only unless reuse permission is confirmed.
