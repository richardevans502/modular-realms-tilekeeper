import { DatabaseSync } from 'node:sqlite';

import { createCatalogRepository, type CatalogRepository } from '../db/catalogRepository';
import { createInventoryRepository, type InventoryRepository } from '../db/inventoryRepository';
import { createSavedLayoutRepository, type SavedLayoutRepository } from '../db/savedLayoutRepository';
import { runMigrations, type TileKeeperDatabase } from '../db/runMigrations';
import type { Layout, TileType } from '../shared/types';
import {
  buildExportableLayouts,
  exportBackupJson,
  exportLayoutJson,
  generatePngDataUrl,
  importBackupJson,
  parseImportJson,
} from './exportViewModel';

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

  async withTransactionAsync(task: () => Promise<void>): Promise<void> {
    this.db.exec('BEGIN');
    try {
      await task();
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }
}

const tile: TileType = {
  id: 'mr-export-floor-1x1',
  name: 'Export Floor Tile',
  product_set: 'Export Test Pack',
  dimensions: {
    unit: 'grid-cell',
    width: 1,
    height: 1,
    grid_cells: [{ x: 0, y: 0 }],
  },
  faces: [
    {
      face_id: 'stone-a',
      face_name: 'Stone Floor',
      role_tags: ['floor'],
      edge_sockets: [
        { face: 'north', socket_type: 'open-floor', bidirectional: true, reason: 'open' },
        { face: 'east', socket_type: 'open-floor', bidirectional: true, reason: 'open' },
        { face: 'south', socket_type: 'open-floor', bidirectional: true, reason: 'open' },
        { face: 'west', socket_type: 'open-floor', bidirectional: true, reason: 'open' },
      ],
      rotation_rules: { allowed_rotations: [0, 90, 180, 270], flip_allowed: false },
      theme_tags: ['stone'],
    },
  ],
  catalog_status: 'official',
  category: 'floor',
  tags: ['export'],
  catalog_version: '2026.06.08',
};

const layout: Layout = {
  id: 'export-layout-1',
  placements: [
    {
      tile_type_id: tile.id,
      face_id: 'stone-a',
      x: 0,
      y: 0,
      rotation: 0,
      grid_cells: [{ x: 0, y: 0 }],
    },
  ],
  seed: 'export-seed',
  goal: 'Test export layout\nfor unit tests',
  solver_version: 'export-solver',
  catalog_version: '2026.06.08',
  created_at: '2026-06-08T10:00:00.000Z',
};

const savedLayout = {
  id: layout.id,
  name: 'Test export layout',
  layout,
  tags: ['export'],
  favourite: false,
  created_at: '2026-06-08T10:00:00.000Z',
  updated_at: '2026-06-08T10:00:00.000Z',
};

async function openRepositories(): Promise<{
  db: NodeSqliteAdapter;
  catalog: CatalogRepository;
  inventory: InventoryRepository;
  savedLayouts: SavedLayoutRepository;
}> {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  const db = new NodeSqliteAdapter(sqlite);
  await runMigrations(db);
  return {
    db,
    catalog: createCatalogRepository(db),
    inventory: createInventoryRepository(db),
    savedLayouts: createSavedLayoutRepository(db),
  };
}

