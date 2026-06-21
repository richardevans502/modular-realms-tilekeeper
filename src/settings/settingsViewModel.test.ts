import { buildAboutSettingsModel, buildCatalogSettingsModel, buildDiagnosticsSettingsModel, nextAppearanceMode, parseSettingsBackupImport } from './settingsViewModel';
import type { DiagnosticSolverRun } from '../diagnostics/localDiagnostics';
import type { TileType } from '../shared/types';

const tile = (id: string, version: string, productSet = 'Core Set'): TileType => ({
  id,
  name: id,
  product_set: productSet,
  category: 'floor',
  catalog_status: 'official',
  catalog_version: version,
  dimensions: { unit: 'grid-cell', width: 1, height: 1, grid_cells: [{ x: 0, y: 0 }] },
  tags: [],
  faces: [
    {
      face_id: `${id}-front`,
      face_name: 'front',
      edge_sockets: [],
      rotation_rules: { allowed_rotations: [0, 90, 180, 270], flip_allowed: false },
      role_tags: [],
      theme_tags: [],
    },
  ],
});

describe('settings view model', () => {
  test('summarises catalog version, packs, and latest update timestamp from offline catalog rows', () => {
    const model = buildCatalogSettingsModel({
      tiles: [tile('crypt-floor', '2026.06', 'Crypt Pack'), tile('keep-wall', '2026.05', 'Keep Pack')],
      packs: [
        { id: 'core', version: '2026.05', updatedAt: '2026-06-10T10:00:00.000Z' },
        { id: 'crypt', version: '2026.06', updatedAt: '2026-06-12T11:30:00.000Z' },
      ],
      refreshedAt: '2026-06-12T11:30:00.000Z',
    });

    expect(model.catalogVersion).toBe('2026.06');
    expect(model.tileCount).toBe(2);
    expect(model.packList).toEqual(['core@2026.05', 'crypt@2026.06']);
    expect(model.lastUpdatedLabel).toBe('2026-06-12 11:30 UTC');
  });

  test('cycles appearance mode persistently between light and dark', () => {
    expect(nextAppearanceMode('light')).toBe('dark');
    expect(nextAppearanceMode('dark')).toBe('light');
  });

  test('builds about metadata with app, solver, catalog, build, and credits', () => {
    const about = buildAboutSettingsModel({
      appVersion: '0.1.0',
      solverVersion: 'layout-solver-v0.3-backtracking',
      catalogVersion: '2026.06',
      buildNumber: '42',
    });

    expect(about.rows).toEqual(expect.arrayContaining([
      { label: 'App version', value: '0.1.0' },
      { label: 'Solver version', value: 'layout-solver-v0.3-backtracking' },
      { label: 'Catalog version', value: '2026.06' },
      { label: 'Build number', value: '42' },
    ]));
    expect(about.openSourceCredits).toContain('React Native');
    expect(about.openSourceCredits).toContain('Expo');
  });

  test('validates backup import JSON before restore actions run', () => {
    const invalid = parseSettingsBackupImport('{"format":"wrong"}');
    if (invalid.valid) throw new Error('Expected invalid backup JSON');
    expect(invalid.error).toContain('Invalid TileKeeper backup envelope');
  });

  test('summarises solver telemetry for diagnostics', () => {
    const runs: DiagnosticSolverRun[] = [
      {
        timestamp: '2026-06-12T10:00:00.000Z',
        solverVersion: 'solver-a',
        durationMs: 123.4,
        exploredStates: 42,
        resultCount: 3,
        fromCache: false,
        cancelled: false,
      },
    ];

    expect(buildDiagnosticsSettingsModel(runs)).toEqual({
      runCount: 1,
      latestRunLabel: '2026-06-12 10:00 UTC',
      averageDurationMs: 123,
      latestSolverVersion: 'solver-a',
      latestExploredStates: 42,
      latestResultCount: 3,
    });
  });
});
