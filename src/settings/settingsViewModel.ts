import { parseBackupEnvelope } from '../storage/backupEnvelope';
import type { DiagnosticSolverRun } from '../diagnostics/localDiagnostics';
import type { TileType } from '../shared/types';

export type AppearanceMode = 'light' | 'dark';

export interface CatalogPackSettingsRow {
  id: string;
  version: string;
  updatedAt?: string | null;
}

export interface CatalogSettingsInput {
  tiles: TileType[];
  packs?: CatalogPackSettingsRow[];
  refreshedAt?: string | null;
}

export interface CatalogSettingsModel {
  catalogVersion: string;
  tileCount: number;
  packList: string[];
  lastUpdatedLabel: string;
}

export interface AboutSettingsInput {
  appVersion?: string | null;
  solverVersion?: string | null;
  catalogVersion?: string | null;
  buildNumber?: string | null;
}

export interface AboutSettingsModel {
  rows: Array<{ label: string; value: string }>;
  openSourceCredits: string;
}

export interface DiagnosticsSettingsModel {
  runCount: number;
  latestRunLabel: string;
  averageDurationMs: number;
  latestSolverVersion: string;
  latestExploredStates: number;
  latestResultCount: number;
}

export function buildCatalogSettingsModel(input: CatalogSettingsInput): CatalogSettingsModel {
  const versions = input.tiles.map((tile) => tile.catalog_version).filter(Boolean).sort((left, right) => right.localeCompare(left));
  const packDates = (input.packs ?? []).map((pack) => pack.updatedAt).filter((date): date is string => Boolean(date));
  const latestUpdated = [input.refreshedAt ?? undefined, ...packDates]
    .filter((date): date is string => Boolean(date))
    .sort((left, right) => Date.parse(right) - Date.parse(left))[0];

  return {
    catalogVersion: versions[0] ?? 'offline-seed',
    tileCount: input.tiles.length,
    packList: (input.packs ?? []).map((pack) => `${pack.id}@${pack.version}`).sort((left, right) => left.localeCompare(right)),
    lastUpdatedLabel: latestUpdated ? formatUtcDateTime(latestUpdated) : 'Not refreshed yet',
  };
}

export function nextAppearanceMode(current: AppearanceMode): AppearanceMode {
  return current === 'dark' ? 'light' : 'dark';
}

export function buildAboutSettingsModel(input: AboutSettingsInput): AboutSettingsModel {
  return {
    rows: [
      { label: 'App version', value: input.appVersion || '0.0.0' },
      { label: 'Solver version', value: input.solverVersion || 'unknown' },
      { label: 'Catalog version', value: input.catalogVersion || 'unknown' },
      { label: 'Build number', value: input.buildNumber || 'development' },
    ],
    openSourceCredits: 'Built with React Native, Expo, Expo Router, SQLite, Jest, TypeScript, and Zod.',
  };
}

export function parseSettingsBackupImport(json: string): { valid: true; summary: string } | { valid: false; error: string } {
  try {
    const envelope = parseBackupEnvelope(json);
    const { catalog_tiles, inventory_items, saved_layouts } = envelope.payload;
    return {
      valid: true,
      summary: `${catalog_tiles.length} catalog tiles, ${inventory_items.length} inventory rows, ${saved_layouts.length} saved layouts`,
    };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Invalid backup file' };
  }
}

export function buildDiagnosticsSettingsModel(runs: DiagnosticSolverRun[]): DiagnosticsSettingsModel {
  const latest = runs.at(-1);
  const averageDurationMs = runs.length === 0
    ? 0
    : Math.round(runs.reduce((total, run) => total + run.durationMs, 0) / runs.length);

  return {
    runCount: runs.length,
    latestRunLabel: latest ? formatUtcDateTime(latest.timestamp) : 'No solver runs recorded',
    averageDurationMs,
    latestSolverVersion: latest?.solverVersion ?? 'unknown',
    latestExploredStates: latest?.exploredStates ?? 0,
    latestResultCount: latest?.resultCount ?? 0,
  };
}

export function formatUtcDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min} UTC`;
}