describe('exportViewModel', () => {
  test('buildExportableLayouts maps saved layouts into exportable summaries', () => {
    const result = buildExportableLayouts([savedLayout]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'export-layout-1',
      name: 'Test export layout',
      goal: 'Test export layout\nfor unit tests',
      placementCount: 1,
      updatedAt: '2026-06-08T10:00:00.000Z',
    });
  });

  test('exportBackupJson produces a valid backup envelope with catalog, inventory, and layouts', async () => {
    const { catalog, inventory, savedLayouts } = await openRepositories();
    await catalog.upsertTileType(tile);
    await inventory.createInventoryItem({
      tile_type_id: tile.id,
      owned_quantity: 3,
      condition: 'good',
      reserved: 0,
    });
    await savedLayouts.createLayout(savedLayout);

    const json = await exportBackupJson({ catalogRepository: catalog, inventoryRepository: inventory, savedLayoutRepository: savedLayouts });
    const parsed = JSON.parse(json);
    expect(parsed.format).toBe('tilekeeper.backup.v1');
    expect(parsed.payload.catalog_tiles).toHaveLength(1);
    expect(parsed.payload.inventory_items).toHaveLength(1);
    expect(parsed.payload.saved_layouts).toHaveLength(1);
    expect(parsed.payload.saved_layouts[0].id).toBe('export-layout-1');
  });

  test('parseImportJson returns envelope for valid JSON and error for invalid', () => {
    const valid = parseImportJson(JSON.stringify({
      format: 'tilekeeper.backup.v1',
      schema_version: 1,
      product_version: '0.1.0',
      exported_at: '2026-06-08T10:00:00.000Z',
      payload: {
        catalog_tiles: [tile],
        inventory_items: [],
        saved_layouts: [],
      },
    }));
    expect(valid.envelope).not.toBeNull();
    expect(valid.error).toBeNull();

    const invalid = parseImportJson('not json');
    expect(invalid.envelope).toBeNull();
    expect(invalid.error).toMatch(/malformed JSON/);
  });

  test('importBackupJson restores catalog, inventory, and saved layouts in replace mode', async () => {
    const { catalog, inventory, savedLayouts } = await openRepositories();
    await catalog.upsertTileType(tile);
    await inventory.createInventoryItem({
      tile_type_id: tile.id,
      owned_quantity: 5,
      condition: 'new',
      reserved: 0,
    });
    await savedLayouts.createLayout(savedLayout);

    const backupJson = await exportBackupJson({ catalogRepository: catalog, inventoryRepository: inventory, savedLayoutRepository: savedLayouts });

    const fresh = await openRepositories();
    const staleTile = { ...tile, id: 'mr-stale', name: 'Stale' };
    await fresh.catalog.upsertTileType(staleTile);
    await fresh.inventory.createInventoryItem({ tile_type_id: staleTile.id, owned_quantity: 1, condition: 'good', reserved: 0 });
    await fresh.savedLayouts.createLayout({ ...savedLayout, id: 'stale-layout', name: 'Stale layout' });

    const result = await importBackupJson(backupJson, {
      catalogRepository: fresh.catalog,
      inventoryRepository: fresh.inventory,
      savedLayoutRepository: fresh.savedLayouts,
    }, { mode: 'replace' });
    expect(result).toEqual({ success: true });

    await expect(fresh.catalog.getTileType(tile.id)).resolves.toEqual(tile);
    await expect(fresh.inventory.getInventoryItem(tile.id)).resolves.toMatchObject({ owned_quantity: 5 });
    await expect(fresh.savedLayouts.getLayout(layout.id)).resolves.toMatchObject({ name: 'Test export layout' });
    await expect(fresh.catalog.getTileType(staleTile.id)).resolves.toBeNull();
    await expect(fresh.savedLayouts.getLayout('stale-layout')).resolves.toBeNull();
  });

  test('importBackupJson supports merge mode without deleting existing data', async () => {
    const { catalog, inventory, savedLayouts } = await openRepositories();
    await catalog.upsertTileType(tile);
    await inventory.createInventoryItem({
      tile_type_id: tile.id,
      owned_quantity: 2,
      condition: 'worn',
      reserved: 0,
    });
    await savedLayouts.createLayout(savedLayout);

    const backupJson = await exportBackupJson({ catalogRepository: catalog, inventoryRepository: inventory, savedLayoutRepository: savedLayouts });

    const fresh = await openRepositories();
    const extraTile = { ...tile, id: 'mr-extra', name: 'Extra' };
    await fresh.catalog.upsertTileType(extraTile);
    await fresh.inventory.createInventoryItem({ tile_type_id: extraTile.id, owned_quantity: 1, condition: 'good', reserved: 0 });
    await fresh.savedLayouts.createLayout({ ...savedLayout, id: 'extra-layout', name: 'Extra layout' });

    const result = await importBackupJson(backupJson, {
      catalogRepository: fresh.catalog,
      inventoryRepository: fresh.inventory,
      savedLayoutRepository: fresh.savedLayouts,
    }, { mode: 'merge' });
    expect(result).toEqual({ success: true });

    await expect(fresh.catalog.getTileType(tile.id)).resolves.toEqual(tile);
    await expect(fresh.catalog.getTileType(extraTile.id)).resolves.toEqual(extraTile);
    await expect(fresh.savedLayouts.getLayout(layout.id)).resolves.toMatchObject({ name: 'Test export layout' });
    await expect(fresh.savedLayouts.getLayout('extra-layout')).resolves.toMatchObject({ name: 'Extra layout' });
  });

  test('exportLayoutJson returns pretty-printed JSON', async () => {
    const json = await exportLayoutJson(layout);
    const parsed = JSON.parse(json);
    expect(parsed.id).toBe('export-layout-1');
    expect(JSON.stringify(parsed, null, 2)).toBe(json);
  });

  test('generatePngDataUrl returns error in non-browser environment', async () => {
    const result = await generatePngDataUrl(layout, [tile]);
    expect(result.dataUrl).toBeNull();
    expect(result.error).toMatch(/browser environment/);
  });
});
