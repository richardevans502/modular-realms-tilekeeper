# Product Requirements Document: Modular Realms Tilekeeper

> **RETIRED DOCUMENT**
>
> **Status:** Superseded  
> **Superseded by:** `PRD_v2.0.md`  
> **Retired date:** 2026-06-03  
> **Reason:** Scope pivot from inventory-only utility to TileKeeper v2.0 app baseline.  
> **Action:** Do not use for implementation decisions. Refer to `PRD_v2.0.md` for authoritative product direction.

---

## 1. Product summary

Modular Realms Tilekeeper is a planned Android and iOS mobile app for hobbyists who own or browse Modular Realms terrain tiles. The app will help users catalog the tiles they own, understand the tile types available from Modular Realms, and generate possible table layouts based on inventory constraints.

The primary source for official product and tile information is the Modular Realms website: https://www.modularrealms.com

## 2. Problem statement

Modular terrain collections become difficult to manage as users acquire more tiles, sets, and accessories. Users need a lightweight way to answer practical questions:

- Which Modular Realms tiles do I own?
- How many of each tile type are available for a game setup?
- What layouts can I build with my current inventory?
- Which missing tiles would unlock more layout options?

## 3. Target users

- Tabletop gamers who use Modular Realms terrain for campaigns or one-shot sessions.
- Collectors who want an inventory of owned Modular Realms tiles.
- Game masters who need to plan repeatable encounter layouts.
- Buyers comparing desired layouts against tiles listed on the Modular Realms website.

## 4. Target platforms

### Initial platforms

- Android phones
- iPhones

### Future platform considerations

- Android tablets and iPads for larger layout previews.
- Desktop/web companion only if mobile workflows prove insufficient.

## 5. Core goals

- Provide a simple inventory of owned Modular Realms tiles.
- Let users browse or define tile metadata based on Modular Realms product information.
- Generate layout suggestions from available inventory.
- Allow users to save favorite or campaign-specific layouts.
- Keep the experience fast, offline-friendly, and easy to update as new tiles are added.

## 6. Key features

### 6.1 Tile catalog

- Maintain a catalog of tile types inspired by official Modular Realms product information.
- Store basic tile attributes such as name, category, dimensions/shape, edge compatibility, artwork/theme, and notes.
- Include a source/reference field linking back to https://www.modularrealms.com where appropriate.

### 6.2 Inventory management

- Add, edit, and remove owned tiles.
- Track quantity owned per tile type.
- Support custom/user-defined tiles if official catalog coverage is incomplete.
- Provide search and filtering by name, category, set, or theme.

### 6.3 Layout generation

- Generate possible layouts using only tiles in the user's inventory.
- Respect basic constraints such as tile count, dimensions, required connections, and user-selected theme.
- Flag layouts that require missing tiles.
- Allow users to regenerate or refine layout suggestions.

### 6.4 Saved layouts

- Save generated or manually assembled layouts.
- Add notes for scenario, campaign, encounter, or table size.
- Mark favorites for quick reuse.

### 6.5 Data import/export

- Export inventory and saved layouts for backup.
- Import a previous backup on a new device.
- Keep data portable to avoid lock-in.

## 7. Initial design considerations

### User experience

- Prioritize quick inventory entry: users should be able to add repeated tile quantities with minimal taps.
- Make layout generation feel visual, but keep the first version simple enough to implement.
- Use clear empty states explaining that tile data is based on Modular Realms product references.
- Support offline use after initial catalog data is available.

### Information architecture

Recommended primary navigation:

1. Inventory — owned tile list and quantities.
2. Catalog — available/known Modular Realms tile types.
3. Layouts — generated and saved layouts.
4. Settings — import/export, data source notes, app preferences.

### Visual direction

- Use a clean, game-table-inspired interface with high contrast and readable tile labels.
- Represent tiles with simple schematic shapes before investing in detailed artwork.
- Keep color coding accessible and avoid relying on color alone for tile compatibility.

### Data model considerations

Initial entities likely include:

- `TileType` — canonical tile definition.
- `InventoryItem` — user-owned quantity for a tile type.
- `Layout` — saved arrangement and metadata.
- `LayoutTilePlacement` — tile instance, position, rotation, and adjacency details.
- `SourceReference` — links and notes for Modular Realms website references.

### Technical considerations

- Choose a cross-platform mobile framework later, e.g. React Native, Flutter, Kotlin Multiplatform, or native Android/iOS.
- Use local-first storage for inventory and saved layouts.
- Keep tile catalog data versioned so official website-derived information can be updated.
- Separate layout generation logic from UI code so it can be tested independently.

## 8. Non-goals for this phase

- No production UI implementation.
- No working app screens.
- No complete official tile database.
- No automated website scraping.
- No detailed algorithm design for layout generation.

## 9. Assumptions and dependencies

- Modular Realms website content is the authoritative public reference for tile/product information.
- The first implementation will use manually curated tile metadata unless a later task approves automated collection.
- Users may own custom or legacy tiles not represented on the current website, so custom entries should be supported.

## 10. Open questions

- Which cross-platform mobile framework should be used?
- What tile attributes are essential for layout compatibility?
- Should layout generation be grid-based, graph-based, or manually assisted in the first version?
- Does Modular Realms provide product images or metadata that can be reused with permission?
- Should catalog updates be bundled with app releases or fetched from a remote source?

## 11. Initial success metrics

- User can record an inventory of owned tiles.
- User can generate at least one valid layout from inventory.
- User can save and reopen a layout.
- User can identify which missing tiles would improve or complete a layout.
