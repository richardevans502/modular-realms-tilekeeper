import type { BackupEnvelope, BackupRepositories, RestoreBackupEnvelopeOptions } from '../storage/backupEnvelope';
import { createBackupEnvelope, parseBackupEnvelope, restoreBackupEnvelope, serializeBackupEnvelope } from '../storage/backupEnvelope';
import type { SavedLayout, SavedLayoutRepository } from '../db/savedLayoutRepository';
import type { CatalogRepository } from '../db/catalogRepository';
import type { InventoryRepository } from '../db/inventoryRepository';
import type { InventoryItem, Layout, LayoutPlacement, TileType } from '../shared/types';
import { renderSchematicPreviewPngDataUrl, renderSchematicPreviewPngDataUrlPortable } from '../preview/schematicCanvas';
import { getSolverPerformanceTelemetry } from '../hooks/useLayoutSolver';

export interface ExportScreenRepositories {
  catalogRepository: CatalogRepository;
  inventoryRepository: InventoryRepository;
  savedLayoutRepository: Pick<SavedLayoutRepository, 'listLayouts' | 'deleteLayout' | 'upsertLayout'>;
}

export interface ExportableLayout {
  id: string;
  name: string;
  goal: string;
  placementCount: number;
  updatedAt: string;
  notes?: string;
  layout: Layout;
}

export interface ExportViewModel {
  exportableLayouts: ExportableLayout[];
  selectedLayoutId: string | null;
  backupJson: string | null;
  importResult: 'idle' | 'parsing' | 'success' | 'error';
  importErrorMessage: string | null;
  pngDataUrl: string | null;
  pngExportState: 'idle' | 'generating' | 'ready' | 'error';
}

export function buildExportableLayouts(savedLayouts: SavedLayout[]): ExportableLayout[] {
  return savedLayouts.map((saved) => ({
    id: saved.id,
    name: saved.name,
    goal: saved.layout.goal,
    placementCount: saved.layout.placements.length,
    updatedAt: saved.updated_at,
    notes: saved.notes,
    layout: saved.layout,
  }));
}

export function exportDiagnosticsJson(): string {
  return JSON.stringify({
    format: 'tilekeeper.diagnostics.v1',
    exported_at: new Date().toISOString(),
    solver_performance: getSolverPerformanceTelemetry(),
  }, null, 2);
}

export async function exportBackupJson(repositories: ExportScreenRepositories): Promise<string> {
  const backupRepositories: BackupRepositories = {
    catalogRepository: repositories.catalogRepository,
    inventoryRepository: repositories.inventoryRepository,
    savedLayoutRepository: repositories.savedLayoutRepository,
  };
  const envelope = await createBackupEnvelope(backupRepositories);
  return serializeBackupEnvelope(envelope);
}

export function parseImportJson(json: string): { envelope: BackupEnvelope; error: null } | { envelope: null; error: string } {
  try {
    const envelope = parseBackupEnvelope(json);
    return { envelope, error: null };
  } catch (err) {
    return { envelope: null, error: err instanceof Error ? err.message : 'Invalid backup file' };
  }
}

export async function importBackupJson(
  json: string,
  repositories: ExportScreenRepositories,
  options: RestoreBackupEnvelopeOptions = {},
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const backupRepositories: BackupRepositories = {
      catalogRepository: repositories.catalogRepository,
      inventoryRepository: repositories.inventoryRepository,
      savedLayoutRepository: repositories.savedLayoutRepository,
    };
    await restoreBackupEnvelope(json, backupRepositories, options);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Restore failed' };
  }
}

export async function exportLayoutJson(layout: Layout): Promise<string> {
  return JSON.stringify(layout, null, 2);
}

export async function generatePngDataUrl(
  layout: Layout,
  catalog: TileType[],
  scale?: number,
): Promise<{ dataUrl: string; error: null } | { dataUrl: null; error: string }> {
  try {
    const renderOptions = {
      cellSize: 32,
      padding: 12,
      showGrid: true,
      scale: scale ?? 2,
      backgroundColor: '#ffffff',
    };
    const dataUrl = typeof document === 'undefined'
      ? renderSchematicPreviewPngDataUrlPortable(layout.placements, catalog, renderOptions)
      : renderSchematicPreviewPngDataUrl(layout.placements, catalog, renderOptions);
    return { dataUrl, error: null };
  } catch (err) {
    return { dataUrl: null, error: err instanceof Error ? err.message : 'PNG generation failed' };
  }
}



export interface PrepSheetTileChecklistItem {
  tileTypeId: string;
  tileName: string;
  productSet: string;
  required: number;
  owned: number;
  missing: number;
}

export interface PrepSheetModel {
  layoutName: string;
  layout: Layout;
  schematicDataUrl: string | null;
  tileChecklist: PrepSheetTileChecklistItem[];
  missingTiles: PrepSheetTileChecklistItem[];
  notes: string;
  catalogVersion: string;
  solverVersion: string;
  generatedAt: string;
}

