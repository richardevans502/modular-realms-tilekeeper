# Architecture Notes

Initial architecture notes for a future mobile implementation.

## Suggested module boundaries

- `catalog` — tile definitions, source references, catalog search/filtering.
- `inventory` — owned quantities, custom tile entries, import/export hooks.
- `layout` — layout generation, placement rules, saved layouts.
- `shared` — common models, validation, storage abstractions, utilities.

## Early technical recommendation

Keep layout generation independent from UI rendering. Treat it as a deterministic service that accepts inventory and constraints, then returns candidate layouts. This will make it easier to unit test and later port between mobile frameworks if the stack changes.
