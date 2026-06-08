import type { BackupEnvelope, BackupRepositories, RestoreBackupEnvelopeOptions } from '../storage/backupEnvelope';
import { createBackupEnvelope, parseBackupEnvelope, restoreBackupEnvelope, serializeBackupEnvelope } from '../storage/backupEnvelope';
import type { SavedLayout, SavedLayoutRepository } from '../db/savedLayoutRepository';
import type { CatalogRepository } from '../db/catalogRepository';
import type { InventoryRepository } from '../db/inventoryRepository';
import type { Layout, TileType } from '../shared/types';
import { renderSchematicPreviewPngDataUrl } from '../preview/schematicCanvas';

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
    layout: saved.layout,
  }));
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
    const dataUrl = renderSchematicPreviewPngDataUrl(layout.placements, catalog, {
      cellSize: 32,
      padding: 12,
      showGrid: true,
      scale: scale ?? 2,
      backgroundColor: '#ffffff',
    });
    return { dataUrl, error: null };
  } catch (err) {
    return { dataUrl: null, error: err instanceof Error ? err.message : 'PNG generation failed' };
  }
}
