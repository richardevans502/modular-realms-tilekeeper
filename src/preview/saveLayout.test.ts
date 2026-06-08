import { DatabaseSync } from 'node:sqlite';

import { createSavedLayoutRepository, type SavedLayout, type SavedLayoutRepository } from '../db/savedLayoutRepository';
import { runMigrations, type TileKeeperDatabase } from '../db/runMigrations';
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

async function openRepository(): Promise<{ sqlite: DatabaseSync; repository: SavedLayoutRepository }> {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  const db = new NodeSqliteAdapter(sqlite);
  await runMigrations(db);
  return { sqlite, repository: createSavedLayoutRepository(db) };
}

/** Build a SavedLayout from form data + a Layout, matching app/preview.tsx logic */
function buildSavedLayoutFromForm(
  layout: Layout,
  data: { name: string; tags: string[]; notes: string; favourite: boolean },
): SavedLayout {
  return {
    id: `saved-${layout.id}-${Date.now()}`,
    name: data.name,
    layout,
    tags: data.tags,
    favourite: data.favourite,
    notes: data.notes || undefined,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

describe('save layout flow', () => {
  test('creates a saved layout from form data and persists it to the repository', async () => {
    const { repository } = await openRepository();

    const formData = {
      name: 'Boss Room Alpha',
      tags: ['campaign', 'boss', 'dungeon'],
      notes: 'Final encounter for session 3',
      favourite: true,
    };

    const savedLayout = buildSavedLayoutFromForm(layoutPayload, formData);
    await repository.createLayout(savedLayout);

    const retrieved = await repository.getLayout(savedLayout.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.name).toBe('Boss Room Alpha');
    expect(retrieved!.tags).toEqual(['campaign', 'boss', 'dungeon']);
    expect(retrieved!.favourite).toBe(true);
    expect(retrieved!.notes).toBe('Final encounter for session 3');
    expect(retrieved!.layout.id).toBe(layoutPayload.id);
  });

  test('creates a saved layout with minimal form data (empty tags, no notes, not favourite)', async () => {
    const { repository } = await openRepository();

    const formData = {
      name: 'Quick Save',
      tags: [] as string[],
      notes: '',
      favourite: false,
    };

    const savedLayout = buildSavedLayoutFromForm(layoutPayload, formData);
    await repository.createLayout(savedLayout);

    const retrieved = await repository.getLayout(savedLayout.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.name).toBe('Quick Save');
    expect(retrieved!.tags).toEqual([]);
    expect(retrieved!.favourite).toBe(false);
    expect(retrieved!.notes).toBeUndefined();
  });

  test('saved layout appears in listLayouts without requiring a refresh', async () => {
    const { repository } = await openRepository();

    const formData = {
      name: 'Library Test Layout',
      tags: ['test'],
      notes: '',
      favourite: false,
    };

    const savedLayout = buildSavedLayoutFromForm(layoutPayload, formData);
    await repository.createLayout(savedLayout);

    const layouts = await repository.listLayouts();
    expect(layouts).toHaveLength(1);
    expect(layouts[0]!.id).toBe(savedLayout.id);
    expect(layouts[0]!.name).toBe('Library Test Layout');
  });

  test('each save gets a unique ID due to timestamp suffix', async () => {
    const { repository } = await openRepository();

    const formData = {
      name: 'Duplicate Check',
      tags: [],
      notes: '',
      favourite: false,
    };

    const saved1 = buildSavedLayoutFromForm(layoutPayload, formData);
    await new Promise((resolve) => setTimeout(resolve, 2));
    const saved2 = buildSavedLayoutFromForm(layoutPayload, formData);

    expect(saved1.id).not.toBe(saved2.id);

    await repository.createLayout(saved1);
    await repository.createLayout(saved2);

    const layouts = await repository.listLayouts();
    expect(layouts).toHaveLength(2);
  });
});
