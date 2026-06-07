import type { InventoryItem } from '../shared/types';
import type { LayoutSolverTrace, SolveLayoutResult } from './layoutSolver';
import type { MissingTileSuggestion } from './missingTileSuggestions';
import { buildSolverInsightViewModel } from './solverInsightViewModel';

const trace: LayoutSolverTrace = {
  inventoryAvailable: { 'floor-stone': 2, 'doorway-arch': 1 },
  inventoryConsumed: { 'floor-stone': 2 },
  requestedPlacements: 5,
  missingRequestedPlacements: 3,
  rejectedCandidates: [
    { tile_type_id: 'wall-cap', face_id: 'front', x: 1, y: 0, rotation: 90, reason: 'socket-incompatibility' },
    { tile_type_id: 'wall-cap', face_id: 'front', x: 2, y: 0, rotation: 0, reason: 'collision' },
    { tile_type_id: 'room-large', face_id: 'front', x: 3, y: 0, rotation: 0, reason: 'out-of-bounds' },
  ],
  rankedResults: [{ rank: 1, score: 20, placementsCount: 2, connected: true, layoutId: 'layout-test' }],
  exploredStates: 8,
  depthLimitHit: false,
  timeoutHit: false,
};

const result: SolveLayoutResult = {
  ok: true,
  layout: {
    id: 'layout-test',
    placements: [
      { tile_type_id: 'floor-stone', face_id: 'front', x: 0, y: 0, rotation: 0, grid_cells: [{ x: 0, y: 0 }] },
      { tile_type_id: 'floor-stone', face_id: 'front', x: 1, y: 0, rotation: 0, grid_cells: [{ x: 1, y: 0 }] },
    ],
    seed: 'demo-seed',
    goal: 'Build a compact dungeon entrance.',
    solver_version: 'solver-test',
    catalog_version: 'catalog-test',
    created_at: '2026-06-07T10:00:00.000Z',
  },
  trace,
};

const suggestions: MissingTileSuggestion[] = [
  {
    tile_type_id: 'floor-stone',
    name: 'Stone Floor',
    category: 'floor',
    missing_quantity: 3,
    reason: 'required-category-shortage',
    matched_theme_tags: ['dungeon', 'stone'],
    score: 1401,
  },
  {
    tile_type_id: null,
    name: 'Missing wall tile',
    category: 'wall',
    missing_quantity: 1,
    reason: 'no-catalog-candidate',
    matched_theme_tags: [],
    score: 0,
  },
];

const inventory: InventoryItem[] = [
  { tile_type_id: 'floor-stone', owned_quantity: 2, reserved: 0, condition: 'good' },
  { tile_type_id: 'doorway-arch', owned_quantity: 1, reserved: 0, condition: 'worn' },
];

describe('solver insight view model', () => {
  test('summarises solver trace, rejected candidates, and missing tile suggestions for UI display', () => {
    const model = buildSolverInsightViewModel({ result, suggestions, inventory });

    expect(model.statusBanner).toEqual({
      title: 'Layout generated with 3 tile gaps',
      tone: 'warning',
      message: 'Placed 2 of 5 requested tiles. Review the missing-tile suggestions before saving this layout.',
    });
    expect(model.traceSummary).toEqual([
      { label: 'Requested', value: '5', detail: 'target placements' },
      { label: 'Placed', value: '2', detail: 'tiles on grid' },
      { label: 'Missing', value: '3', detail: 'unfilled requested slots' },
      { label: 'Rejected', value: '3', detail: 'candidate attempts' },
      { label: 'Consumed', value: '2 / 3', detail: 'available inventory used' },
    ]);
    expect(model.rejectionBreakdown).toEqual([
      { reason: 'socket incompatibility', count: 1 },
      { reason: 'collision', count: 1 },
      { reason: 'out of bounds', count: 1 },
    ]);
    expect(model.missingTileRows).toEqual([
      {
        id: 'floor-stone',
        title: 'Stone Floor',
        subtitle: 'Need 3 floor tiles • best theme matches: dungeon, stone',
        badge: 'category shortage',
      },
      {
        id: 'missing-wall-1',
        title: 'Missing wall tile',
        subtitle: 'Need 1 wall tile • no catalog candidate exists yet',
        badge: 'catalog gap',
      },
    ]);
  });

  test('uses success copy and an empty suggestions state when no gaps remain', () => {
    const complete = buildSolverInsightViewModel({
      result: { ...result, layout: { ...result.layout, placements: result.layout.placements.slice(0, 2) }, trace: { ...trace, requestedPlacements: 2, missingRequestedPlacements: 0, rejectedCandidates: [] } },
      suggestions: [],
      inventory,
    });

    expect(complete.statusBanner).toEqual({
      title: 'Layout generated successfully',
      tone: 'success',
      message: 'Placed all 2 requested tiles with the current inventory.',
    });
    expect(complete.missingTileRows).toEqual([]);
    expect(complete.emptySuggestionsMessage).toBe('No missing tile suggestions — current inventory satisfies the layout request.');
  });
});
