# TileKeeper Art Bible & UI Style Guide

Version: 0.1 pre-production
Date: 2026-06-02
Owner: M1-ART-BIBLE / Nova
Status: Locked for Milestone 1 downstream planning

## 1. Design intent

TileKeeper is a practical mobile inventory and layout-planning app for tabletop terrain owners. Its art direction should feel like a tidy game-master's table: tactile fantasy materials, clear labels, strong contrast, and fast recognition of tile type and biome.

The app must not depend on detailed production artwork in v1. Terrain tiles should first be represented by schematic, readable shapes; detailed illustrations can be layered in later without changing the information architecture.

### Style pillars

- Clean fantasy utility: thematic enough to feel at home with dungeon terrain, but never so ornamental that it slows inventory entry.
- Tactile modularity: stone, timber, parchment, brass, and magnetic snap-fit cues.
- Readable at phone scale: every tile state must work at 44 px touch targets and small thumbnail sizes.
- Accessible by construction: colour plus icon, label, shape, and/or pattern; never colour alone.
- Rights-safe references: official Modular Realms website/products may inform broad domain cues, but production assets must be original unless reuse rights are confirmed.

### External visual observations used as broad reference

From the public Modular Realms homepage/product imagery observed during M1:

- Warm parchment/cream page base, oxblood/dark red navigation, charcoal text, gold/mustard accents.
- Terrain products are tactile, weathered fantasy pieces: grey stone, cracked masonry, dark wood, doors/walls, modular geometric forms.
- The strongest reusable direction is not the exact imagery, but the mood: clear hobbyist utility plus handmade fantasy terrain texture.

## 2. Mood boards by biome

These are textual mood boards for briefing artists, generating placeholder assets, and selecting UI swatches. They intentionally avoid copying any product photography.

### 2.1 Temperate — “Moss-Cut Ruins”

- Feeling: damp forest ruins, playable woodland clearings, old stone under green growth.
- Materials: mossy flagstone, fern clusters, wet bark, ivy seams, lichen, loamy soil.
- Shapes: rounded natural edges against square modular slabs; root curls crossing grid lines; soft grass tufts that do not obscure tile boundaries.
- Lighting: soft overcast daylight, muted green shadows, occasional warm campfire highlight.
- Tile readability cues: moss gathers in corners; grass never covers connector edges; broken stone outlines remain visible.
- UI accent use: safe/default biome, good for onboarding and neutral inventory examples.

### 2.2 Desert — “Sun-Baked Caravan Stone”

- Feeling: dry ruins, sandstone corridors, heat haze, buried temple fragments.
- Materials: ochre sandstone, cracked clay, worn rope, brass studs, faded painted glyphs.
- Shapes: chipped rectangular blocks, wind-smoothed bevels, dunes feathering around tile edges.
- Lighting: high sun, amber highlights, blue-violet cast shadows for contrast.
- Tile readability cues: strong engraved edge lines; sand texture kept low-frequency so labels remain readable.
- UI accent use: warning/low-resource states only when paired with icons; desert yellows can conflict with warnings if overused.

### 2.3 Tundra — “Frost-Locked Bastion”

- Feeling: cold fortification, snow-dusted stone, frozen timber bridges.
- Materials: blue-grey stone, powder snow, ice glaze, frost-rimed iron, pale wood.
- Shapes: angular ice chips, snow banks that sit outside functional connection lines, sharp icicle silhouettes.
- Lighting: cool skylight, pale cyan edge highlights, dark navy crevices.
- Tile readability cues: snow should frame cells, not erase grid; ice highlights trace traversal paths sparingly.
- UI accent use: disabled/cold states, calm secondary panels, filtered views.

### 2.4 Volcanic — “Forge-Scarred Depths”

- Feeling: dangerous undercroft, basalt floor plates, lava fissures, heat-stained metal.
- Materials: black basalt, ember cracks, soot, obsidian chips, tarnished iron grates.
- Shapes: jagged diagonals, cracked stone seams, vents, scorched edges.
- Lighting: low ambient darkness with orange-red underglow; high contrast but controlled saturation.
- Tile readability cues: lava is an accent line, not a full fill; animated glow optional only in premium/later polish.
- UI accent use: destructive/error/danger states only with shape and icon support.

