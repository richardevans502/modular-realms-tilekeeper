# Workspace Instructions for Kanban Workers

## ⚠️ CRITICAL

**All code MUST be written to the real project directory:**
```
/mnt/c/Users/kalsk/OneDrive/Projects/modular-realms-tilekeeper/
```

**Do NOT write code to:**
- `/home/workbench/src/`
- Kanban scratch workspaces
- Any other location

## Testing

Always run tests from the real project root:
```bash
cd /mnt/c/Users/kalsk/OneDrive/Projects/modular-realms-tilekeeper
npm test -- --runInBand
```

## SQLite Persistence

- Use the existing SQLite infrastructure in `src/db/`
- Follow patterns from `src/db/catalogRepository.ts` and `src/db/inventoryRepository.ts`
- Do NOT use in-memory Maps or arrays for persistent data
- All migrations go in `src/db/migrations/`
- Register migrations in `src/db/runMigrations.ts`

## Project Structure

| Directory | Purpose |
|---|---|
| `src/shared/` | Types, Zod schemas |
| `src/db/` | SQLite migrations, repositories |
| `src/catalog/` | Seed catalog, catalog loader |
| `src/inventory/` | Inventory CRUD, view models |
| `src/layout/` | Solver engine, placement grid |
| `src/storage/` | Backup/export |
| `docs/` | Project documentation |

## Git

- Commit often: `git add -A && git commit -m "description"`
- Push to GitHub: `git push origin master`
- Do not commit `node_modules/`, `.expo/`, or build artefacts

## Acceptance Criteria Format

Every task must include passing tests. Use Jest. Format:
```typescript
describe('feature name', () => {
  test('does the expected thing', () => {
    expect(actual).toEqual(expected);
  });
});
```

Last updated: 2026-06-04 — PM Labby, Lady of the Silver Castle
