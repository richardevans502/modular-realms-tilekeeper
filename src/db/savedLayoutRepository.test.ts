import { DatabaseSync } from 'node:sqlite';
import { ZodError } from 'zod';

import { createSavedLayoutRepository, type SavedLayout } from './savedLayoutRepository';
import { runMigrations, type TileKeeperDatabase } from './runMigrations';
import type { Layout } from '../shared/types';

class NodeSqliteAdapter implements TileKeeperDatabase {
  constructor(private readonly db: DatabaseSync) {}

  async execAsync(sql: string): Promise<void> {
    this.db.exec(sql);
  }

  async getFirstAsync<T>(sql: string, params: unknown[] = []): Promise<T | null> {
    return (this.db.prepare(sql).get(...(params as never[])) as T | undefined) ?? null;
  }

  async getAllAsync<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    return this.db.prepare(sql).all(...(params as never[])) as T[];
  }

  async runAsync(sql: string, params: unknown[] = []): Promise<void> {
    this.db.prepare(sql).run(...(params as never[]));
  }
}

const layoutPayload: Layout = {
  id: 'generated-castle-entry',
  placements: [
    {
      tile_type_id: 'mr-real-1x1-floor',
      face_id: 'face-stone',
      x: 0,
      y: 0,
      rotation: 0,
      grid_cells: [{ x: 0, y: 0 }],
    },
  ],
  seed: 'castle-entry-seed',
  goal: 'Tiny castle entrance',
  solver_version: 'solver-0.3.0',
  catalog_version: '2026.06.03',
  created_at: '2026-06-03T10:00:00.000Z',
};

const castleEntry: SavedLayout = {
  id: 'layout-castle-entry',
  name: 'Castle Entry',
  layout: layoutPayload,
  tags: ['Campaign', 'Dungeon'],
  favourite: true,
  notes: 'Session one opener',
  created_at: '2026-06-03T12:00:00.000Z',
  updated_at: '2026-06-03T12:00:00.000Z',
};

const waterCave: SavedLayout = {
  ...castleEntry,
  id: 'layout-water-cave',
  name: 'Water Cave',
  layout: {
    ...layoutPayload,
    id: 'generated-water-cave',
    goal: 'Flooded cavern encounter',
    seed: 'water-cave-seed',
  },
  tags: ['Cave', 'Water'],
  favourite: false,
  notes: 'Needs scatter terrain',
  created_at: '2026-06-03T13:00:00.000Z',
  updated_at: '2026-06-03T13:00:00.000Z',
};

const largeCampaignCastle: SavedLayout = {
  ...castleEntry,
  id: 'layout-large-castle',
  name: 'Large Castle Hall',
  layout: {
    ...layoutPayload,
    id: 'generated-large-castle',
    goal: 'Large fortress hall',
    seed: 'large-castle-seed',
  },
  tags: ['campaign', 'large', 'Dungeon'],
  favourite: true,
  notes: undefined,
  created_at: '2026-06-03T14:00:00.000Z',
  updated_at: '2026-06-03T14:00:00.000Z',
};

async function openRepository() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  const db = new NodeSqliteAdapter(sqlite);
  await runMigrations(db);
  return {
    sqlite,
    repository: createSavedLayoutRepository(db),
  };
}