### 2.5 Oceanic — “Tideworn Reef Vault”

- Feeling: coastal caves, submerged ruins, tide pools, shipwreck-adjacent dungeon spaces.
- Materials: teal water, sea-smoothed stone, kelp, coral chips, barnacles, wet timber.
- Shapes: wave-carved channels, rounded shells, water insets, bridgeable gaps.
- Lighting: cool green-blue ambience, rippled highlight bands, pearl/foam accents.
- Tile readability cues: water and passability must be distinct; use wave pattern for water, dotted stepping-stone marks for traversable shallows.
- UI accent use: info/help states and layout-generation “flow” affordances.

### 2.6 Corrupted — “Violet Blight Engine”

- Feeling: magical rot, cursed portal geometry, reality-warped dungeon modules.
- Materials: dark stone, violet crystal, sickly green glow, black roots, fractured runes.
- Shapes: asymmetrical cracks, thorn silhouettes, floating shard motifs, warped connector frames.
- Lighting: deep purple shadows, acidic green highlights, restrained magenta bloom.
- Tile readability cues: corruption overlays must not distort the actual tile footprint; use corner sigils and border treatments instead.
- UI accent use: invalid layout, missing dependency, conflict state — only after accessibility checks because purple/green can fail for some users.

## 3. Colour system

### 3.1 Core UI palette

| Token | Hex | Use | Notes |
|---|---:|---|---|
| `ink-900` | `#171414` | Primary text, icons | Near-black with warm cast. |
| `ink-700` | `#3A3230` | Secondary text | Use on parchment/stone. |
| `parchment-050` | `#FFF8E6` | App background | Warm tabletop surface. |
| `parchment-100` | `#F3E7C9` | Panels/cards | Default panel fill. |
| `stone-300` | `#A9A39A` | Borders, inactive tile outlines | Neutral terrain grey. |
| `stone-600` | `#5E5A54` | Strong dividers, schematic walls | High-contrast map lines. |
| `oxblood-700` | `#6B1212` | Primary app bar, destructive accent base | Inspired by fantasy shop nav; not used for text on dark. |
| `brass-500` | `#C99731` | Primary CTA, selection stroke | Use with ink text, not white. |
| `moss-600` | `#4D6B3C` | Success/available inventory | Pair with check icon. |
| `aether-500` | `#2F7D9A` | Info/generated layout | Pair with sparkle/flow icon. |
| `ember-600` | `#B24B2A` | Warning/attention | Pair with warning triangle. |
| `violet-700` | `#5B3A83` | Corrupted/invalid variant | Pair with conflict glyph. |
| `paper-white` | `#FFFDF7` | Inputs, modal surfaces | Use for forms and editable fields. |

### 3.2 Biome palettes

Each biome receives five swatches: base, surface, shadow, accent, and label-safe dark.

| Biome | Base | Surface | Shadow | Accent | Label-safe dark |
|---|---:|---:|---:|---:|---:|
| Temperate | `#6F8B4B` | `#A7B879` | `#39442D` | `#7A5A35` | `#24301E` |
| Desert | `#C89145` | `#E7C27A` | `#7A4A21` | `#2E6F7E` | `#3D2815` |
| Tundra | `#9EB9C7` | `#DCEAF0` | `#415666` | `#6E8FA8` | `#213341` |
| Volcanic | `#2D2A2A` | `#5A4540` | `#151313` | `#E06024` | `#FFF0D7` |
| Oceanic | `#2E8390` | `#8FC8C0` | `#1B4655` | `#D7B36A` | `#12303B` |
| Corrupted | `#4A315F` | `#71508A` | `#241A2E` | `#A7D946` | `#F5E9FF` |

### 3.3 Colour-blind-safe status palette

Use the Okabe-Ito family for functional status colours. Functional status must always include an icon and/or pattern.

