import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { createCatalogRepository } from './catalogRepository';
import { getSchemaVersion, INITIAL_MIGRATION, INVENTORY_MIGRATION, MIGRATIONS, runMigrations, type TileKeeperDatabase } from './runMigrations';
import type { TileType } from '../shared/types';

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

const representativeTile: TileType = {
  id: 'mr-seed-1x1-floor-wood-cracked',
  name: 'Wood / Cracked Stone',
  product_set: '20 1x1 tiles',
  dimensions: {
    unit: 'grid-cell',
    width: 1,
    height: 1,
    grid_cells: [
      { x: 0, y: 0 },
    ],
  },
  faces: [
    {
      face_id: 'face-wood',
      face_name: 'Wood',
      role_tags: ['floor'],
      edge_sockets: [
        { face: 'north', socket_type: 'open-floor', bidirectional: true, reason: 'floor edge connects to adjacent floor tiles' },
        { face: 'east', socket_type: 'open-floor', bidirectional: true, reason: 'floor edge connects to adjacent floor tiles' },
        { face: 'south', socket_type: 'open-floor', bidirectional: true, reason: 'floor edge connects to adjacent floor tiles' },
        { face: 'west', socket_type: 'open-floor', bidirectional: true, reason: 'floor edge connects to adjacent floor tiles' },
      ],
      rotation_rules: { allowed_rotations: [0, 90, 180, 270], flip_allowed: true },
      theme_tags: ['wood', 'floor'],
    },
    {
      face_id: 'face-cracked-stone',
      face_name: 'Cracked Stone',
      role_tags: ['floor'],
      edge_sockets: [
        { face: 'north', socket_type: 'open-floor', bidirectional: true, reason: 'floor edge connects to adjacent floor tiles' },
        { face: 'east', socket_type: 'open-floor', bidirectional: true, reason: 'floor edge connects to adjacent floor tiles' },
        { face: 'south', socket_type: 'open-floor', bidirectional: true, reason: 'floor edge connects to adjacent floor tiles' },
        { face: 'west', socket_type: 'open-floor', bidirectional: true, reason: 'floor edge connects to adjacent floor tiles' },
      ],
      rotation_rules: { allowed_rotations: [0, 90, 180, 270], flip_allowed: true },
      theme_tags: ['cracked-stone', 'floor'],
    },
  ],
  catalog_status: 'official',
  category: 'floor',
  tags: ['starter', 'double-sided'],
  catalog_version: '2026.06.03',
  notes: 'Real Modular Realms 1x1 floor tile for SQLite round-trip test.',
};

function openTestDb(): { db: DatabaseSync; adapter: NodeSqliteAdapter } {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  return { db, adapter: new NodeSqliteAdapter(db) };
}

describe('SQLite migration runner v0.1', () => {
  test('keeps the bundled migration SQL file aligned with the executable migration', () => {
    const migrationFileSql = readFileSync(join(__dirname, 'migrations', '001_initial.sql'), 'utf8').trim();

    expect(INITIAL_MIGRATION.sql).toBe(migrationFileSql);
  });

  test('keeps every bundled migration SQL file aligned with the executable migrations', () => {
    for (const migration of MIGRATIONS) {
      const migrationFileSql = readFileSync(join(__dirname, 'migrations', `${migration.id}.sql`), 'utf8').trim();

      expect(migration.sql).toBe(migrationFileSql);
    }
  });

  test('applies 001_initial.sql once and creates all baseline tables', async () => {
    const { db, adapter } = openTestDb();

    await runMigrations(adapter);
    await runMigrations(adapter);

    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all()
      .map((row) => (row as { name: string }).name);

    expect(tables).toEqual([
      'app_settings',
      'catalog_packs',
      'custom_tile_types',
      'inventory_items',
      'migration_log',
      'saved_layouts',
      'tile_types',
      'user_inventory',
    ]);
    expect(await getSchemaVersion(adapter)).toBe(2);
    expect(db.prepare('SELECT COUNT(*) AS count FROM migration_log WHERE id = ?').get(INITIAL_MIGRATION.id)).toEqual({ count: 1 });
    expect(db.prepare('SELECT COUNT(*) AS count FROM migration_log WHERE id = ?').get(INVENTORY_MIGRATION.id)).toEqual({ count: 1 });
  });

  test('applies 002_inventory.sql once and creates the user inventory table', async () => {
    const { db, adapter } = openTestDb();

    await runMigrations(adapter);
    await runMigrations(adapter);

    const userInventoryTable = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'user_inventory'")
      .get();
    const userInventoryIndexes = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'user_inventory' ORDER BY name")
      .all()
      .map((row) => (row as { name: string }).name);

    expect(userInventoryTable).toEqual({ name: 'user_inventory' });
    expect(userInventoryIndexes).toEqual(['idx_user_inventory_tile_type_id', 'sqlite_autoindex_user_inventory_1']);
  });

  test('round-trips a tile record intact through the catalog repository', async () => {
    const { adapter } = openTestDb();
    await runMigrations(adapter);

    const catalog = createCatalogRepository(adapter);
    await catalog.upsertTileType(representativeTile);

    await expect(catalog.getTileType(representativeTile.id)).resolves.toEqual(representativeTile);
  });
});
