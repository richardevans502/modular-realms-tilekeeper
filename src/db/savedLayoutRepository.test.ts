import { DatabaseSync } from 'node:sqlite';

import { createSavedLayoutRepository } from './savedLayoutRepository';
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

const firstLayout: Layout = {
  id: 'layout-castle-entry',
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
  solver_version: 'solver-0.2.0',
  catalog_version: '2026.06.03',
  created_at: '2026-06-03T10:00:00.000Z',
};

const secondLayout: Layout = {
  ...firstLayout,
  id: 'layout-castle-hall',
  seed: 'castle-hall-seed',
  goal: 'Long castle hall',
  created_at: '2026-06-03T11:00:00.000Z',
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
  test('creates, reads, updates, lists, and deletes saved layouts', async () => {
    const { sqlite, repository } = await openRepository();

    await repository.createLayout(firstLayout);
    expect(sqlite.prepare('SELECT id, catalog_version, solver_version FROM saved_layouts').get()).toEqual({
      id: firstLayout.id,
      catalog_version: firstLayout.catalog_version,
      solver_version: firstLayout.solver_version,
    });
    await expect(repository.createLayout(firstLayout)).rejects.toThrow(/already exists/i);
    await expect(repository.getLayout(firstLayout.id)).resolves.toEqual(firstLayout);

    await repository.upsertLayout(secondLayout);
    await expect(repository.listLayouts()).resolves.toEqual([firstLayout, secondLayout]);

    const revisedFirstLayout: Layout = {
      ...firstLayout,
      goal: 'Revised castle entrance with a cleaner threshold',
      placements: [
        ...firstLayout.placements,
        {
          tile_type_id: 'mr-real-1x1-wall',
          face_id: 'face-wall',
          x: 1,
          y: 0,
          rotation: 90,
          grid_cells: [{ x: 1, y: 0 }],
        },
      ],
    };

    await repository.updateLayout(firstLayout.id, {
      goal: revisedFirstLayout.goal,
      placements: revisedFirstLayout.placements,
    });

    await expect(repository.getLayout(firstLayout.id)).resolves.toEqual(revisedFirstLayout);
    await expect(repository.deleteLayout(secondLayout.id)).resolves.toBe(true);
    await expect(repository.deleteLayout(secondLayout.id)).resolves.toBe(false);
    await expect(repository.listLayouts()).resolves.toEqual([revisedFirstLayout]);
  });

  test('rejects invalid saved layout payloads and missing updates', async () => {
    const { repository } = await openRepository();

    await expect(repository.createLayout({ ...firstLayout, id: '' })).rejects.toThrow();
    await expect(repository.updateLayout('missing-layout', { goal: 'Missing' })).rejects.toThrow(/does not exist/i);
  });
});
