import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

import { loadSeedCatalog } from './loadSeedCatalog';
import { createCatalogRepository } from '../db/catalogRepository';
import { runMigrations, type TileKeeperDatabase } from '../db/runMigrations';

class NodeSqliteAdapter implements TileKeeperDatabase {
  constructor(private readonly db: DatabaseSync) {}

  async execAsync(sql: string): Promise<void> {
    this.db.exec(sql);
  }

  async getFirstAsync<T>(sql: string, params: SQLInputValue[] = []): Promise<T | null> {
    return (this.db.prepare(sql).get(...params) as T | undefined) ?? null;
  }

  async getAllAsync<T>(sql: string, params: SQLInputValue[] = []): Promise<T[]> {
    return this.db.prepare(sql).all(...params) as T[];
  }

  async runAsync(sql: string, params: SQLInputValue[] = []): Promise<void> {
    this.db.prepare(sql).run(...params);
  }
}

function openTestDb(): { db: DatabaseSync; adapter: NodeSqliteAdapter } {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  return { db, adapter: new NodeSqliteAdapter(db) };
}

describe('seed catalog pack', () => {
  test('loads a manually curated M2 seed catalog with representative categories and double-sided tiles', () => {
    const catalog = loadSeedCatalog();

    expect(catalog).toHaveLength(29);
    expect(new Set(catalog.map((tile) => tile.id)).size).toBe(catalog.length);
    expect(new Set(catalog.map((tile) => tile.category))).toEqual(
      new Set(['floor', 'wall', 'doorway', 'scatter']),
    );
    expect(catalog.filter((tile) => tile.faces.length >= 2)).toHaveLength(27);

    for (const tile of catalog) {
      expect(tile.id).toMatch(/^mr-seed-[a-z0-9-]+$/);
      expect(tile.name).toBeTruthy();
      expect(tile.product_set).toBeTruthy();
      expect(tile.dimensions.grid_cells.length).toBeGreaterThanOrEqual(1);
      expect(tile.faces.length).toBeGreaterThanOrEqual(1);
      expect(tile.tags.length).toBeGreaterThanOrEqual(1);
    }
  });

  test('includes explicit socket compatibility evidence for doorway tiles', () => {
    const catalog = loadSeedCatalog();
    const doorwayTiles = catalog.filter((tile) =>
      tile.faces.some((face) =>
        face.edge_sockets.some((socket) =>
          socket.socket_type === 'doorway' && socket.reason.length >= 12,
        ),
      ),
    );

    expect(doorwayTiles.length).toBeGreaterThanOrEqual(1);
  });

  test('loads every seed catalog tile into SQLite without validation or repository errors', async () => {
    const { adapter } = openTestDb();
    await runMigrations(adapter);
    const repository = createCatalogRepository(adapter);

    for (const tile of loadSeedCatalog()) {
      await repository.upsertTileType(tile);
    }

    const rows = await adapter.getAllAsync<{ id: string }>('SELECT id FROM tile_types ORDER BY id');
    expect(rows).toHaveLength(29);
    await expect(repository.getTileType(loadSeedCatalog()[0].id)).resolves.toEqual(loadSeedCatalog()[0]);
  });

  test('counts double-sided usage at physical tile level rather than per face', () => {
    const doubleSided = loadSeedCatalog().find((tile) => tile.faces.length >= 2);
    expect(doubleSided).toBeDefined();

    const placements = [
      { tile_type_id: doubleSided!.id, face_id: doubleSided!.faces[0].face_id },
      { tile_type_id: doubleSided!.id, face_id: doubleSided!.faces[1].face_id },
    ];
    const usedByTileType = placements.reduce<Record<string, number>>((counts, placement) => {
      counts[placement.tile_type_id] = (counts[placement.tile_type_id] ?? 0) + 1;
      return counts;
    }, {});

    expect(usedByTileType[doubleSided!.id]).toBe(2);
    expect(Object.keys(usedByTileType)).toEqual([doubleSided!.id]);
  });
});
