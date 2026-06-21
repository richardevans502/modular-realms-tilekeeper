# Modular Realms TileKeeper — Decision Log

## 2026-06-19 — Defer signed iOS/TestFlight parity out of M5

**Status:** Accepted  
**Decision owner:** Nova proxy PM, pending Rich Apple Developer account setup

### Context

M5-BUILD-1 repeatedly verified that the Expo/React Native project can produce iOS simulator builds through EAS, and the core project checks continue to pass. Signed iOS physical-device and TestFlight builds remain blocked because Apple Developer/App Store Connect credentials, certificates, and provisioning profiles are not available to the headless build workers.

### Decision

For the v1.0 release candidate, Android is the M5 release/build gate. Signed iOS physical-device builds and TestFlight distribution are formally deferred to M6 or later. The iOS work resumes only after Rich completes Apple Developer/App Store Connect setup and EAS can validate the required signing credentials non-interactively.

### Consequences

- M5 acceptance criteria must not require iOS/TestFlight for the v1.0 release candidate.
- Existing iOS simulator build evidence and the M5-BUILD-1 runbook remain active reference material.
- Android store readiness, privacy/store metadata, diagnostics, accessibility, and performance remain in M5 scope.
- The risk register tracks iOS signing as a known external dependency rather than an active blocker for Android release readiness.

### Reopen trigger

Reopen iOS parity when Apple Developer account access, App Store Connect submission credentials, EAS-managed distribution certificates, and provisioning profiles are configured and testable from a trusted terminal.
