import { DatabaseSync } from 'node:sqlite';

import { createCatalogRepository } from './catalogRepository';
import { createInventoryRepository } from './inventoryRepository';
import { runMigrations, type TileKeeperDatabase } from './runMigrations';
import type { InventoryItem, TileType } from '../shared/types';

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

const tile: TileType = {
  id: 'mr-real-1x1-floor',
  name: '1x1 Floor Tile',
  product_set: 'Modular Realms 1x1 floor tiles',
  dimensions: {
    unit: 'grid-cell',
    width: 1,
    height: 1,
    grid_cells: [{ x: 0, y: 0 }],
  },
  faces: [
    {
      face_id: 'face-stone',
      face_name: 'Stone Floor',
      role_tags: ['floor'],
      edge_sockets: [
        { face: 'north', socket_type: 'open-floor', bidirectional: true, reason: 'floor edge' },
        { face: 'east', socket_type: 'open-floor', bidirectional: true, reason: 'floor edge' },
        { face: 'south', socket_type: 'open-floor', bidirectional: true, reason: 'floor edge' },
        { face: 'west', socket_type: 'open-floor', bidirectional: true, reason: 'floor edge' },
      ],
      rotation_rules: { allowed_rotations: [0, 90, 180, 270], flip_allowed: true },
      theme_tags: ['stone'],
    },
  ],
  catalog_status: 'official',
  category: 'floor',
  tags: ['real-product', 'inventory'],
  catalog_version: '2026.06.03',
};

const inventoryLine: InventoryItem = {
  tile_type_id: tile.id,
  owned_quantity: 4,
  condition: 'good',
  storage_location: 'drawer-a',
};

async function openRepositories() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  const db = new NodeSqliteAdapter(sqlite);
  await runMigrations(db);
  return {
    catalog: createCatalogRepository(db),
    inventory: createInventoryRepository(db),
  };
}

describe('inventory CRUD repositories', () => {
  test('creates, reads, updates, lists with catalog details, and deletes inventory lines', async () => {
    const sqlite = new DatabaseSync(':memory:');
    sqlite.exec('PRAGMA foreign_keys = ON');
    const db = new NodeSqliteAdapter(sqlite);
    await runMigrations(db);
    const catalog = createCatalogRepository(db);
    const inventory = createInventoryRepository(db);
    await catalog.upsertTileType(tile);

    await inventory.createInventoryItem(inventoryLine);
    expect(sqlite.prepare('SELECT tile_type_id, owned_quantity, reserved FROM user_inventory').get()).toEqual({
      tile_type_id: tile.id,
      owned_quantity: 4,
      reserved: 0,
    });
    await expect(inventory.createInventoryItem(inventoryLine)).rejects.toThrow(/already exists/i);
    await expect(inventory.getInventoryItem(tile.id)).resolves.toEqual(inventoryLine);

    await inventory.updateInventoryItem(tile.id, {
      owned_quantity: 6,
      notes: 'counted during M2-SP2',
    });

    await expect(inventory.getInventoryItem(tile.id)).resolves.toEqual({
      ...inventoryLine,
      owned_quantity: 6,
      notes: 'counted during M2-SP2',
    });
    await expect(inventory.listInventoryDetails()).resolves.toEqual([
      {
        item: {
          ...inventoryLine,
          owned_quantity: 6,
          notes: 'counted during M2-SP2',
        },
        tile,
      },
    ]);

    await expect(inventory.deleteInventoryItem(tile.id)).resolves.toBe(true);
    await expect(inventory.deleteInventoryItem(tile.id)).resolves.toBe(false);
    await expect(inventory.listInventoryItems()).resolves.toEqual([]);
  });

  test('allows owned quantities to decrease without reservation checks', async () => {
    const { catalog, inventory } = await openRepositories();
    await catalog.upsertTileType(tile);
    await inventory.createInventoryItem(inventoryLine);

    await expect(inventory.updateInventoryItem(tile.id, { owned_quantity: 1 })).resolves.toMatchObject({
      tile_type_id: tile.id,
      owned_quantity: 1,
    });
  });

  test('deletes catalog tile types only when inventory no longer references them', async () => {
    const { catalog, inventory } = await openRepositories();
    await catalog.upsertTileType(tile);
    await inventory.createInventoryItem(inventoryLine);

    await expect(catalog.deleteTileType(tile.id)).rejects.toThrow();
    await inventory.deleteInventoryItem(tile.id);
    await expect(catalog.deleteTileType(tile.id)).resolves.toBe(true);
    await expect(catalog.deleteTileType(tile.id)).resolves.toBe(false);
    await expect(catalog.getTileType(tile.id)).resolves.toBeNull();
  });
});