describe('saved layout SQLite repository', () => {
  test('creates a saved layout and retrieves it by ID with a full JSON round-trip', async () => {
    const { sqlite, repository } = await openRepository();

    await repository.createLayout(castleEntry);

    expect(sqlite.prepare('SELECT id, name, tags_json, favourite, catalog_version, solver_version FROM saved_layouts').get()).toEqual({
      id: castleEntry.id,
      name: castleEntry.name,
      tags_json: JSON.stringify(castleEntry.tags),
      favourite: 1,
      catalog_version: castleEntry.layout.catalog_version,
      solver_version: castleEntry.layout.solver_version,
    });
    await expect(repository.getLayout(castleEntry.id)).resolves.toEqual(castleEntry);
  });

  test('lists all saved layouts ordered by updated_at descending then name', async () => {
    const { repository } = await openRepository();

    await repository.createLayout(castleEntry);
    await repository.createLayout(waterCave);
    await repository.createLayout(largeCampaignCastle);

    await expect(repository.listLayouts()).resolves.toEqual([largeCampaignCastle, waterCave, castleEntry]);
  });

  test('filters by all selected tags case-insensitively', async () => {
    const { repository } = await openRepository();
    await repository.createLayout(castleEntry);
    await repository.createLayout(waterCave);
    await repository.createLayout(largeCampaignCastle);

    await expect(repository.listLayouts({ tags: ['DUNGEON', 'campaign'] })).resolves.toEqual([largeCampaignCastle, castleEntry]);
    await expect(repository.listLayouts({ tags: ['water', 'cave'] })).resolves.toEqual([waterCave]);
    await expect(repository.listLayouts({ tags: ['water', 'campaign'] })).resolves.toEqual([]);
  });

  test('filters favourites only', async () => {
    const { repository } = await openRepository();
    await repository.createLayout(castleEntry);
    await repository.createLayout(waterCave);
    await repository.createLayout(largeCampaignCastle);

    await expect(repository.listLayouts({ favouritesOnly: true })).resolves.toEqual([largeCampaignCastle, castleEntry]);
  });

  test('updates name, tags, notes, and favourite metadata without changing the layout payload', async () => {
    const { repository } = await openRepository();
    await repository.createLayout(castleEntry);

    const updated = await repository.updateLayout(castleEntry.id, {
      name: 'Castle Entry Revised',
      tags: ['Revised', 'Boss Fight'],
      notes: 'Session two boss room',
      favourite: false,
      updated_at: '2026-06-04T09:00:00.000Z',
    });

    const expected: SavedLayout = {
      ...castleEntry,
      name: 'Castle Entry Revised',
      tags: ['Revised', 'Boss Fight'],
      notes: 'Session two boss room',
      favourite: false,
      updated_at: '2026-06-04T09:00:00.000Z',
    };
    expect(updated).toEqual(expected);
    await expect(repository.getLayout(castleEntry.id)).resolves.toEqual(expected);
  });

  test('deletes a saved layout and then reports it missing', async () => {
    const { repository } = await openRepository();
    await repository.createLayout(castleEntry);

    await expect(repository.deleteLayout(castleEntry.id)).resolves.toBe(true);
    await expect(repository.getLayout(castleEntry.id)).resolves.toBeNull();
    await expect(repository.deleteLayout(castleEntry.id)).resolves.toBe(false);
  });

  test('throws a Zod error when stored layout_json is invalid on read', async () => {
    const { sqlite, repository } = await openRepository();
    sqlite.prepare(
      `INSERT INTO saved_layouts (id, name, tags_json, favourite, catalog_version, solver_version, layout_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      'corrupt-layout',
      'Corrupt Layout',
      '[]',
      0,
      '2026.06.03',
      'solver-0.3.0',
      JSON.stringify({ id: '', placements: [] }),
      '2026-06-03T12:00:00.000Z',
      '2026-06-03T12:00:00.000Z',
    );

    await expect(repository.getLayout('corrupt-layout')).rejects.toBeInstanceOf(ZodError);
  });

  test('rejects duplicate saved layout IDs', async () => {
    const { repository } = await openRepository();

    await repository.createLayout(castleEntry);

    await expect(repository.createLayout(castleEntry)).rejects.toThrow(/already exists/i);
  });

  test('returns an empty list when no saved layouts exist', async () => {
    const { repository } = await openRepository();

    await expect(repository.listLayouts()).resolves.toEqual([]);
  });

  test('rejects updates for non-existent saved layouts', async () => {
    const { repository } = await openRepository();

    await expect(repository.updateLayout('missing-layout', { name: 'Missing' })).rejects.toThrow(/does not exist/i);
  });
});
