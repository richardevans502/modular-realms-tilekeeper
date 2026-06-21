# Support & Contact

## Contact us

If you have questions, feedback, or need help with TileKeeper, use one of these support routes:

- **Support email draft:** support@tilekeeper.app
- **Project issues:** https://github.com/richardevans502/modular-realms-tilekeeper/issues

Suggested response-time copy for store listings: **We aim to respond to support requests within 48 hours.**

## Store support text

TileKeeper stores inventory, layouts, backups, exports, settings, and diagnostics locally on your device. If you contact support, please include:

1. The TileKeeper app version shown in Settings > About.
2. Your device model and OS version.
3. Steps to reproduce the issue.
4. Any error message shown in the app.
5. Optional: a diagnostic export from Settings > Diagnostics, if you choose to share it.

Do not send private inventory data unless you intentionally choose to export and share it.

## Diagnostics replay workflow

Use this flow when a layout-generation or import issue needs support reproduction:

1. Ask the user to open **Settings > Diagnostics** and export a diagnostics file only if they are comfortable sharing it.
2. Confirm the export says it is local-only, opt-in, and includes an anonymized layout fixture. Do not request screenshots or raw exports containing inventory names, saved layout names, goal text, seeds, device identifiers, account identifiers, or network identifiers.
3. Save the file outside the repo or in an ignored support scratch folder, then run:

   ```bash
   npm run diagnostics:replay -- /path/to/tilekeeper-diagnostics.json
   ```

4. Copy the sanitized replay summary into a GitHub issue using **Known layout/import issue**. Include app version, solver version, catalog version, expected behavior, actual behavior, and reproduction command.
5. Delete the local diagnostics file when the support case is resolved unless it must be retained for an active bug investigation.

The replay script prints only solver/catalog metadata and aggregate layout counts. It should not print raw tile names, inventory notes, custom tile IDs, user seed values, or goal text.

## Known issues tracker

- Use GitHub Issues for known support-reproducible problems: https://github.com/richardevans502/modular-realms-tilekeeper/issues
- Use the `.github/ISSUE_TEMPLATE/known_layout_issue.yml` template for layout/import issues reproduced from diagnostics exports.
- Label reproduced support cases with `support`, `diagnostics`, and `layout`.

## Public links

- **Project:** https://github.com/richardevans502/modular-realms-tilekeeper
- **Privacy Policy:** https://richardevans502.github.io/modular-realms-tilekeeper/PRIVACY_POLICY.md

## App Store / Play Store support URL recommendation

Use the GitHub Issues URL for the first submission unless/until `support@tilekeeper.app` is confirmed live or a dedicated support form is published.