| Status | Token | Hex | Icon/pattern companion |
|---|---|---:|---|
| Selected / primary action | `cb-blue` | `#0072B2` | 2 px solid outline + check mark. |
| Available / success | `cb-green` | `#009E73` | Check mark + subtle diagonal hatch when used on tiles. |
| Warning / partial match | `cb-orange` | `#E69F00` | Triangle + dotted border. |
| Error / impossible layout | `cb-red` | `#D55E00` | Octagon/exclamation + crosshatch. |
| Info / generated suggestion | `cb-sky` | `#56B4E9` | Spark/flow glyph + dashed outline. |
| Missing / unknown | `cb-purple` | `#CC79A7` | Question mark + long-dash outline. |
| Neutral / disabled | `cb-grey` | `#6F6F6F` | 40% opacity + lock icon if unavailable. |

### 3.4 Contrast rules

- Body text minimum contrast: WCAG AA 4.5:1.
- Large labels/icons: minimum 3:1, target 4.5:1.
- Touch states: do not encode with colour alone; use stroke thickness, icon, fill, and text.
- Tile thumbnails: labels use `ink-900` on light biomes; use `paper-white` or biome `Label-safe dark` inverse on volcanic/corrupted surfaces.

## 4. Typography hierarchy

The app should load web fonts only if the chosen mobile framework supports reliable bundling. Otherwise use platform fallbacks while preserving the hierarchy.

| Role | Preferred font | Fallback | Size guidance | Rationale |
|---|---|---|---|---|
| App title / splash | Cinzel SemiBold | Georgia / serif | 28–34 sp | Fantasy-adjacent Roman forms without full novelty-font chaos. Use sparingly. |
| Section headers | Atkinson Hyperlegible Bold | System UI Bold | 20–24 sp | Accessible, readable, strong on mobile. |
| Body copy | Atkinson Hyperlegible Regular | System UI / Roboto / San Francisco | 15–17 sp | Clear for notes, settings, and empty states. |
| UI labels/buttons | Atkinson Hyperlegible Medium | System UI Medium | 14–16 sp | Works in compact controls and chips. |
| Tile codes/data | JetBrains Mono Medium | SF Mono / Roboto Mono | 12–14 sp | Stable digits for quantities, coordinates, IDs. |

### Type rules

- Never use the title font for paragraphs or form labels.
- Keep tile thumbnail text short: 1–2 lines, max 12 characters per line before truncation.
- Quantity badges use mono numerals where possible.
- Minimum accessible text size in production: 12 sp only for secondary metadata; 14 sp for actionable labels.

## 5. Iconography style guide

### Grid and geometry

- Base icon grid: 24 x 24 px.
- Export sizes: 24, 32, 48, 96 px where raster export is required; prefer SVG/vector for framework support.
- Stroke weight: 2 px at 24 px grid.
- Stroke caps/joins: round caps and round joins for friendly utility; square joins only for map/wall glyphs.
- Corner radius: 2 px for small UI glyphs, 4 px for larger panel icons.
- Filled icons: reserve for selected/active state; outlines for default.

### Visual language

- Use simple tabletop metaphors: bag/inventory, stacked tile, compass/layout, wand/generate, bookmark/save, scroll/source, gear/settings.
- Tile compatibility icons use edge glyphs, not colour: `N`, `E`, `S`, `W` pips, doorway notch, wall bar, water wave, hazard crack.
- Biome icons should be readable as silhouettes at 16 px: leaf, dune, snowflake, flame, wave, thorn/crystal.
- Avoid overly detailed fantasy art in UI icons; keep the detail in biome thumbnails and splash illustrations.

### State overlays

| State | Overlay | Stroke/fill convention |
|---|---|---|
| Owned | small check badge bottom-right | `cb-green`, white check. |
| Missing | question badge bottom-right | `cb-purple`, long-dash outline. |
| In generated layout | sparkle/flow marker top-left | `cb-sky`, dashed selection stroke. |
| Invalid placement | octagon/exclamation centre | `cb-red`, crosshatch background. |
| Favourite | bookmark/star top-right | `brass-500`, filled only when active. |

## 6. Keeper character design brief

The “Keeper” is the app’s guide/avatar, not a required constant mascot on every screen. It should be charming but subordinate to usability.

### Role

