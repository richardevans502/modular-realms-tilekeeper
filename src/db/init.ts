import * as SQLite from 'expo-sqlite';

import { createCatalogRepository, type CatalogRepository } from './catalogRepository';
import { createInventoryRepository, type InventoryRepository } from './inventoryRepository';
import { runMigrations, type TileKeeperDatabase } from './runMigrations';

export interface TileKeeperPersistence {
  db: SQLite.SQLiteDatabase;
  catalogRepository: CatalogRepository;
  inventoryRepository: InventoryRepository;
}

export const TILEKEEPER_DATABASE_NAME = 'tilekeeper.db';

export async function openTileKeeperDatabase(databaseName = TILEKEEPER_DATABASE_NAME): Promise<SQLite.SQLiteDatabase> {
  return SQLite.openDatabaseAsync(databaseName);
}

export async function initTileKeeperDatabase(databaseName = TILEKEEPER_DATABASE_NAME): Promise<TileKeeperPersistence> {
  const db = await openTileKeeperDatabase(databaseName);
  await runMigrations(db as TileKeeperDatabase);

  return {
    db,
    catalogRepository: createCatalogRepository(db as TileKeeperDatabase),
    inventoryRepository: createInventoryRepository(db as TileKeeperDatabase),
  };
}
