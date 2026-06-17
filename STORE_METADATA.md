# TileKeeper Store Metadata Draft

## Store listing identity

- **App name / title:** TileKeeper
- **Apple subtitle (≤30 chars):** Offline layout planner
- **Google short description (≤80 chars):** Plan tabletop inventories offline with private layout previews and exports.
- **Primary category:** Games
- **Secondary category:** Productivity (Apple) / Tools (Google, if a secondary category is requested)
- **Content rating posture:** No user-generated public content, no ads, no purchases, no account system.

## Full description

TileKeeper helps tabletop gamers organise tiles, cards, miniatures, and modular terrain before game night. Build an inventory, set a layout goal, preview the fit, save favourite arrangements, and export layouts for sharing or backup.

TileKeeper is designed to be offline-first and privacy-focused. Core features work without an account and without analytics. Your inventory, layout goals, saved layouts, backups, exports, settings, and diagnostics stay on your device unless you choose to export or share a file.

Key features:

- Offline-first inventory management for tabletop components.
- Layout goal planning for target table sizes and setup constraints.
- Visual previews to check tabletop fit before setup.
- Saved layouts for repeat scenarios and favourite arrangements.
- JSON export and full backup/restore tools for portability.
- Local diagnostics export when you choose to share troubleshooting details.
- Optional HTTPS catalog manifest refresh; no analytics, advertising, or tracking SDKs.
- Settings include a Privacy section linked to the public privacy policy.

## Keywords

### Apple keyword field draft (≤100 chars)

inventory,tabletop,RPG,tiles,cards,miniatures,layout,offline,planner,board games

### Google Play keyword themes

Use naturally in listing copy rather than keyword stuffing:

- tabletop inventory planner
- board game layout planner
- RPG terrain organiser
- modular tiles and miniatures
- offline inventory app
- privacy-focused game aid

## Promotional text / what's new seed copy

- **Promotional text:** Plan tabletop inventories offline, preview layouts, save favourite setups, and export your data whenever you choose.
- **Initial release notes:** Initial TileKeeper release with offline inventory, layout goals, visual preview, saved layouts, export, backup/restore, diagnostics export, and privacy-first settings.

## Support and privacy URLs

- **Privacy Policy:** https://richardevans502.github.io/modular-realms-tilekeeper/PRIVACY_POLICY.md
- **Support:** https://github.com/richardevans502/modular-realms-tilekeeper/issues
- **Support email draft:** support@tilekeeper.app

## Screenshot set

Current device-framed screenshot assets are in `screenshots/store/`:

1. Inventory — `screenshots/store/inventory-framed.png`
2. Layout Goal — `screenshots/store/layout-goal-framed.png`
3. Preview — `screenshots/store/preview-framed.png`
4. Saved Layouts — `screenshots/store/saved-layouts-framed.png`
5. Export — `screenshots/store/export-framed.png`
6. Settings / Privacy — `screenshots/store/settings-privacy-framed.png`

Source captures are preserved under `screenshots/native-store/`.

### Screenshot capture caveat

The current assets were regenerated from the production Expo web build rendered at an iPhone-sized mobile viewport (`390×844` CSS, 3× DPR) and placed into a realistic modern phone frame. They are suitable as draft review materials, but they do **not** satisfy the stricter acceptance criterion of captures from a physical device. Before final App Store / Play Store upload, replace them with approved physical-device captures or explicitly approve the current synthetic framed set.

### Known issues visible in current captures

The screenshots accurately reflect the current production UI; they are not retouched. Notable polish issues visible in the captures:

- Inventory screen shows all-zero stats and an empty/default state.
- Layout Goal screen has a `Height` input that visually overflows its card on narrow viewports.
- Preview screen shows overlapping tile labels in the schematic grid and redundant "Layout Preview" header text (Stack header + screen header).
- Saved Layouts screen is in empty state.

These are app-level UI/UX issues, not screenshot-generation defects. Address before final store submission if the review gate requires pixel-perfect marketing captures.
