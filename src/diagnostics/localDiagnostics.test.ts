import {
  DIAGNOSTIC_LIMITS,
  DIAGNOSTICS_DECISION,
  buildAnonymizedLayoutFixture,
  buildLocalDiagnosticLog,
  clearDiagnosticBuffers,
  recordDiagnosticError,
  recordDiagnosticNavigation,
  recordDiagnosticSolverRun,
} from './localDiagnostics';

describe('local diagnostics log', () => {
  beforeEach(() => {
    clearDiagnosticBuffers();
  });

  test('documents the approved local-only monitoring decision', () => {
    expect(DIAGNOSTICS_DECISION).toMatchObject({
      approach: 'local-only-diagnostics',
      approvedBy: 'labby-default-privacy-gate',
    });
    expect(DIAGNOSTICS_DECISION.rationale).toContain('local-only');
    expect(DIAGNOSTICS_DECISION.rationale).toContain('without sending inventory, layout, goal, seed, or device identifiers');
  });

  test('exports only bounded non-PII telemetry categories', () => {
    for (let index = 0; index < DIAGNOSTIC_LIMITS.solverRuns + 3; index += 1) {
      recordDiagnosticSolverRun({
        timestamp: `2026-06-12T12:${String(index).padStart(2, '0')}:00.000Z`,
        solverVersion: 'solver-test',
        durationMs: index,
        exploredStates: index * 2,
        resultCount: index % 3,
        fromCache: index % 2 === 0,
        cancelled: false,
      });
      recordDiagnosticNavigation(`/route-${index}`);
      recordDiagnosticError(new Error(`failure-${index}`), { handled: true, context: 'unit-test' });
    }

    const log = buildLocalDiagnosticLog({
      generatedAt: '2026-06-12T13:00:00.000Z',
      appName: 'TileKeeper Test',
      appVersion: '0.1.0-test',
    });

    expect(log.collectionMode).toBe('local-only-opt-in');
    expect(log.app).toEqual({ name: 'TileKeeper Test', version: '0.1.0-test' });
    expect(log.solver.runs).toHaveLength(DIAGNOSTIC_LIMITS.solverRuns);
    expect(log.navigation.events).toHaveLength(DIAGNOSTIC_LIMITS.navigationEvents);
    expect(log.errors).toHaveLength(DIAGNOSTIC_LIMITS.errors);
    const serializedTelemetry = JSON.stringify({ app: log.app, solver: log.solver, navigation: log.navigation, errors: log.errors });
    expect(serializedTelemetry).not.toMatch(/owned_quantity|placements|goal text|seed-/i);
    expect(log.consent.excluded).toEqual(expect.arrayContaining(['inventory data', 'layout data', 'seed values', 'device identifiers']));
  });

  test('exports solver version, catalog version, and anonymized replay fixture without user PII', () => {
    const fixture = buildAnonymizedLayoutFixture({
      catalog: [
        {
          id: 'custom-rich-secret-room',
          name: 'Rich secret room',
          product_set: 'Private pack',
          dimensions: { unit: 'grid-cell', width: 1, height: 1, grid_cells: [{ x: 0, y: 0 }] },
          faces: [
            {
              face_id: 'rich-face-a',
              face_name: 'Rich face',
              role_tags: ['floor'],
              edge_sockets: [
                { face: 'north', socket_type: 'open-floor', bidirectional: true, reason: 'test socket' },
                { face: 'east', socket_type: 'open-floor', bidirectional: true, reason: 'test socket' },
                { face: 'south', socket_type: 'open-floor', bidirectional: true, reason: 'test socket' },
                { face: 'west', socket_type: 'open-floor', bidirectional: true, reason: 'test socket' },
              ],
              rotation_rules: { allowed_rotations: [0, 90], flip_allowed: false },
              theme_tags: ['stone'],
            },
          ],
          catalog_status: 'custom',
          category: 'floor',
          tags: ['rich-private-tag'],
          catalog_version: 'private-catalog-v7',
          notes: 'stored at 56 Uplands Road',
        },
      ],
      inventory: [{ tile_type_id: 'custom-rich-secret-room', owned_quantity: 2, condition: 'damaged', notes: 'Rich note', storage_location: 'garage' }],
      bounds: { width: 2, height: 1 },
      targetPlacements: 2,
      issueKind: 'layout-generation',
    });

    const log = buildLocalDiagnosticLog({
      generatedAt: '2026-06-19T10:00:00.000Z',
      appName: 'TileKeeper Test',
      appVersion: '0.1.0-test',
      anonymizedFixture: fixture,
    });

    expect(log.solver.version).toBe('layout-solver-v0.3-backtracking');
    expect(log.catalog?.version).toBe('private-catalog-v7');
    expect(log.anonymizedFixture?.catalog[0].id).toBe('fixture-tile-001');
    expect(log.anonymizedFixture?.inventory).toEqual([
      { tile_type_id: 'fixture-tile-001', owned_quantity: 2, condition: 'unknown' },
    ]);
    expect(log.anonymizedFixture?.solverInput.goal).toBe('diagnostic-replay-layout-generation');
    expect(JSON.stringify(log)).not.toMatch(/Rich|secret|Uplands|garage|private-tag|rich-face|custom-rich/i);
  });
});
