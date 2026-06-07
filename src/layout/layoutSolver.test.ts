import type { InventoryItem, Rotation, SocketType, TileType } from '../shared/types';
import { validateSocketCompatibility } from './placementGrid';
import { solveLayoutFromInventory, solveTopRankedLayouts } from './layoutSolver';

function singleCellTile(
  id: string,
  faces: Array<{
    face_id: string;
    sockets: Record<'north' | 'east' | 'south' | 'west', SocketType>;
    allowed_rotations?: Rotation[];
  }>,
): TileType {
  return {
    id,
    name: id,
    product_set: 'Solver Test Pack',
    dimensions: {
      unit: 'grid-cell',
      width: 1,
      height: 1,
      grid_cells: [{ x: 0, y: 0 }],
    },
    faces: faces.map((face) => ({
      face_id: face.face_id,
      face_name: face.face_id,
      role_tags: ['room'],
      edge_sockets: (['north', 'east', 'south', 'west'] as const).map((edge) => ({
        face: edge,
        socket_type: face.sockets[edge],
        bidirectional: true,
        reason: `${edge} ${face.sockets[edge]}`,
      })),
      rotation_rules: { allowed_rotations: face.allowed_rotations ?? [0, 90, 180, 270], flip_allowed: false },
      theme_tags: ['test'],
    })),
    catalog_status: 'custom',
    category: 'floor',
    tags: ['test'],
    catalog_version: 'test-catalog',
  };
}

function inventory(tile_type_id: string, owned_quantity: number, reserved = 0): InventoryItem {
  return {
    tile_type_id,
    owned_quantity,
    reserved,
    condition: 'good',
  };
}

function lShapedTile(
  id: string,
  sockets: Record<'north' | 'east' | 'south' | 'west', SocketType>,
  allowed_rotations: Rotation[] = [0, 90, 180, 270],
): TileType {
  return {
    id,
    name: id,
    product_set: 'Solver Test Pack',
    dimensions: {
      unit: 'grid-cell',
      width: 2,
      height: 2,
      grid_cells: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
      ],
    },
    faces: [
      {
        face_id: 'front',
        face_name: 'front',
        role_tags: ['room'],
        edge_sockets: (['north', 'east', 'south', 'west'] as const).map((edge) => ({
          face: edge,
          socket_type: sockets[edge],
          bidirectional: true,
          reason: `${edge} ${sockets[edge]}`,
        })),
        rotation_rules: { allowed_rotations, flip_allowed: false },
        theme_tags: ['test'],
      },
    ],
    catalog_status: 'custom',
    category: 'floor',
    tags: ['test'],
    catalog_version: 'test-catalog',
  };
}

const doorwayRun = singleCellTile('doorway-run', [
  {
    face_id: 'front',
    sockets: { north: 'wall', east: 'doorway', south: 'wall', west: 'doorway' },
  },
]);

