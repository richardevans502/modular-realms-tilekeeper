import { inventoryItemSchema } from '../shared/schemas';
import type { InventoryItem } from '../shared/types';
import type { TileKeeperDatabase } from './runMigrations';

export interface InventoryRepository {
  upsertInventoryItem(item: InventoryItem): Promise<void>;
  getInventoryItem(tileTypeId: string): Promise<InventoryItem | null>;
  listInventoryItems(): Promise<InventoryItem[]>;
}

interface InventoryRow {
  item_json: string;
}

function parseInventoryJson(itemJson: string): InventoryItem {
  return inventoryItemSchema.parse(JSON.parse(itemJson)) as InventoryItem;
}

function bindSql(db: TileKeeperDatabase, sql: string, params: unknown[]): Promise<unknown> {
  if (!db.runAsync) {
    throw new Error('Database adapter does not support parameterized writes');
  }
  return db.runAsync(sql, params);
}

export function createInventoryRepository(db: TileKeeperDatabase): InventoryRepository {
  return {
    async upsertInventoryItem(item: InventoryItem): Promise<void> {
      const parsedItem = inventoryItemSchema.parse(item);
      await bindSql(
        db,
        `INSERT INTO inventory_items (id, tile_type_id, quantity_owned, reserved, item_json, updated_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(id) DO UPDATE SET
           tile_type_id = excluded.tile_type_id,
           quantity_owned = excluded.quantity_owned,
           reserved = excluded.reserved,
           item_json = excluded.item_json,
           updated_at = CURRENT_TIMESTAMP`,
        [
          parsedItem.tile_type_id,
          parsedItem.tile_type_id,
          parsedItem.owned_quantity,
          parsedItem.reserved,
          JSON.stringify(parsedItem),
        ],
      );
    },

    async getInventoryItem(tileTypeId: string): Promise<InventoryItem | null> {
      const row = await db.getFirstAsync<InventoryRow>('SELECT item_json FROM inventory_items WHERE id = ?', [tileTypeId]);
      if (!row) {
        return null;
      }
      return parseInventoryJson(row.item_json);
    },

    async listInventoryItems(): Promise<InventoryItem[]> {
      if (!db.getAllAsync) {
        const row = await db.getFirstAsync<{ item_json: string | null }>(
          "SELECT '[' || group_concat(item_json) || ']' AS item_json FROM inventory_items ORDER BY id",
        );
        const json = row?.item_json ?? '[]';
        return (JSON.parse(json) as unknown[]).map((item) => inventoryItemSchema.parse(item) as InventoryItem);
      }

      const rows = await db.getAllAsync<InventoryRow>('SELECT item_json FROM inventory_items ORDER BY id');
      return rows.map((row) => parseInventoryJson(row.item_json));
    },
  };
}
