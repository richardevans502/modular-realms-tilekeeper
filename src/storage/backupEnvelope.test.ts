import { DatabaseSync } from 'node:sqlite';

import { createCatalogRepository, type CatalogRepository } from '../db/catalogRepository';
import { createInventoryRepository, type InventoryRepository } from '../db/inventoryRepository';
import { runMigrations, type TileKeeperDatabase } from '../db/runMigrations';
import type { InventoryItem, TileType } from '../shared/types';
import {
  BACKUP_ENVELOPE_FORMAT,
  createBackupEnvelope,
  parseBackupEnvelope,
  restoreBackupEnvelope,
  serializeBackupEnvelope,
} from './backupEnvelope';

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
  id: 'mr-backup-floor-1x1',
  name: 'Backup Floor Tile',
  product_set: 'Backup Test Pack',
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
        { face: 'north', socket_type: 'open-floor', bidirectional: true, reason: 'backup test open edge' },
        { face: 'east', socket_type: 'open-floor', bidirectional: true, reason: 'backup test open edge' },
        { face: 'south', socket_type: 'open-floor', bidirectional: true, reason: 'backup test open edge' },
        { face: 'west', socket_type: 'open-floor', bidirectional: true, reason: 'backup test open edge' },
      ],
      rotation_rules: { allowed_rotations: [0, 90, 180, 270], flip_allowed: false },
      theme_tags: ['stone', 'backup'],
    },
  ],
  catalog_status: 'official',
  category: 'floor',
  tags: ['backup'],
  catalog_version: '2026.06.05',
};

const inventoryItem: InventoryItem = {
  tile_type_id: tile.id,
  owned_quantity: 7,
  condition: 'good',
  reserved: 2,
  storage_location: 'backup crate',
  notes: 'round-trip me',
};

async function openRepositories(): Promise<{ db: NodeSqliteAdapter; catalog: CatalogRepository; inventory: InventoryRepository }> {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  const db = new NodeSqliteAdapter(sqlite);
  await runMigrations(db);
  return {
    db,
    catalog: createCatalogRepository(db),
    inventory: createInventoryRepository(db),
  };
}

describe('backup/restore JSON envelope', () => {
  test('exports catalog and inventory data in a versioned portable envelope', async () => {
    const { catalog, inventory } = await openRepositories();
    await catalog.upsertTileType(tile);
    await inventory.createInventoryItem(inventoryItem);

    const envelope = await createBackupEnvelope(
      { catalogRepository: catalog, inventoryRepository: inventory },
      { exportedAt: '2026-06-05T12:00:00.000Z', productVersion: '0.1.0' },
    );

    expect(envelope).toEqual({
      format: BACKUP_ENVELOPE_FORMAT,
      schema_version: 1,
      product_version: '0.1.0',
      exported_at: '2026-06-05T12:00:00.000Z',
      payload: {
        catalog_tiles: [tile],
        inventory_items: [inventoryItem],
        saved_layouts: [],
      },
    });
  });

  test('serializes and parses backup JSON with strict validation and useful import errors', async () => {
    const envelope = {
      format: BACKUP_ENVELOPE_FORMAT,
      schema_version: 1 as const,
      product_version: '0.1.0',
      exported_at: '2026-06-05T12:00:00.000Z',
      payload: {
        catalog_tiles: [tile],
        inventory_items: [inventoryItem],
        saved_layouts: [],
      },
    };

    const json = serializeBackupEnvelope(envelope);
    expect(parseBackupEnvelope(json)).toEqual(envelope);
    expect(() => parseBackupEnvelope('{"format":"wrong"}')).toThrow(/Invalid TileKeeper backup envelope/i);
  });

  test('restores backup JSON into repositories and replaces stale local inventory lines', async () => {
    const source = await openRepositories();
    await source.catalog.upsertTileType(tile);
    await source.inventory.createInventoryItem(inventoryItem);
    const backupJson = serializeBackupEnvelope(await createBackupEnvelope({ catalogRepository: source.catalog, inventoryRepository: source.inventory }));

    const destination = await openRepositories();
    const staleTile = { ...tile, id: 'mr-stale-floor', name: 'Stale Floor' };
    await destination.catalog.upsertTileType(staleTile);
    await destination.inventory.createInventoryItem({ ...inventoryItem, tile_type_id: staleTile.id, owned_quantity: 1, reserved: 0 });

    await restoreBackupEnvelope(backupJson, {
      catalogRepository: destination.catalog,
      inventoryRepository: destination.inventory,
      runInTransaction: (task) => destination.db.withTransactionAsync(task),
    });

    await expect(destination.catalog.getTileType(tile.id)).resolves.toEqual(tile);
    await expect(destination.inventory.getInventoryItem(tile.id)).resolves.toEqual(inventoryItem);
    await expect(destination.inventory.getInventoryItem(staleTile.id)).resolves.toBeNull();
  });

  test('rolls back replace-mode imports when a repository write fails', async () => {
    const source = await openRepositories();
    await source.catalog.upsertTileType(tile);
    await source.inventory.createInventoryItem(inventoryItem);
    const backupJson = serializeBackupEnvelope(await createBackupEnvelope({ catalogRepository: source.catalog, inventoryRepository: source.inventory }));

    const destination = await openRepositories();
    const originalTile = { ...tile, id: 'mr-original-floor', name: 'Original Floor' };
    const originalItem = { ...inventoryItem, tile_type_id: originalTile.id, owned_quantity: 3, reserved: 1 };
    await destination.catalog.upsertTileType(originalTile);
    await destination.inventory.createInventoryItem(originalItem);

    const failingInventory: InventoryRepository = {
      ...destination.inventory,
      async upsertInventoryItem(): Promise<void> {
        throw new Error('simulated import write failure');
      },
    };

    await expect(
      restoreBackupEnvelope(backupJson, {
        catalogRepository: destination.catalog,
        inventoryRepository: failingInventory,
        runInTransaction: (task) => destination.db.withTransactionAsync(task),
      }),
    ).rejects.toThrow(/simulated import write failure/);

    await expect(destination.catalog.getTileType(originalTile.id)).resolves.toEqual(originalTile);
    await expect(destination.inventory.getInventoryItem(originalTile.id)).resolves.toEqual(originalItem);
    await expect(destination.catalog.getTileType(tile.id)).resolves.toBeNull();
    await expect(destination.inventory.getInventoryItem(tile.id)).resolves.toBeNull();
  });
});