describe('layout solver inventory constraints and face selection', () => {
  test('generates deterministic layouts without consuming more physical tiles than available inventory', () => {
    const first = solveLayoutFromInventory({
      catalog: [doorwayRun],
      inventory: [inventory('doorway-run', 3, 1)],
      bounds: { width: 5, height: 1 },
      targetPlacements: 4,
      seed: 'inventory-limit-seed',
      goal: 'inventory limit test',
      createdAt: '2026-06-06T12:00:00.000Z',
    });
    const second = solveLayoutFromInventory({
      catalog: [doorwayRun],
      inventory: [inventory('doorway-run', 3, 1)],
      bounds: { width: 5, height: 1 },
      targetPlacements: 4,
      seed: 'inventory-limit-seed',
      goal: 'inventory limit test',
      createdAt: '2026-06-06T12:00:00.000Z',
    });

    expect(first).toEqual(second);
    expect(first.ok).toBe(true);
    if (!first.ok) {
      throw new Error('expected solver success');
    }

    expect(first.layout.placements).toHaveLength(2);
    expect(first.trace.inventoryConsumed).toEqual({ 'doorway-run': 2 });
    expect(first.trace.missingRequestedPlacements).toBe(2);
  });

  test('selects the compatible face and allowed rotation for double-sided physical tiles', () => {
    const doubleSidedConnector = singleCellTile('double-sided-connector', [
      {
        face_id: 'wall-face',
        sockets: { north: 'wall', east: 'wall', south: 'wall', west: 'wall' },
      },
      {
        face_id: 'door-face',
        sockets: { north: 'doorway', east: 'wall', south: 'wall', west: 'wall' },
        allowed_rotations: [270],
      },
    ]);

    const result = solveLayoutFromInventory({
      catalog: [doorwayRun, doubleSidedConnector],
      inventory: [inventory('doorway-run', 1), inventory('double-sided-connector', 1)],
      bounds: { width: 2, height: 1 },
      targetPlacements: 2,
      seed: 'face-selection-seed',
      goal: 'face selection test',
      createdAt: '2026-06-06T12:00:00.000Z',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('expected solver success');
    }

    expect(result.layout.placements).toEqual([
      {
        tile_type_id: 'doorway-run',
        face_id: 'front',
        x: 0,
        y: 0,
        rotation: 0,
        grid_cells: [{ x: 0, y: 0 }],
      },
      {
        tile_type_id: 'double-sided-connector',
        face_id: 'door-face',
        x: 1,
        y: 0,
        rotation: 270,
        grid_cells: [{ x: 1, y: 0 }],
      },
    ]);
    expect(validateSocketCompatibility({ bounds: { width: 2, height: 1 }, placements: result.layout.placements, occupiedCells: [] }, [doorwayRun, doubleSidedConnector])).toEqual({ ok: true });
    expect(result.trace.inventoryConsumed).toEqual({ 'doorway-run': 1, 'double-sided-connector': 1 });
  });

  test('backtracks away from greedy wall placements to return the highest-ranked connected layout', () => {
    const wallCap = singleCellTile('wall-cap', [
      {
        face_id: 'wall-face',
        sockets: { north: 'wall', east: 'wall', south: 'wall', west: 'wall' },
      },
    ]);
    const leftDoorway = singleCellTile('left-doorway', [
      {
        face_id: 'front',
        sockets: { north: 'wall', east: 'doorway', south: 'wall', west: 'wall' },
      },
    ]);
    const rightDoorway = singleCellTile('right-doorway', [
      {
        face_id: 'front',
        sockets: { north: 'wall', east: 'wall', south: 'wall', west: 'doorway' },
      },
    ]);

    const result = solveLayoutFromInventory({
      catalog: [wallCap, leftDoorway, rightDoorway],
      inventory: [inventory('wall-cap', 2), inventory('left-doorway', 1), inventory('right-doorway', 1)],
      bounds: { width: 2, height: 1 },
      targetPlacements: 2,
      seed: 'backtracking-rank-seed',
      goal: 'prefer a connected doorway pair over isolated walls',
      createdAt: '2026-06-07T09:00:00.000Z',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('expected solver success');
    }

    expect(result.layout.placements.map((placement) => placement.tile_type_id)).toEqual(['left-doorway', 'right-doorway']);
    expect(result.trace.rankedResults[0]).toMatchObject({
      rank: 1,
      score: expect.any(Number),
      placementsCount: 2,
      connected: true,
    });
  });

  test('returns deterministic top-N ranked layout alternatives sorted by score', () => {
    const wallCap = singleCellTile('wall-cap', [
      {
        face_id: 'wall-face',
        sockets: { north: 'wall', east: 'wall', south: 'wall', west: 'wall' },
      },
    ]);
    const leftDoorway = singleCellTile('left-doorway', [
      {
        face_id: 'front',
        sockets: { north: 'wall', east: 'doorway', south: 'wall', west: 'wall' },
      },
    ]);
    const rightDoorway = singleCellTile('right-doorway', [
      {
        face_id: 'front',
        sockets: { north: 'wall', east: 'wall', south: 'wall', west: 'doorway' },
      },
    ]);

    const result = solveTopRankedLayouts(
      {
        catalog: [wallCap, leftDoorway, rightDoorway],
        inventory: [inventory('wall-cap', 2), inventory('left-doorway', 1), inventory('right-doorway', 1)],
        bounds: { width: 2, height: 1 },
        targetPlacements: 2,
        seed: 'top-n-rank-seed',
        goal: 'return alternatives',
        createdAt: '2026-06-07T09:00:00.000Z',
      },
      { topN: 2 },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('expected solver success');
    }

    expect(result.layouts).toHaveLength(2);
    expect(result.layouts.map((ranked) => ranked.rank)).toEqual([1, 2]);
    expect(result.layouts[0].score).toBeGreaterThanOrEqual(result.layouts[1].score);
    expect(result.layouts[0].layout.placements.map((placement) => placement.tile_type_id)).toEqual([
      'left-doorway',
      'right-doorway',
    ]);
    expect(result.layouts[0].trace.rankedResults).toEqual(result.trace.rankedResults);

    const repeated = solveTopRankedLayouts(
      {
        catalog: [wallCap, leftDoorway, rightDoorway],
        inventory: [inventory('wall-cap', 2), inventory('left-doorway', 1), inventory('right-doorway', 1)],
        bounds: { width: 2, height: 1 },
        targetPlacements: 2,
        seed: 'top-n-rank-seed',
        goal: 'return alternatives',
        createdAt: '2026-06-07T09:00:00.000Z',
      },
      { topN: 2 },
    );
    expect(repeated).toEqual(result);
  });

  test('backtracking considers the alternate face on a double-sided tile after a dead-end face is rejected', () => {
    const doubleSidedBridge = singleCellTile('double-sided-bridge', [
      {
        face_id: 'blocked-face',
        sockets: { north: 'wall', east: 'wall', south: 'wall', west: 'wall' },
      },
      {
        face_id: 'door-bridge',
        sockets: { north: 'wall', east: 'doorway', south: 'wall', west: 'doorway' },
      },
    ]);

    const result = solveLayoutFromInventory({
      catalog: [doubleSidedBridge, doorwayRun],
      inventory: [inventory('double-sided-bridge', 1), inventory('doorway-run', 1)],
      bounds: { width: 2, height: 1 },
      targetPlacements: 2,
      seed: 'double-sided-backtrack-seed',
      goal: 'double sided bridge',
      createdAt: '2026-06-07T10:00:00.000Z',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('expected solver success');
    }
    expect(result.layout.placements).toHaveLength(2);
    expect(result.layout.placements).toContainEqual(expect.objectContaining({ tile_type_id: 'double-sided-bridge', face_id: 'door-bridge' }));
    expect(validateSocketCompatibility({ bounds: { width: 2, height: 1 }, placements: result.layout.placements, occupiedCells: [] }, [doubleSidedBridge, doorwayRun])).toEqual({ ok: true });
  });

  test('places and backtracks around non-rectangular L-shaped footprints', () => {
    const lRoom = lShapedTile('l-room', { north: 'wall', east: 'wall', south: 'wall', west: 'wall' }, [0]);
    const result = solveLayoutFromInventory({
      catalog: [lRoom, doorwayRun],
      inventory: [inventory('l-room', 1), inventory('doorway-run', 1)],
      bounds: { width: 3, height: 2 },
      targetPlacements: 2,
      seed: 'l-footprint-seed',
      goal: 'fit an L footprint and one small tile',
      createdAt: '2026-06-07T10:01:00.000Z',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('expected solver success');
    }
    expect(result.layout.placements).toHaveLength(2);
    const lCells = result.layout.placements.find((placement) => placement.tile_type_id === 'l-room')?.grid_cells ?? [];
    const minX = Math.min(...lCells.map((cell) => cell.x));
    const minY = Math.min(...lCells.map((cell) => cell.y));
    expect(lCells.map((cell) => ({ x: cell.x - minX, y: cell.y - minY }))).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ]);
  });

  test('large catalogs return ranked layouts within the solver budget', () => {
    const largeCatalog = Array.from({ length: 120 }, (_, index) =>
      singleCellTile(`large-wall-${index.toString().padStart(3, '0')}`, [
        {
          face_id: 'front',
          sockets: { north: 'wall', east: 'wall', south: 'wall', west: 'wall' },
        },
      ]),
    );
    const startedAt = Date.now();
    const result = solveTopRankedLayouts(
      {
        catalog: largeCatalog,
        inventory: largeCatalog.map((tile) => inventory(tile.id, 1)),
        bounds: { width: 3, height: 1 },
        targetPlacements: 2,
        seed: 'large-catalog-seed',
        goal: 'large catalog performance',
        createdAt: '2026-06-07T10:02:00.000Z',
      },
      { topN: 3, timeoutMs: 500, maxExploredStates: 500 },
    );

    expect(Date.now() - startedAt).toBeLessThan(3000);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('expected solver success');
    }
    expect(result.layouts.length).toBeGreaterThan(0);
    expect(result.trace.exploredStates).toBeLessThanOrEqual(500);
  });

  test('blocked socket recovery unwinds an incompatible downstream placement and keeps searching', () => {
    const badMiddle = singleCellTile('bad-middle', [
      {
        face_id: 'front',
        sockets: { north: 'wall', east: 'wall', south: 'wall', west: 'wall' },
      },
    ]);
    const goodMiddle = singleCellTile('good-middle', [
      {
        face_id: 'front',
        sockets: { north: 'wall', east: 'doorway', south: 'wall', west: 'doorway' },
      },
    ]);
    const rightEnd = singleCellTile('right-end', [
      {
        face_id: 'front',
        sockets: { north: 'wall', east: 'wall', south: 'wall', west: 'doorway' },
      },
    ]);

    const result = solveLayoutFromInventory({
      catalog: [doorwayRun, badMiddle, goodMiddle, rightEnd],
      inventory: [inventory('doorway-run', 1), inventory('bad-middle', 1), inventory('good-middle', 1), inventory('right-end', 1)],
      bounds: { width: 3, height: 1 },
      targetPlacements: 3,
      seed: 'blocked-socket-recovery-seed',
      goal: 'recover from blocked socket',
      createdAt: '2026-06-07T10:03:00.000Z',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('expected solver success');
    }
    expect(result.layout.placements.map((placement) => placement.tile_type_id)).toEqual(['doorway-run', 'good-middle', 'right-end']);
    expect(result.trace.rejectedCandidates.some((candidate) => candidate.tile_type_id === 'right-end' && candidate.reason === 'socket-incompatibility')).toBe(true);
  });

  test('max backtrack depth is reported gracefully instead of looping forever', () => {
    const result = solveTopRankedLayouts(
      {
        catalog: [doorwayRun],
        inventory: [inventory('doorway-run', 4)],
        bounds: { width: 4, height: 1 },
        targetPlacements: 4,
        seed: 'depth-limit-seed',
        goal: 'depth limit',
        createdAt: '2026-06-07T10:04:00.000Z',
      },
      { topN: 1, maxBacktrackDepth: 1 },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('expected solver success');
    }
    expect(result.trace.depthLimitHit).toBe(true);
    expect(result.layouts[0].layout.placements.length).toBeLessThan(4);
  });

  test('multiple seeds deterministically produce valid distinct layouts', () => {
    const seedCatalog = Array.from({ length: 20 }, (_, index) =>
      singleCellTile(`seed-wall-${index}`, [
        {
          face_id: 'front',
          sockets: { north: 'wall', east: 'wall', south: 'wall', west: 'wall' },
        },
      ]),
    );
    const seeds = ['alpha-seed', 'bravo-seed', 'charlie-seed', 'delta-seed', 'echo-seed'];
    const layouts = seeds.map((seed) =>
      solveLayoutFromInventory({
        catalog: seedCatalog,
        inventory: seedCatalog.map((tile) => inventory(tile.id, 1)),
        bounds: { width: 1, height: 1 },
        targetPlacements: 1,
        seed,
        goal: 'seed variation',
        createdAt: '2026-06-07T10:05:00.000Z',
      }),
    );

    expect(layouts.every((layout) => layout.ok)).toBe(true);
    const signatures = layouts.map((layout) => {
      if (!layout.ok) {
        throw new Error('expected solver success');
      }
      expect(layout.layout.placements).toHaveLength(1);
      return layout.layout.placements[0].tile_type_id;
    });
    expect(new Set(signatures).size).toBe(5);
    expect(layouts.map((layout) => solveLayoutFromInventory({
      catalog: seedCatalog,
      inventory: seedCatalog.map((tile) => inventory(tile.id, 1)),
      bounds: { width: 1, height: 1 },
      targetPlacements: 1,
      seed: layout.ok ? layout.layout.seed : 'unreachable',
      goal: 'seed variation',
      createdAt: '2026-06-07T10:05:00.000Z',
    }))).toEqual(layouts);
  });

  test('top-N results are deduplicated by exact placement signature', () => {
    const result = solveTopRankedLayouts(
      {
        catalog: [doorwayRun],
        inventory: [inventory('doorway-run', 3)],
        bounds: { width: 3, height: 1 },
        targetPlacements: 2,
        seed: 'dedupe-seed',
        goal: 'dedupe top n',
        createdAt: '2026-06-07T10:06:00.000Z',
      },
      { topN: 10 },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('expected solver success');
    }
    const signatures = result.layouts.map((ranked) => JSON.stringify(ranked.layout.placements));
    expect(new Set(signatures).size).toBe(signatures.length);
  });

  test('empty inventory returns ok false with an explicit reason', () => {
    const result = solveLayoutFromInventory({
      catalog: [doorwayRun],
      inventory: [],
      bounds: { width: 1, height: 1 },
      targetPlacements: 1,
      seed: 'empty-inventory-seed',
      goal: 'empty inventory',
      createdAt: '2026-06-07T10:07:00.000Z',
    });

    expect(result).toMatchObject({ ok: false, reason: 'no-available-inventory' });
  });

  test('single-tile catalog and inventory produces exactly one placement', () => {
    const result = solveLayoutFromInventory({
      catalog: [doorwayRun],
      inventory: [inventory('doorway-run', 1)],
      bounds: { width: 3, height: 1 },
      targetPlacements: 3,
      seed: 'single-tile-seed',
      goal: 'single tile catalog',
      createdAt: '2026-06-07T10:08:00.000Z',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('expected solver success');
    }
    expect(result.layout.placements).toHaveLength(1);
    expect(result.trace.inventoryConsumed).toEqual({ 'doorway-run': 1 });
    expect(result.trace.missingRequestedPlacements).toBe(2);
  });
});
