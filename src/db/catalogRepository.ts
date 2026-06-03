import { tileTypeSchema } from '../shared/schemas';
import type { TileType } from '../shared/types';
import type { TileKeeperDatabase } from './runMigrations';

export interface CatalogRepository {
  upsertTileType(tile: TileType): Promise<void>;
  getTileType(id: string): Promise<TileType | null>;
  listTileTypes(): Promise<TileType[]>;
}

interface TileTypeRow {
  tile_json: string;
}

function parseTileTypeJson(tileJson: string): TileType {
  return tileTypeSchema.parse(JSON.parse(tileJson)) as TileType;
}

function bindSql(db: TileKeeperDatabase, sql: string, params: unknown[]): Promise<unknown> {
  if (!db.runAsync) {
    throw new Error('Database adapter does not support parameterized writes');
  }
  return db.runAsync(sql, params);
}

export function createCatalogRepository(db: TileKeeperDatabase): CatalogRepository {
  return {
    async upsertTileType(tile: TileType): Promise<void> {
      const parsedTile = tileTypeSchema.parse(tile);
      await bindSql(
        db,
        `INSERT INTO tile_types (id, slug, category, catalog_status, catalog_version, tile_json, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(id) DO UPDATE SET
           slug = excluded.slug,
           category = excluded.category,
           catalog_status = excluded.catalog_status,
           catalog_version = excluded.catalog_version,
           tile_json = excluded.tile_json,
           updated_at = CURRENT_TIMESTAMP`,
        [
          parsedTile.id,
          parsedTile.id,
          parsedTile.category,
          parsedTile.catalog_status,
          parsedTile.catalog_version,
          JSON.stringify(parsedTile),
        ],
      );
    },

    async getTileType(id: string): Promise<TileType | null> {
      const row = await db.getFirstAsync<TileTypeRow>('SELECT tile_json FROM tile_types WHERE id = ?', [id]);
      if (!row) {
        return null;
      }
      return parseTileTypeJson(row.tile_json);
    },

    async listTileTypes(): Promise<TileType[]> {
      if (!db.getAllAsync) {
        const row = await db.getFirstAsync<{ tile_json: string | null }>(
          "SELECT '[' || group_concat(tile_json) || ']' AS tile_json FROM tile_types ORDER BY id",
        );
        const json = row?.tile_json ?? '[]';
        return (JSON.parse(json) as unknown[]).map((tile) => tileTypeSchema.parse(tile) as TileType);
      }

      const rows = await db.getAllAsync<TileTypeRow>('SELECT tile_json FROM tile_types ORDER BY id');
      return rows.map((row) => parseTileTypeJson(row.tile_json));
    },
  };
}
