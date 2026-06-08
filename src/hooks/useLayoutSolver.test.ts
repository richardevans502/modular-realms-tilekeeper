import type { Layout, TileType, InventoryItem } from '../shared/types';
import {
  LayoutSolveCancelledError,
  buildLayoutSolverCacheKey,
  clearLayoutSolverCache,
  getCachedSolvedLayout,
  runLayoutSolver,
} from './useLayoutSolver';

const catalog: TileType[] = [
  {
    id: 'floor-1',
    name: 'Floor',
    product_set: 'seed',
    dimensions: { unit: 'grid-cell', width: 1, height: 1, grid_cells: [{ x: 0, y: 0 }] },
    faces: [
      {
        face_id: 'front',
        face_name: 'Front',
        role_tags: ['floor'],
        edge_sockets: [],
        rotation_rules: { allowed_rotations: [0, 90, 180, 270], flip_allowed: true },
        theme_tags: ['dungeon'],
      },
    ],
    catalog_status: 'official',
    category: 'floor',
    tags: [],
    catalog_version: 'test',
  },
];

const inventory: InventoryItem[] = [{ tile_type_id: 'floor-1', owned_quantity: 3, reserved: 0, condition: 'good' }];

const layout: Layout = {
  id: 'layout-one',
  placements: [],
  seed: 'seed-one',
  goal: 'make a tiny room',
  solver_version: 'test',
  catalog_version: 'test',
  created_at: '2026-06-07T20:00:00.000Z',
};

describe('useLayoutSolver utilities', () => {
  beforeEach(() => {
    clearLayoutSolverCache();
  });

  test('builds a stable cache key from seed, goal, and generation constraints', () => {
    const first = buildLayoutSolverCacheKey({
      bounds: { width: 4, height: 5 },
      targetPlacements: 7,
      seed: 'abc',
      goal: 'build a dungeon',
      themeTags: ['stone', 'dungeon'],
      requiredCategories: ['doorway', 'floor'],
    });
    const second = buildLayoutSolverCacheKey({
      bounds: { width: 4, height: 5 },
      targetPlacements: 7,
      seed: 'abc',
      goal: 'build a dungeon',
      themeTags: ['dungeon', 'stone'],
      requiredCategories: ['floor', 'doorway'],
    });

    expect(first).toBe(second);
    expect(first).toMatch(/^abc:[a-z0-9]+$/);
  });

  test('runs the solver once and reuses cached layouts for matching goals', async () => {
    let solverCalls = 0;
    const result = await runLayoutSolver({
      catalog,
      inventory,
      goal: {
        bounds: { width: 4, height: 4 },
        targetPlacements: 2,
        seed: 'seed-one',
        goal: 'make a tiny room',
        themeTags: [],
        requiredCategories: ['floor'],
      },
      createdAt: '2026-06-07T20:00:00.000Z',
      solver: () => {
        solverCalls += 1;
        return { ok: true, layout, layouts: [{ rank: 1, score: 5, layout, trace: emptyTrace() }], trace: emptyTrace() };
      },
    });
    const cached = await runLayoutSolver({
      catalog,
      inventory,
      goal: {
        bounds: { width: 4, height: 4 },
        targetPlacements: 2,
        seed: 'seed-one',
        goal: 'make a tiny room',
        themeTags: [],
        requiredCategories: ['floor'],
      },
      createdAt: '2026-06-07T20:01:00.000Z',
      solver: () => {
        solverCalls += 1;
        throw new Error('cache miss');
      },
    });

    expect(result.layouts.map((entry) => entry.layout.id)).toEqual(['layout-one']);
    expect(cached.fromCache).toBe(true);
    expect(cached.layouts[0]?.layout).toEqual(layout);
    expect(getCachedSolvedLayout('layout-one')).toEqual(layout);
    expect(solverCalls).toBe(1);
  });

  test('rejects cancelled solves without caching the solver result', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      runLayoutSolver({
        catalog,
        inventory,
        goal: {
          bounds: { width: 4, height: 4 },
          targetPlacements: 2,
          seed: 'seed-one',
          goal: 'make a tiny room',
          themeTags: [],
          requiredCategories: ['floor'],
        },
        createdAt: '2026-06-07T20:00:00.000Z',
        signal: controller.signal,
        solver: () => ({ ok: true, layout, layouts: [{ rank: 1, score: 5, layout, trace: emptyTrace() }], trace: emptyTrace() }),
      }),
    ).rejects.toBeInstanceOf(LayoutSolveCancelledError);

    expect(getCachedSolvedLayout('layout-one')).toBeNull();
  });
});

function emptyTrace() {
  return {
    inventoryAvailable: {},
    inventoryConsumed: {},
    requestedPlacements: 0,
    missingRequestedPlacements: 0,
    rejectedCandidates: [],
    rankedResults: [],
    exploredStates: 0,
    depthLimitHit: false,
    timeoutHit: false,
  };
}