- In onboarding: explains inventory, catalog, and layout generation.
- In empty states: suggests next action, e.g. “Add your first tile.”
- In errors: clarifies what is missing without blaming the user.

### Silhouette language

- Compact hooded game-master silhouette with a small lantern, satchel, measuring cord, and tile stack.
- Head/shoulders readable at 64 px; full body readable at 256 px.
- Avoid thin limbs or fiddly props that vanish on mobile.
- Shape hierarchy: round friendly head/hood, square tile satchel, triangular lantern glow.

### Equipment readability

- Satchel: communicates inventory; should show one visible square/rectangular tile edge.
- Lantern: communicates discovery/generation; glow can colour-shift by biome in illustrations.
- Measuring cord/compass: communicates layout planning.
- Optional staff/wand: only if generation needs a magical affordance; keep it visually distinct from a weapon.

### Expression and tone

- Helpful, slightly mischievous, never childish.
- Poses: pointing at tile grid, holding checklist, lifting missing-tile sign, peering through magnifier.
- Avoid official Modular Realms marks, logos, or product likenesses unless permission is later confirmed.

## 7. Environment asset naming convention

Use lowercase kebab-case. Asset names must be searchable by domain, biome, category, and variant.

### Pattern

`<domain>/<biome>/<category>/<asset-name>--<variant>.<ext>`

Recommended root paths:

```text
assets/
  environment/
    temperate/
      tiles/
      props/
      overlays/
      thumbnails/
    desert/
      tiles/
      props/
      overlays/
      thumbnails/
    tundra/
      tiles/
      props/
      overlays/
      thumbnails/
    volcanic/
      tiles/
      props/
      overlays/
      thumbnails/
    oceanic/
      tiles/
      props/
      overlays/
      thumbnails/
    corrupted/
      tiles/
      props/
      overlays/
      thumbnails/
  ui/
    icons/
    components/
    backgrounds/
  keeper/
    poses/
    expressions/
  tile-reference/
    official-unlicensed/
    user-custom/
```

### Naming examples

```text
assets/environment/temperate/tiles/floor-square-2x2--moss-a.svg
assets/environment/desert/overlays/edge-sand-drift--nw.svg
assets/environment/tundra/thumbnails/biome-card--default.webp
assets/environment/volcanic/props/lava-vent--small-a.svg
assets/environment/oceanic/tiles/water-channel-1x2--shallow.svg
assets/environment/corrupted/overlays/conflict-border--thorn.svg
assets/ui/icons/icon-inventory--outline.svg
assets/ui/icons/icon-layout-generate--filled.svg
assets/keeper/poses/keeper-empty-inventory--light.webp
```

### Required metadata fields for asset catalog entries

- `id`: stable kebab-case identifier.
- `path`: relative asset path.
- `biome`: one of `temperate`, `desert`, `tundra`, `volcanic`, `oceanic`, `corrupted`, or `neutral`.
- `category`: `tile`, `prop`, `overlay`, `thumbnail`, `ui-icon`, `component`, `keeper`.
- `size`: logical grid footprint where relevant, e.g. `1x1`, `1x2`, `2x2`.
- `source`: `original`, `official-reference-permission-confirmed`, or `user-provided`.
- `rights_note`: short note; do not leave blank for official-reference-related material.
- `accessibility_note`: label/pattern/icon fallback when colour is meaningful.

### Rights and reference rule

The folder `assets/tile-reference/official-unlicensed/` may hold internal notes or screenshots only if project policy later permits it. Do not ship, publish, or commit official Modular Realms imagery into production assets without confirmed usage rights.

## 8. UI component library spec

### 8.1 Layout baseline

- Mobile-first viewport: 360 x 800 logical px minimum.
- Spacing scale: 4, 8, 12, 16, 24, 32 px.
- Touch target: minimum 44 x 44 px.
- Corner radii: 8 px for inputs/buttons, 12 px for cards/panels, 16 px for bottom sheets.
- Elevation: prefer border + tonal contrast over heavy shadows; tabletop map surfaces should feel flat and legible.

### 8.2 Buttons

Primary button:

