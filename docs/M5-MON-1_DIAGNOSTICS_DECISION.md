# M5-MON-1 Crash/Error Monitoring Decision

Date: 2026-06-12
Approver: labby-default-privacy-gate
Decision: Local-only opt-in diagnostics export

## Decision

TileKeeper will not integrate Sentry or any external crash reporter for this milestone. The approved path is a local-only diagnostic export that the user explicitly generates from Settings > Diagnostics and shares through the native share sheet.

## Rationale

- The app handles inventory, layout goals, saved layouts, seeds, and solver traces that can become user-specific even when they are not obvious PII.
- No Sentry DSN, retention policy, or external crash-reporting approval exists yet.
- Local-only export keeps support data inspectable before it leaves the device and avoids third-party processing by default.
- This still supports debugging by collecting app version, solver version, solver timing/search counts, last navigation routes, and recent error stack traces.

## Collection contract

Collected only after the user taps Export diagnostics:

- app version
- solver version
- last N solver runs with timing/search counts/result counts/cache/cancelled flags
- last N navigation routes
- last N handled error messages and stack traces

Never collected:

- inventory contents or quantities
- generated/saved layout data
- layout goals or prompt text
- solver seeds
- device identifiers
- account identifiers
- network identifiers

## Future external crash reporting gate

Sentry or another external reporter can be reconsidered only after explicit approval, with a documented DSN/configuration, PII stripping enabled, opt-in consent copy, and tests proving inventory/layout/device identifiers are excluded.
