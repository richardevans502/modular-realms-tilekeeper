# M5-PRIV-1 Store Submission Pack

## Review status

**Approved by Rich on 2026-06-19.** The current framed web-derived screenshots are accepted as-is for store submission; physical-device recapture is deferred as non-blocking.

gh-pages branch pushed to GitHub remote on 2026-06-19 (commit `c410d96`).

## Privacy policy

- Public URL: https://richardevans502.github.io/modular-realms-tilekeeper/PRIVACY_POLICY.md
- Source document: `PRIVACY_POLICY.md`
- In-app link: Settings > Privacy > Open privacy policy
- Verified by: `curl -I -L https://richardevans502.github.io/modular-realms-tilekeeper/PRIVACY_POLICY.md` returned HTTP 200 on 2026-06-19.

Required disclosure points covered:

- TileKeeper is offline-first.
- TileKeeper does not collect PII.
- TileKeeper does not use analytics, advertising, tracking, or crash-reporting SDKs.
- Local inventory, layout goals, saved layouts, backups, exports, settings, and diagnostics remain on device unless the user explicitly exports or shares a file.
- Optional outbound HTTPS is limited to user-initiated catalog manifest refresh for public catalog metadata.

## Store metadata

- Draft source: `STORE_METADATA.md`
- Title: TileKeeper
- Apple subtitle: Offline layout planner
- Google short description: Plan tabletop inventories offline with private layout previews and exports.
- Primary category: Games
- Secondary category: Productivity (Apple) / Tools (Google, if requested)
- Keywords and full description are drafted in `STORE_METADATA.md`.

## Support/contact

- Draft source: `SUPPORT_CONTACT.md`
- Recommended initial support URL: https://github.com/richardevans502/modular-realms-tilekeeper/issues
- Draft support email: support@tilekeeper.app
- Store support copy is drafted in `SUPPORT_CONTACT.md`.

## Google Play Data Safety

- Draft source: `DATA_SAFETY.md`
- Data collected: none.
- Data shared: none.
- Tracking: none.
- Advertising ID: not used.
- Analytics, advertising, and crash SDKs: none.
- Optional catalog manifest refresh uses HTTPS and does not send user-created data.

## Screenshot assets

Draft framed screenshots are present at:

1. `screenshots/store/inventory-framed.png`
2. `screenshots/store/layout-goal-framed.png`
3. `screenshots/store/preview-framed.png`
4. `screenshots/store/saved-layouts-framed.png`
5. `screenshots/store/export-framed.png`
6. `screenshots/store/settings-privacy-framed.png`

Source captures are preserved at:

1. `screenshots/native-store/inventory.png`
2. `screenshots/native-store/layout-goal.png`
3. `screenshots/native-store/preview.png`
4. `screenshots/native-store/saved-layouts.png`
5. `screenshots/native-store/export.png`
6. `screenshots/native-store/settings-privacy.png`

All listed PNGs were verified locally as 1290 × 2796.

### Screenshot release blocker — RESOLVED

The current screenshot set was generated from the production Expo web build at a mobile viewport and then framed. **Rich explicitly approved these as-is on 2026-06-19.** Physical-device recapture is deferred as non-blocking.

## Verification performed

- `npm run typecheck` — passed.
- `npm test -- --runInBand` — 27 suites passed, 130 tests passed.
- `npm run build:web` — passed, exported `dist-web`.
- `curl -I -L https://richardevans502.github.io/modular-realms-tilekeeper/PRIVACY_POLICY.md` — HTTP 200.

## Human approval — COMPLETED

All items approved by Rich on 2026-06-19:

- Privacy policy legal/product review — **approved**.
- Store copy/category/keyword approval — **approved**.
- Screenshot decision — **current generated framed assets approved as-is**; physical-device recapture deferred.
- Support contact — GitHub Issues approved as initial support URL; `support@tilekeeper.app` deferred.
