import { z } from 'zod';

import type { SavedLayout } from '../db/savedLayoutRepository';
import type { CatalogRepository } from '../db/catalogRepository';
import type { InventoryRepository } from '../db/inventoryRepository';
import type { SavedLayoutRepository } from '../db/savedLayoutRepository';
import { inventoryItemSchema, layoutSchema, tileTypeSchema } from '../shared/schemas';
import type { InventoryItem, Layout, TileType } from '../shared/types';

export const BACKUP_ENVELOPE_FORMAT = 'tilekeeper.backup.v1' as const;
export const BACKUP_ENVELOPE_SCHEMA_VERSION = 1 as const;

export interface BackupPayload {
  catalog_tiles: TileType[];
  inventory_items: InventoryItem[];
  saved_layouts: Layout[];
}

export interface BackupEnvelope {
  format: typeof BACKUP_ENVELOPE_FORMAT;
  schema_version: typeof BACKUP_ENVELOPE_SCHEMA_VERSION;
  product_version: string;
  exported_at: string;
  payload: BackupPayload;
}

export interface BackupRepositories {
  catalogRepository: Pick<CatalogRepository, 'upsertTileType' | 'getTileType' | 'listTileTypes' | 'deleteTileType'>;
  inventoryRepository: Pick<InventoryRepository, 'upsertInventoryItem' | 'listInventoryItems' | 'deleteInventoryItem'>;
  /**
   * Optional repository for saved layouts. When provided, createBackupEnvelope
   * includes all saved layouts in the backup payload, and restoreBackupEnvelope
   * restores them in replace or merge mode.
   */
  savedLayoutRepository?: Pick<SavedLayoutRepository, 'listLayouts' | 'deleteLayout' | 'upsertLayout'>;
  /**
   * Optional repository-level transaction wrapper for atomic restore operations.
   * Callers that provide SQLite-backed repositories should pass the database
   * transaction primitive here so replace-mode imports roll back cleanly if any
   * delete or upsert fails.
   */
  runInTransaction?: (task: () => Promise<void>) => Promise<void>;
}

export interface CreateBackupEnvelopeOptions {
  productVersion?: string;
  exportedAt?: string;
}

export interface RestoreBackupEnvelopeOptions {
  mode?: 'replace' | 'merge';
}

export const backupEnvelopeSchema = z
  .object({
    format: z.literal(BACKUP_ENVELOPE_FORMAT),
    schema_version: z.literal(BACKUP_ENVELOPE_SCHEMA_VERSION),
    product_version: z.string().min(1),
    exported_at: z.string().datetime({ offset: true }),
    payload: z
      .object({
        catalog_tiles: z.array(tileTypeSchema),
        inventory_items: z.array(inventoryItemSchema),
        saved_layouts: z.array(layoutSchema),
      })
      .strict(),
  })
  .strict()
  .superRefine((envelope, ctx) => {
    const catalogIds = new Set(envelope.payload.catalog_tiles.map((tile) => tile.id));
    const seenTileIds = new Set<string>();

    envelope.payload.catalog_tiles.forEach((tile, index) => {
      if (seenTileIds.has(tile.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['payload', 'catalog_tiles', index, 'id'],
          message: `Duplicate catalog tile '${tile.id}' in backup`,
        });
      }
      seenTileIds.add(tile.id);
    });

    const seenInventoryIds = new Set<string>();
    envelope.payload.inventory_items.forEach((item, index) => {
      if (seenInventoryIds.has(item.tile_type_id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['payload', 'inventory_items', index, 'tile_type_id'],
          message: `Duplicate inventory item '${item.tile_type_id}' in backup`,
        });
      }
      seenInventoryIds.add(item.tile_type_id);

      if (!catalogIds.has(item.tile_type_id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['payload', 'inventory_items', index, 'tile_type_id'],
          message: `Inventory item '${item.tile_type_id}' has no matching catalog tile in backup`,
        });
      }
    });
  });

export type BackupEnvelopeInput = z.infer<typeof backupEnvelopeSchema>;

function defaultProductVersion(): string {
  return '0.1.0';
}

function normalizeEnvelope(input: BackupEnvelopeInput): BackupEnvelope {
  return {
    format: input.format,
    schema_version: input.schema_version,
    product_version: input.product_version,
    exported_at: input.exported_at,
    payload: {
      catalog_tiles: input.payload.catalog_tiles as TileType[],
      inventory_items: input.payload.inventory_items as InventoryItem[],
      saved_layouts: input.payload.saved_layouts as Layout[],
    },
  };
}

