import { DatabaseSync } from 'node:sqlite';

import { initTileKeeperDatabase } from './init';
import type { TileKeeperDatabase } from './runMigrations';

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

const sqlite = new DatabaseSync(':memory:');
sqlite.exec('PRAGMA foreign_keys = ON');

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(async () => new NodeSqliteAdapter(sqlite)),
}));

describe('TileKeeper database init', () => {
  test('exposes saved layout repository alongside catalog and inventory repositories', async () => {
    const persistence = await initTileKeeperDatabase('tilekeeper-test.db');

    expect(persistence.catalogRepository).toBeDefined();
    expect(persistence.inventoryRepository).toBeDefined();
    expect(persistence.savedLayoutRepository).toBeDefined();
  });
});
