import { DatabaseSync } from 'node:sqlite';

import { loadSeedCatalog } from '../catalog/loadSeedCatalog';
import { createCatalogRepository } from '../db/catalogRepository';
import { initTileKeeperDatabase } from '../db/init';
import { createInventoryRepository } from '../db/inventoryRepository';
import { createSavedLayoutRepository } from '../db/savedLayoutRepository';
import { runMigrations, type TileKeeperDatabase } from '../db/runMigrations';
import { solveLayoutFromInventory, solveTopRankedLayouts } from '../layout/layoutSolver';
import { buildMissingTileSuggestions } from '../layout/missingTileSuggestions';
import { buildSchematicPreviewModel, renderSchematicPreviewSvg } from '../preview/schematicPreview';
import { createBackupEnvelope, parseBackupEnvelope, restoreBackupEnvelope } from '../storage/backupEnvelope';
import { layoutSchema } from '../shared/schemas';
import type { InventoryItem, Layout, TileType } from '../shared/types';

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

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(async () => {
    const sqlite = new DatabaseSync(':memory:');
    sqlite.exec('PRAGMA foreign_keys = ON');
    return new NodeSqliteAdapter(sqlite);
  }),
}));

describe('E2E M3+M4 smoke test — full workflow from catalog to export', () => {
  let catalog: TileType[];
  let inventoryItems: InventoryItem[];

  beforeAll(() => {
    catalog = loadSeedCatalog();
    inventoryItems = catalog
      .filter((tile) => tile.category === 'floor')
      .slice(0, 10)
      .map((tile) => ({
        tile_type_id: tile.id,
        owned_quantity: 2,
        reserved: 0,
        condition: 'good' as const,
      }));
  });

  test('seed catalog loads and validates via Zod', () => {
    expect(catalog.length).toBeGreaterThanOrEqual(20);
    expect(catalog.some((tile) => tile.faces.length > 1)).toBe(true);
  });

  test('M3 — solver generates a deterministic valid layout from seed catalog + inventory', () => {
    const result = solveLayoutFromInventory({
      catalog,
      inventory: inventoryItems,
      bounds: { width: 4, height: 4 },
      targetPlacements: 5,
      seed: 'e2e-smoke-seed',
      goal: 'E2E smoke test layout',
      createdAt: new Date().toISOString(),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected solver success');

    expect(result.layout.placements.length).toBeGreaterThanOrEqual(1);
    expect(result.layout.placements.length).toBeLessThanOrEqual(5);
    expect(result.trace.inventoryConsumed).toBeDefined();
    expect(result.trace.rejectedCandidates).toBeDefined();
    expect(layoutSchema.safeParse(result.layout).success).toBe(true);
  });

  test('M3 — solver produces top-N ranked alternatives deterministically', () => {
    const result = solveTopRankedLayouts(
      {
        catalog,
        inventory: inventoryItems,
        bounds: { width: 3, height: 3 },
        targetPlacements: 3,
        seed: 'e2e-topn-seed',
        goal: 'Top-N smoke test',
        createdAt: new Date().toISOString(),
      },
      { topN: 3 },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected top-N success');

    expect(result.layouts.length).toBeGreaterThanOrEqual(1);
    expect(result.layouts.length).toBeLessThanOrEqual(3);
    expect(result.layouts[0].rank).toBe(1);

    const repeated = solveTopRankedLayouts(
      {
        catalog,
        inventory: inventoryItems,
        bounds: { width: 3, height: 3 },
        targetPlacements: 3,
        seed: 'e2e-topn-seed',
        goal: 'Top-N smoke test',
        createdAt: new Date().toISOString(),
      },
      { topN: 3 },
    );
    if (!repeated.ok) throw new Error('expected repeat success');

    expect(repeated.layouts.map((l) => l.layout.id)).toEqual(result.layouts.map((l) => l.layout.id));
  });

  test('M3 — missing-tile suggestions are generated from solver trace', () => {
    const limitedInventory = catalog.slice(0, 3).map((tile) => ({
      tile_type_id: tile.id,
      owned_quantity: 1,
      reserved: 0,
      condition: 'good' as const,
    }));

    const result = solveLayoutFromInventory({
      catalog,
      inventory: limitedInventory,
      bounds: { width: 5, height: 5 },
      targetPlacements: 10,
      seed: 'e2e-missing-seed',
      goal: 'Missing tile smoke test',
      createdAt: new Date().toISOString(),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected success');

    const suggestions = buildMissingTileSuggestions({
      trace: result.trace,
      catalog,
      inventory: limitedInventory,
    });

    expect(Array.isArray(suggestions)).toBe(true);
  });

  test('M4 — schematic preview renders from solver layout', () => {
    const solverResult = solveLayoutFromInventory({
      catalog,
      inventory: inventoryItems,
      bounds: { width: 3, height: 3 },
      targetPlacements: 3,
      seed: 'e2e-preview-seed',
      goal: 'Preview smoke test',
      createdAt: new Date().toISOString(),
    });

    expect(solverResult.ok).toBe(true);
    if (!solverResult.ok) throw new Error('expected success');

    const model = buildSchematicPreviewModel(solverResult.layout.placements, catalog, {
      cellSize: 32,
      showGrid: true,
    });

    expect(model.tiles.length).toBe(solverResult.layout.placements.length);
    expect(model.width).toBeGreaterThan(0);
    expect(model.height).toBeGreaterThan(0);

    const svg = renderSchematicPreviewSvg(solverResult.layout.placements, catalog);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('tile-cell');
  });

  test('M4 — saved layout repository round-trips through SQLite', async () => {
    const persistence = await initTileKeeperDatabase(':memory:');
    const repo = createSavedLayoutRepository(persistence.db as unknown as TileKeeperDatabase);

    const solverResult = solveLayoutFromInventory({
      catalog,
      inventory: inventoryItems,
      bounds: { width: 2, height: 2 },
      targetPlacements: 2,
      seed: 'e2e-repo-seed',
      goal: 'Repository smoke test',
      createdAt: new Date().toISOString(),
    });

    expect(solverResult.ok).toBe(true);
    if (!solverResult.ok) throw new Error('expected success');

    const layout: Layout = solverResult.layout;
    await repo.createLayout(layout);

    const retrieved = await repo.getLayout(layout.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.id).toBe(layout.id);
    expect(retrieved!.placements).toEqual(layout.placements);

    const list = await repo.listLayouts();
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(layout.id);

    const deleted = await repo.deleteLayout(layout.id);
    expect(deleted).toBe(true);
    expect(await repo.getLayout(layout.id)).toBeNull();
  });

  test('M2+M4 — backup envelope exports and restores catalog + inventory', async () => {
    const persistence = await initTileKeeperDatabase(':memory:');

    for (const tile of catalog.slice(0, 5)) {
      await persistence.catalogRepository.upsertTileType(tile);
    }
    for (const item of inventoryItems.slice(0, 3)) {
      await persistence.inventoryRepository.upsertInventoryItem(item);
    }

    const envelope = await createBackupEnvelope(persistence);
    expect(envelope.format).toBe('tilekeeper.backup.v1');
    expect(envelope.payload.catalog_tiles.length).toBe(5);
    expect(envelope.payload.inventory_items.length).toBe(3);

    const serialized = JSON.stringify(envelope);
    const parsed = parseBackupEnvelope(serialized);
    expect(parsed.payload.catalog_tiles.length).toBe(5);

    const freshPersistence = await initTileKeeperDatabase(':memory:');
    await restoreBackupEnvelope(serialized, freshPersistence, { mode: 'replace' });

    const restoredCatalog = await freshPersistence.catalogRepository.listTileTypes();
    const restoredInventory = await freshPersistence.inventoryRepository.listInventoryItems();

    expect(restoredCatalog.length).toBe(5);
    expect(restoredInventory.length).toBe(3);
    expect(restoredInventory.map((i) => i.tile_type_id).sort()).toEqual(
      inventoryItems.slice(0, 3).map((i) => i.tile_type_id).sort(),
    );
  });

  test('M3+M4 — complete workflow: solve → preview → save → export → backup', async () => {
    const persistence = await initTileKeeperDatabase(':memory:');
    const savedLayoutRepo = createSavedLayoutRepository(persistence.db as unknown as TileKeeperDatabase);

    for (const tile of catalog.slice(0, 8)) {
      await persistence.catalogRepository.upsertTileType(tile);
    }
    for (const item of inventoryItems.slice(0, 5)) {
      await persistence.inventoryRepository.upsertInventoryItem(item);
    }

    const solverResult = solveLayoutFromInventory({
      catalog: catalog.slice(0, 8),
      inventory: inventoryItems.slice(0, 5),
      bounds: { width: 3, height: 3 },
      targetPlacements: 3,
      seed: 'e2e-full-seed',
      goal: 'Full workflow smoke test',
      createdAt: new Date().toISOString(),
    });

    expect(solverResult.ok).toBe(true);
    if (!solverResult.ok) throw new Error('expected success');

    const layout: Layout = solverResult.layout;

    const svg = renderSchematicPreviewSvg(layout.placements, catalog.slice(0, 8));
    expect(svg.length).toBeGreaterThan(100);

    await savedLayoutRepo.createLayout(layout);
    const saved = await savedLayoutRepo.getLayout(layout.id);
    expect(saved).toEqual(layout);

    const envelope = await createBackupEnvelope(persistence);
    expect(envelope.payload.saved_layouts.length).toBe(0);
    expect(envelope.payload.catalog_tiles.length).toBe(8);
  });
});