export async function createBackupEnvelope(
  repositories: BackupRepositories,
  options: CreateBackupEnvelopeOptions = {},
): Promise<BackupEnvelope> {
  const [catalogTiles, inventoryItems, savedLayouts] = await Promise.all([
    repositories.catalogRepository.listTileTypes(),
    repositories.inventoryRepository.listInventoryItems(),
    repositories.savedLayoutRepository
      ? repositories.savedLayoutRepository.listLayouts().then((layouts) => layouts.map((saved) => saved.layout))
      : Promise.resolve([] as Layout[]),
  ]);

  const envelope = {
    format: BACKUP_ENVELOPE_FORMAT,
    schema_version: BACKUP_ENVELOPE_SCHEMA_VERSION,
    product_version: options.productVersion ?? defaultProductVersion(),
    exported_at: options.exportedAt ?? new Date().toISOString(),
    payload: {
      catalog_tiles: catalogTiles,
      inventory_items: inventoryItems,
      saved_layouts: savedLayouts,
    },
  };

  return normalizeEnvelope(backupEnvelopeSchema.parse(envelope));
}

export function parseBackupEnvelope(json: string): BackupEnvelope {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (error) {
    throw new Error(`Invalid TileKeeper backup envelope: malformed JSON (${(error as Error).message})`);
  }

  const result = backupEnvelopeSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Invalid TileKeeper backup envelope: ${result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')}`);
  }

  return normalizeEnvelope(result.data);
}

export function serializeBackupEnvelope(envelope: BackupEnvelope): string {
  const parsedEnvelope = normalizeEnvelope(backupEnvelopeSchema.parse(envelope));
  return `${JSON.stringify(parsedEnvelope, null, 2)}\n`;
}

function layoutToSavedLayout(layout: Layout): SavedLayout {
  const tags = new Set(layout.placements.map((p) => p.tile_type_id));
  return {
    id: layout.id,
    name: layout.goal.split(/\r?\n/)[0]?.trim() || layout.id,
    layout,
    tags: Array.from(tags).sort(),
    favourite: false,
    created_at: layout.created_at,
    updated_at: new Date().toISOString(),
  };
}

async function replaceCatalogInventoryAndLayouts(
  envelope: BackupEnvelope,
  repositories: BackupRepositories,
): Promise<void> {
  const backupTileIds = new Set(envelope.payload.catalog_tiles.map((tile) => tile.id));
  const existingInventory = await repositories.inventoryRepository.listInventoryItems();
  for (const item of existingInventory) {
    await repositories.inventoryRepository.deleteInventoryItem(item.tile_type_id);
  }

  const existingCatalog = await repositories.catalogRepository.listTileTypes();
  for (const tile of existingCatalog) {
    if (!backupTileIds.has(tile.id)) {
      await repositories.catalogRepository.deleteTileType(tile.id);
    }
  }

  if (repositories.savedLayoutRepository) {
    const existingLayouts = await repositories.savedLayoutRepository.listLayouts();
    for (const layout of existingLayouts) {
      await repositories.savedLayoutRepository!.deleteLayout(layout.id);
    }
  }
}

export async function restoreBackupEnvelope(
  backup: string | BackupEnvelope,
  repositories: BackupRepositories,
  options: RestoreBackupEnvelopeOptions = {},
): Promise<void> {
  const envelope = typeof backup === 'string' ? parseBackupEnvelope(backup) : normalizeEnvelope(backupEnvelopeSchema.parse(backup));
  const mode = options.mode ?? 'replace';

  const restore = async (): Promise<void> => {
    if (mode === 'replace') {
      await replaceCatalogInventoryAndLayouts(envelope, repositories);
    }

    for (const tile of envelope.payload.catalog_tiles) {
      await repositories.catalogRepository.upsertTileType(tile);
    }

    for (const item of envelope.payload.inventory_items) {
      await repositories.inventoryRepository.upsertInventoryItem(item);
    }

    if (repositories.savedLayoutRepository) {
      for (const layout of envelope.payload.saved_layouts) {
        await repositories.savedLayoutRepository.upsertLayout(layoutToSavedLayout(layout));
      }
    }
  };

  if (repositories.runInTransaction) {
    await repositories.runInTransaction(restore);
    return;
  }

  await restore();
}