- Fill: `brass-500`.
- Text: `ink-900`, Atkinson Hyperlegible Bold 16 sp.
- Radius: 8 px.
- Height: 48 px.
- Pressed: darken fill by 8%, inset 1 px.
- Disabled: `stone-300` fill, `ink-700` at 60%, lock or unavailable icon where meaning matters.

Secondary button:

- Fill: transparent or `parchment-100`.
- Border: 1.5 px `stone-600`.
- Text/icon: `ink-900`.

Danger button:

- Fill: `cb-red`.
- Text: `paper-white`.
- Icon: exclamation or trash; never red-only.

### 8.3 Panels and cards

Inventory card:

- Fill: `paper-white`.
- Border: 1 px `stone-300`.
- Left accent strip: biome base colour plus biome icon.
- Contents: tile name, set/source, quantity stepper, owned/missing state.

Catalog card:

- Larger thumbnail area with schematic tile image.
- Metadata chips: biome, footprint, edge type, source.
- Use `source` chip for official/custom distinction.

Layout preview panel:

- Background: `parchment-050` with faint 8 px grid.
- Tile outlines: `stone-600`, 2 px.
- Selected tile: `cb-blue`, 2 px outline, check badge.
- Missing tile ghost: 40% opacity, long-dash outline, question badge.

### 8.4 Sliders and steppers

Quantity stepper:

- Minus and plus buttons: 44 px square.
- Quantity number: JetBrains Mono Medium, 18 sp, centred.
- Long press may accelerate in future; initial version should prefer predictable single increments.

Constraint slider:

- Track: `stone-300`.
- Active track: `aether-500`.
- Thumb: `brass-500` with 2 px `ink-900` outline.
- Include numeric value label; never slider-only.

### 8.5 Tooltips, empty states, and dialogs

Tooltip:

- Fill: `ink-900`.
- Text: `paper-white`, 13–14 sp.
- Max width: 280 px.
- Arrow optional; if used, 8 px.

Empty state:

- Keeper pose or simple icon at top.
- Header: one clear sentence.
- Body: one practical explanation.
- CTA: one primary action, one optional secondary link.

Dialog/bottom sheet:

- Radius: 16 px top corners on bottom sheet.
- Scrim: `ink-900` at 45%.
- Destructive confirmation requires named action label, e.g. “Remove tile”, not generic “OK”.

### 8.6 Navigation and HUD screens covered

This palette/spec is sufficient to mock:

- Inventory list and detail editor.
- Catalog browser and filter sheet.
- Layout generator setup screen.
- Layout preview grid with missing-tile suggestions.
- Saved layouts list/detail.
- Settings/import-export.
- Empty states and error states.

## 9. Schematic tile rendering conventions

- Default schematic tile footprint uses a 4 px internal padding from card edge.
- Edges use semantic marks:
  - Wall: solid dark bar.
  - Door/opening: centred notch with brass hinge dot.
  - Water: wave pattern.
  - Hazard/lava: crack pattern.
  - Corruption/conflict: thorn/crosshatch border.
- Rotation indicator: small north pip, not text-only.
- Quantity badge: top-right circular badge, `brass-500` fill, mono number.
- Labels: below thumbnail on cards; inside tile only for large layout preview cells.

## 10. Implementation handoff checklist

Future asset/UI tasks should follow this checklist before accepting a file:

- Path matches the naming convention.
- Biome token exists and is used consistently.
- Functional colour has icon/pattern companion.
- Asset has rights/source metadata.
- SVG/icon renders cleanly at 24 px and 48 px.
- Tile thumbnail is readable in a 72 px card image.
- Text contrast checked against intended background.
- Component state includes default, pressed/focused, disabled, and error where applicable.

## 11. Open risks for Risk Register

- Official product image reuse may require explicit permission; assume no reuse until confirmed.
- Detailed biome art could overtake v1 scope; schematic assets should remain the MVP baseline.
- Six biomes may be more than the initial product catalog supports; implement neutral/default first, then add biome variants as metadata demands.
- Colour meanings can collide with biome colours; functional status palette must override biome palette for state communication.
- Font licensing and mobile bundling need confirmation during tech architecture/framework selection.
