import { inventoryItemSchema, tileTypeSchema } from '../shared/schemas';
import type { InventoryItem, TileType } from '../shared/types';
import type { TileKeeperDatabase } from './runMigrations';

export interface InventoryDetail {
  item: InventoryItem;
  tile: TileType | null;
  available_quantity: number;
}

export interface InventoryRepository {
  createInventoryItem(item: InventoryItem): Promise<void>;
  upsertInventoryItem(item: InventoryItem): Promise<void>;
  updateInventoryItem(tileTypeId: string, patch: Partial<InventoryItem>): Promise<InventoryItem>;
  deleteInventoryItem(tileTypeId: string): Promise<boolean>;
  getInventoryItem(tileTypeId: string): Promise<InventoryItem | null>;
  listInventoryItems(): Promise<InventoryItem[]>;
  listInventoryDetails(): Promise<InventoryDetail[]>;
}

interface InventoryRow {
  item_json: string;
}

interface InventoryDetailRow {
  item_json: string;
  tile_json: string | null;
}

function parseInventoryJson(itemJson: string): InventoryItem {
  return inventoryItemSchema.parse(JSON.parse(itemJson)) as InventoryItem;
}

function parseTileJson(tileJson: string | null): TileType | null {
  if (!tileJson) {
    return null;
  }
  return tileTypeSchema.parse(JSON.parse(tileJson)) as TileType;
}

function toInventoryDetail(row: InventoryDetailRow): InventoryDetail {
  const item = parseInventoryJson(row.item_json);
  return {
    item,
    tile: parseTileJson(row.tile_json),
    available_quantity: item.owned_quantity - item.reserved,
  };
}

function bindSql(db: TileKeeperDatabase, sql: string, params: unknown[]): Promise<unknown> {
  if (!db.runAsync) {
    throw new Error('Database adapter does not support parameterized writes');
  }
  return db.runAsync(sql, params);
}

async function itemExists(db: TileKeeperDatabase, tileTypeId: string): Promise<boolean> {
  const row = await db.getFirstAsync<{ tile_type_id: string }>('SELECT tile_type_id FROM user_inventory WHERE tile_type_id = ?', [tileTypeId]);
  return row !== null;
}

export function createInventoryRepository(db: TileKeeperDatabase): InventoryRepository {
  async function upsertInventoryItem(item: InventoryItem): Promise<void> {
    const parsedItem = inventoryItemSchema.parse(item);
    await bindSql(
      db,
      `INSERT INTO user_inventory (tile_type_id, owned_quantity, reserved, item_json, updated_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(tile_type_id) DO UPDATE SET
         owned_quantity = excluded.owned_quantity,
         reserved = excluded.reserved,
         item_json = excluded.item_json,
         updated_at = CURRENT_TIMESTAMP`,
      [
        parsedItem.tile_type_id,
        parsedItem.owned_quantity,
        parsedItem.reserved,
        JSON.stringify(parsedItem),
      ],
    );
  }

  async function getInventoryItem(tileTypeId: string): Promise<InventoryItem | null> {
    const row = await db.getFirstAsync<InventoryRow>('SELECT item_json FROM user_inventory WHERE tile_type_id = ?', [tileTypeId]);
    if (!row) {
      return null;
    }
    return parseInventoryJson(row.item_json);
  }

  async function listInventoryItems(): Promise<InventoryItem[]> {
    if (!db.getAllAsync) {
      const row = await db.getFirstAsync<{ item_json: string | null }>(
        "SELECT '[' || group_concat(item_json) || ']' AS item_json FROM user_inventory ORDER BY tile_type_id",
      );
      const json = row?.item_json ?? '[]';
      return (JSON.parse(json) as unknown[]).map((item) => inventoryItemSchema.parse(item) as InventoryItem);
    }

    const rows = await db.getAllAsync<InventoryRow>('SELECT item_json FROM user_inventory ORDER BY tile_type_id');
    return rows.map((row) => parseInventoryJson(row.item_json));
  }

  return {
    async createInventoryItem(item: InventoryItem): Promise<void> {
      const parsedItem = inventoryItemSchema.parse(item);
      if (await itemExists(db, parsedItem.tile_type_id)) {
        throw new Error(`Inventory item '${parsedItem.tile_type_id}' already exists`);
      }
      await upsertInventoryItem(parsedItem);
    },

    upsertInventoryItem,

    async updateInventoryItem(tileTypeId: string, patch: Partial<InventoryItem>): Promise<InventoryItem> {
      const existing = await getInventoryItem(tileTypeId);
      if (!existing) {
        throw new Error(`Inventory item '${tileTypeId}' does not exist`);
      }

      const nextItem = inventoryItemSchema.parse({ ...existing, ...patch, tile_type_id: tileTypeId }) as InventoryItem;
      await upsertInventoryItem(nextItem);
      return nextItem;
    },

    async deleteInventoryItem(tileTypeId: string): Promise<boolean> {
      if (!(await itemExists(db, tileTypeId))) {
        return false;
      }
      await bindSql(db, 'DELETE FROM user_inventory WHERE tile_type_id = ?', [tileTypeId]);
      return true;
    },

    getInventoryItem,
    listInventoryItems,

    async listInventoryDetails(): Promise<InventoryDetail[]> {
      if (!db.getAllAsync) {
        const items = await listInventoryItems();
        const details: InventoryDetail[] = [];
        for (const item of items) {
          const row = await db.getFirstAsync<{ tile_json: string | null }>('SELECT tile_json FROM tile_types WHERE id = ?', [
            item.tile_type_id,
          ]);
          details.push({ item, tile: parseTileJson(row?.tile_json ?? null), available_quantity: item.owned_quantity - item.reserved });
        }
        return details;
      }

      const rows = await db.getAllAsync<InventoryDetailRow>(
        `SELECT user_inventory.item_json, tile_types.tile_json
         FROM user_inventory
         LEFT JOIN tile_types ON tile_types.id = user_inventory.tile_type_id
         ORDER BY user_inventory.tile_type_id`,
      );
      return rows.map(toInventoryDetail);
    },
  };
}
