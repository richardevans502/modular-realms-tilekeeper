import { buildAnonymizedLayoutFixture, buildLocalDiagnosticLog } from './localDiagnostics';
import { replayDiagnosticsExport } from './diagnosticsReplay';
import type { InventoryItem, TileType } from '../shared/types';

const replayTile: TileType = {
  id: 'custom-user-tile',
  name: 'User named tile',
  product_set: 'Home set',
  dimensions: { unit: 'grid-cell', width: 1, height: 1, grid_cells: [{ x: 0, y: 0 }] },
  faces: [
    {
      face_id: 'face-user-a',
      face_name: 'User face',
      role_tags: ['floor'],
      edge_sockets: [
        { face: 'north', socket_type: 'open-floor', bidirectional: true, reason: 'fixture' },
        { face: 'east', socket_type: 'open-floor', bidirectional: true, reason: 'fixture' },
        { face: 'south', socket_type: 'open-floor', bidirectional: true, reason: 'fixture' },
        { face: 'west', socket_type: 'open-floor', bidirectional: true, reason: 'fixture' },
      ],
      rotation_rules: { allowed_rotations: [0, 90, 180, 270], flip_allowed: true },
      theme_tags: ['floor'],
    },
  ],
  catalog_status: 'custom',
  category: 'floor',
  tags: ['user-secret-tag'],
  catalog_version: '2026.06.support',
};

const replayInventory: InventoryItem[] = [
  { tile_type_id: replayTile.id, owned_quantity: 2, condition: 'worn', notes: 'private note', storage_location: 'private shelf' },
];

describe('diagnostics replay', () => {
  test('replays an anonymized diagnostics fixture through the layout solver', () => {
    const anonymizedFixture = buildAnonymizedLayoutFixture({
      catalog: [replayTile],
      inventory: replayInventory,
      bounds: { width: 2, height: 1 },
      targetPlacements: 2,
      issueKind: 'layout-generation',
    });
    const log = buildLocalDiagnosticLog({
      generatedAt: '2026-06-19T11:00:00.000Z',
      appVersion: '0.1.0-test',
      anonymizedFixture,
    });

    const replay = replayDiagnosticsExport(log);

    if (!replay.ok) throw new Error(`Expected replay to succeed, got ${replay.reason}`);
    expect(replay.solverVersion).toBe(log.solver.version);
    expect(replay.catalogVersion).toBe('2026.06.support');
    const { result } = replay;
    if (!result.ok) throw new Error(`Expected solver to succeed, got ${result.reason}`);
    expect(result.layouts[0].layout.placements).toHaveLength(2);
    expect(result.layouts[0].layout.catalog_version).toBe('2026.06.support');
    expect(JSON.stringify(replay)).not.toMatch(/User|private|secret|custom-user|face-user/i);
  });

  test('rejects diagnostics exports that do not contain an anonymized fixture', () => {
    const log = buildLocalDiagnosticLog({ generatedAt: '2026-06-19T11:30:00.000Z' });

    const replay = replayDiagnosticsExport(log);

    if (replay.ok) throw new Error('Expected replay to reject missing fixtures');
    expect(replay.reason).toBe('missing-anonymized-fixture');
  });
});