export function buildTileChecklist(
  placements: LayoutPlacement[],
  catalog: TileType[],
  inventory: InventoryItem[] = [],
): PrepSheetTileChecklistItem[] {
  const catalogById = new Map(catalog.map((tileType) => [tileType.id, tileType]));
  const ownedById = new Map(inventory.map((item) => [item.tile_type_id, item.owned_quantity]));
  const requiredById = new Map<string, number>();
  for (const placement of placements) {
    requiredById.set(placement.tile_type_id, (requiredById.get(placement.tile_type_id) ?? 0) + 1);
  }
  return [...requiredById.entries()]
    .map(([tileTypeId, required]) => {
      const tileType = catalogById.get(tileTypeId);
      const owned = ownedById.get(tileTypeId) ?? 0;
      return {
        tileTypeId,
        tileName: tileType?.name ?? tileTypeId,
        productSet: tileType?.product_set ?? 'Unknown set',
        required,
        owned,
        missing: Math.max(0, required - owned),
      };
    })
    .sort((a, b) => a.tileName.localeCompare(b.tileName) || a.tileTypeId.localeCompare(b.tileTypeId));
}

export async function buildPrepSheetModel(options: {
  exportableLayout: ExportableLayout;
  catalog: TileType[];
  inventory: InventoryItem[];
  generatedAt?: string;
}): Promise<PrepSheetModel> {
  const png = await generatePngDataUrl(options.exportableLayout.layout, options.catalog, 2);
  const tileChecklist = buildTileChecklist(options.exportableLayout.layout.placements, options.catalog, options.inventory);
  return {
    layoutName: options.exportableLayout.name,
    layout: options.exportableLayout.layout,
    schematicDataUrl: png.dataUrl,
    tileChecklist,
    missingTiles: tileChecklist.filter((item) => item.missing > 0),
    notes: options.exportableLayout.notes?.trim() || 'No prep notes recorded.',
    catalogVersion: options.exportableLayout.layout.catalog_version,
    solverVersion: options.exportableLayout.layout.solver_version,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
  };
}

export function buildPrepSheetHtml(model: PrepSheetModel): string {
  const checklistRows = model.tileChecklist.map((item) => `
    <tr>
      <td>${escapeHtml(item.tileName)}</td>
      <td>${escapeHtml(item.productSet)}</td>
      <td>${escapeHtml(item.tileTypeId)}</td>
      <td>${item.required}</td>
      <td>${item.owned}</td>
      <td>${item.missing}</td>
    </tr>`).join('');
  const missingList = model.missingTiles.length === 0
    ? '<p class="ok">No missing tiles. All systems cute.</p>'
    : `<ul>${model.missingTiles.map((item) => `<li>${escapeHtml(item.tileName)} — missing ${item.missing} of ${item.required}</li>`).join('')}</ul>`;
  const schematic = model.schematicDataUrl
    ? `<img class="schematic" src="${model.schematicDataUrl}" alt="Schematic map for ${escapeHtml(model.layoutName)}" />`
    : '<p class="warning">Schematic map could not be rendered; use the tile checklist below.</p>';

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>TileKeeper prep sheet - ${escapeHtml(model.layoutName)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #172033; margin: 32px; }
    h1 { color: #4f46e5; margin-bottom: 4px; }
    h2 { border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-top: 28px; }
    .meta { color: #475569; font-size: 12px; margin-bottom: 18px; }
    .schematic { max-width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; background: #fff; }
    table { border-collapse: collapse; width: 100%; margin-top: 10px; font-size: 12px; }
    th, td { border: 1px solid #cbd5e1; padding: 7px; text-align: left; }
    th { background: #eef2ff; color: #312e81; }
    .notes { white-space: pre-wrap; background: #f8fafc; border: 1px solid #cbd5e1; padding: 12px; border-radius: 8px; }
    .ok { color: #15803d; font-weight: 700; }
    .warning { color: #b45309; font-weight: 700; }
  </style>
</head>
<body>
  <h1>${escapeHtml(model.layoutName)}</h1>
  <div class="meta">
    Generated ${escapeHtml(model.generatedAt)} · Catalog version ${escapeHtml(model.catalogVersion)} · Solver version ${escapeHtml(model.solverVersion)} · ${model.layout.placements.length} placements
  </div>
  <h2>Schematic map</h2>
  ${schematic}
  <h2>Tile checklist</h2>
  <table>
    <thead><tr><th>Tile</th><th>Product set</th><th>Tile ID</th><th>Required</th><th>Owned available</th><th>Missing</th></tr></thead>
    <tbody>${checklistRows}</tbody>
  </table>
  <h2>Missing tiles</h2>
  ${missingList}
  <h2>Notes</h2>
  <div class="notes">${escapeHtml(model.notes)}</div>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
