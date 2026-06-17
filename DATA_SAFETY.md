# Google Play Data Safety Answers

Use these answers for the Google Play Console Data safety form for TileKeeper.

## Collection and sharing summary

- **Does the app collect or share any required user data types?** No.
- **Data collected:** None.
- **Data shared with third parties:** None.
- **Tracking:** No tracking.
- **Advertising ID:** Not used.
- **Analytics SDKs:** None.
- **Advertising SDKs:** None.
- **Crash reporting SDKs:** None.
- **Account creation:** Not supported / not required.

## Data types checklist

Answer **No** / **Not collected** for each Google Play data category:

- Location: not collected.
- Personal info: not collected.
- Financial info: not collected.
- Health and fitness: not collected.
- Messages: not collected.
- Photos and videos: not collected.
- Audio files: not collected.
- Files and docs: not collected by the developer. User-created exports/backups remain local unless the user shares them through their device share sheet.
- Calendar: not collected.
- Contacts: not collected.
- App activity: not collected.
- Web browsing: not collected.
- App info and performance: not collected by the developer. Local diagnostics remain on-device unless the user explicitly exports and shares them.
- Device or other IDs: not collected.

## Security practices

- **Is all user data encrypted in transit?** Not applicable for user data because TileKeeper does not transmit user data. Optional catalog manifest refresh uses HTTPS for public catalog metadata.
- **Can users request that data be deleted?** Not applicable to developer-held data because TileKeeper does not collect user data. Users can delete local app data by deleting the app or removing exported/backed-up files they created.
- **Has the app committed to follow the Play Families Policy?** Only answer Yes if the final release is intentionally enrolled in Families; otherwise answer according to release targeting.
- **Independent security review:** No, unless one is completed before submission.

## Optional network request disclosure

TileKeeper may make an optional outbound HTTPS request when the user taps the catalog refresh control in Settings. This request fetches a public catalog manifest and does not include account data, personal identifiers, inventory contents, layout goals, saved layouts, backups, exports, diagnostics, or analytics events.

## Form-ready statement

TileKeeper is offline-first. The app does not collect, share, sell, or transmit user data, personal information, analytics, crash logs, advertising identifiers, inventory contents, layout goals, saved layouts, backups, exports, settings, or diagnostic logs. All user-created data stays on the device unless the user explicitly exports or shares a file using operating-system controls. Optional catalog refresh uses HTTPS to retrieve public catalog metadata only.
