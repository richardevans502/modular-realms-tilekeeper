import type { GridCell, InventoryItem, Layout, LayoutPlacement, Rotation, SocketType, TileFace, TileType } from '../shared/types';
import {
  buildPlacement,
  canPlaceOnGrid,
  createPlacementGrid,
  createSocketCompatibilityCache,
  getCachedPlacementSocket,
  isLayoutConnected,
  placeOnGrid,
  validateSocketCompatibility,
} from './placementGrid';

export interface LayoutSolverBounds {
  width: number;
  height: number;
}

export interface SolveLayoutInput {
  catalog: TileType[];
  inventory: InventoryItem[];
  bounds: LayoutSolverBounds;
  targetPlacements: number;
  seed: string;
  goal: string;
  createdAt: string;
}

export interface SolveTopRankedLayoutsOptions {
  topN?: number;
  maxSearchNodes?: number;
  maxExploredStates?: number;
  timeoutMs?: number;
  maxBacktrackDepth?: number;
  signal?: AbortSignal;
}

export interface RankedLayoutTraceSummary {
  rank: number;
  layoutId: string;
  score: number;
  placementsCount: number;
  connected: boolean;
  inventoryConsumed?: Record<string, number>;
  missingRequestedPlacements?: number;
}

export interface LayoutSolverTrace {
  inventoryAvailable: Record<string, number>;
  inventoryConsumed: Record<string, number>;
  requestedPlacements: number;
  missingRequestedPlacements: number;
  rejectedCandidates: RejectedCandidate[];
  rankedResults: RankedLayoutTraceSummary[];
  searchNodes?: number;
  prunedBranches?: number;
  exploredStates: number;
  depthLimitHit: boolean;
  timeoutHit: boolean;
  cancelled: boolean;
  elapsedMs?: number;
}

export interface RankedLayoutResult {
  rank: number;
  score: number;
  layout: Layout;
  trace: LayoutSolverTrace;
}

export interface RejectedCandidate {
  tile_type_id: string;
  face_id: string;
  x: number;
  y: number;
  rotation: Rotation;
  reason: 'collision' | 'out-of-bounds' | 'socket-incompatibility';
}

export type SolveLayoutResult =
  | { ok: true; layout: Layout; layouts?: RankedLayoutResult[]; trace: LayoutSolverTrace }
  | { ok: false; reason: 'no-available-inventory' | 'invalid-bounds'; trace: LayoutSolverTrace };

export type SolveTopRankedLayoutsResult =
  | { ok: true; layouts: RankedLayoutResult[]; trace: LayoutSolverTrace }
  | { ok: false; reason: 'no-available-inventory' | 'invalid-bounds'; trace: LayoutSolverTrace };

export const SOLVER_VERSION = 'layout-solver-v0.3-backtracking';
const ROTATION_ORDER: Rotation[] = [0, 90, 180, 270];
const DEFAULT_TOP_N = 3;
const DEFAULT_MAX_SEARCH_NODES = 5000;

type PlacementGrid = ReturnType<typeof createPlacementGrid>;

export function solveLayoutFromInventory(input: SolveLayoutInput): SolveLayoutResult {
  const ranked = solveTopRankedLayouts(input, { topN: 1 });
  if (!ranked.ok) {
    return ranked;
  }
  const best = ranked.layouts[0] ?? buildEmptyRankedLayout(input, ranked.trace);
  return { ok: true, layout: best.layout, layouts: ranked.layouts, trace: ranked.trace };
}

export function solveTopRankedLayouts(
  input: SolveLayoutInput,
  options: SolveTopRankedLayoutsOptions = {},
): SolveTopRankedLayoutsResult {
  const inventoryAvailable = buildAvailableInventory(input.inventory);
  const trace: LayoutSolverTrace = {
    inventoryAvailable,
    inventoryConsumed: {},
    requestedPlacements: input.targetPlacements,
    missingRequestedPlacements: input.targetPlacements,
    rejectedCandidates: [],
    rankedResults: [],
    searchNodes: 0,
    prunedBranches: 0,
    exploredStates: 0,
    depthLimitHit: false,
    timeoutHit: false,
    cancelled: false,
  };

  if (input.bounds.width <= 0 || input.bounds.height <= 0) {
    return { ok: false, reason: 'invalid-bounds', trace };
  }
  if (Object.values(inventoryAvailable).every((available) => available <= 0)) {
    return { ok: false, reason: 'no-available-inventory', trace };
  }

  const topN = Math.max(1, Math.floor(options.topN ?? DEFAULT_TOP_N));
  const maxSearchNodes = Math.max(1, Math.floor(options.maxExploredStates ?? options.maxSearchNodes ?? DEFAULT_MAX_SEARCH_NODES));
  const timeoutMs = options.timeoutMs === undefined ? undefined : Math.max(1, Math.floor(options.timeoutMs));
  const maxBacktrackDepth = options.maxBacktrackDepth === undefined ? undefined : Math.max(0, Math.floor(options.maxBacktrackDepth));
  const startedAt = Date.now();
  const anchors = enumerateAnchors(input.bounds);
  const catalogById = new Map(input.catalog.map((tile) => [tile.id, tile]));
  const socketCompatibilityCache = createSocketCompatibilityCache();
  const candidatesByAnchor = new Map<string, LayoutPlacement[]>();
  const foundLayouts = new Map<string, SearchLayoutCandidate>();
  let candidateOrder = 0;

  function buildLayout(placements: LayoutPlacement[]): Layout {
    return {
      id: stableLayoutId(input.seed, input.goal, input.createdAt, placements),
      placements,
      seed: input.seed,
      goal: input.goal,
      solver_version: SOLVER_VERSION,
      catalog_version: resolveCatalogVersion(input.catalog),
      created_at: input.createdAt,
    };
  }

  function recordCandidate(grid: PlacementGrid, inventoryConsumed: Record<string, number>): void {
    if (grid.placements.length === 0) return;
    const key = JSON.stringify(grid.placements);
    if (foundLayouts.has(key)) return;

    const connected = isLayoutConnected(grid, input.catalog, socketCompatibilityCache);
    const connectedSocketPairs = countCompatibleNonWallAdjacencies(grid, input.catalog, socketCompatibilityCache);
    foundLayouts.set(key, {
      layout: buildLayout(grid.placements),
      score: scoreLayout(grid, input.targetPlacements, connected, connectedSocketPairs),
      connected,
      connectedSocketPairs,
      inventoryConsumed: { ...inventoryConsumed },
      missingRequestedPlacements: Math.max(0, input.targetPlacements - grid.placements.length),
      order: candidateOrder,
      seedTieBreaker: stableTieBreaker(input.seed, grid.placements),
    });
    candidateOrder += 1;
  }

  function getCandidates(anchor: { x: number; y: number }): LayoutPlacement[] {
    const key = `${anchor.x},${anchor.y}`;
    const existing = candidatesByAnchor.get(key);
    if (existing) return existing;

    const candidates = input.catalog
      .flatMap((tile) =>
        tile.faces.flatMap((face) =>
          orderedAllowedRotations(face).map((rotation) => buildPlacement(tile, face.face_id, anchor, rotation)),
        ),
      )
      .sort((left, right) => comparePlacementCandidates(left, right, input.catalog));
    candidatesByAnchor.set(key, candidates);
    return candidates;
  }

  function search(anchorIndex: number, grid: PlacementGrid, inventoryConsumed: Record<string, number>): void {
    if (options.signal?.aborted) {
      trace.cancelled = true;
      trace.prunedBranches = (trace.prunedBranches ?? 0) + 1;
      return;
    }
    if ((trace.searchNodes ?? 0) >= maxSearchNodes) {
      trace.prunedBranches = (trace.prunedBranches ?? 0) + 1;
      return;
    }
    if (timeoutMs !== undefined && Date.now() - startedAt > timeoutMs) {
      trace.timeoutHit = true;
      trace.prunedBranches = (trace.prunedBranches ?? 0) + 1;
      return;
    }

    trace.searchNodes = (trace.searchNodes ?? 0) + 1;
    trace.exploredStates = trace.searchNodes;
    recordCandidate(grid, inventoryConsumed);

    if (maxBacktrackDepth !== undefined && grid.placements.length >= maxBacktrackDepth) {
      trace.depthLimitHit = grid.placements.length < input.targetPlacements;
      trace.prunedBranches = (trace.prunedBranches ?? 0) + 1;
      return;
    }
    if (grid.placements.length >= input.targetPlacements || anchorIndex >= anchors.length) return;

    const anchor = anchors[anchorIndex];
    if (grid.occupiedCells.some((cell) => cell.key === `${anchor.x},${anchor.y}`)) {
      search(anchorIndex + 1, grid, inventoryConsumed);
      return;
    }

    for (const placement of getCandidates(anchor)) {
      if (remainingInventory(placement.tile_type_id, inventoryAvailable, inventoryConsumed) <= 0) continue;

      const gridCheck = canPlaceOnGrid(grid, placement);
      if (!gridCheck.ok) {
        trace.rejectedCandidates.push({ tile_type_id: placement.tile_type_id, face_id: placement.face_id, x: anchor.x, y: anchor.y, rotation: placement.rotation, reason: gridCheck.reason });
        continue;
      }

      const nextGrid = placeOnGrid(grid, placement);
      const socketCheck = validateSocketCompatibility(nextGrid, [...catalogById.values()], socketCompatibilityCache);
      if (!socketCheck.ok) {
        trace.rejectedCandidates.push({ tile_type_id: placement.tile_type_id, face_id: placement.face_id, x: anchor.x, y: anchor.y, rotation: placement.rotation, reason: socketCheck.reason });
        continue;
      }

      search(anchorIndex + 1, nextGrid, {
        ...inventoryConsumed,
        [placement.tile_type_id]: (inventoryConsumed[placement.tile_type_id] ?? 0) + 1,
      });
    }

    search(anchorIndex + 1, grid, inventoryConsumed);
  }

  search(0, createPlacementGrid(input.bounds), {});

  const rankedCandidates = [...foundLayouts.values()]
    .sort(compareSearchCandidates)
    .slice(0, topN)
    .map((candidate, index) => ({ ...candidate, rank: index + 1 }));

  trace.rankedResults = rankedCandidates.map<RankedLayoutTraceSummary>((candidate) => ({
    rank: candidate.rank,
    layoutId: candidate.layout.id,
    score: candidate.score,
    placementsCount: candidate.layout.placements.length,
    connected: candidate.connected,
    inventoryConsumed: candidate.inventoryConsumed,
    missingRequestedPlacements: candidate.missingRequestedPlacements,
  }));
  trace.inventoryConsumed = rankedCandidates[0]?.inventoryConsumed ?? {};
  trace.missingRequestedPlacements = rankedCandidates[0]?.missingRequestedPlacements ?? input.targetPlacements;
  trace.exploredStates = Math.min(trace.exploredStates, maxSearchNodes);

  return {
    ok: true,
    layouts: rankedCandidates.map<RankedLayoutResult>((candidate) => ({ rank: candidate.rank, score: candidate.score, layout: candidate.layout, trace })),
    trace,
  };
}

interface SearchLayoutCandidate {
  rank?: number;
  layout: Layout;
  score: number;
  connected: boolean;
  connectedSocketPairs: number;
  inventoryConsumed: Record<string, number>;
  missingRequestedPlacements: number;
  order: number;
  seedTieBreaker: number;
}

function buildEmptyRankedLayout(input: SolveLayoutInput, trace: LayoutSolverTrace): RankedLayoutResult {
  return {
    rank: 1,
    score: 0,
    layout: {
      id: stableLayoutId(input.seed, input.goal, input.createdAt, []),
      placements: [],
      seed: input.seed,
      goal: input.goal,
      solver_version: SOLVER_VERSION,
      catalog_version: resolveCatalogVersion(input.catalog),
      created_at: input.createdAt,
    },
    trace,
  };
}

function scoreLayout(grid: PlacementGrid, targetPlacements: number, connected: boolean, connectedSocketPairs: number): number {
  const placementScore = grid.placements.length * 10_000;
  const completionScore = grid.placements.length >= targetPlacements ? 5_000 : 0;
  const connectedSocketScore = connectedSocketPairs * 1_000;
  const connectedScore = connected ? 250 : 0;
  const compactnessScore = scoreCompactness(grid.placements);
  const originScore = scoreOriginBias(grid.placements);
  return placementScore + completionScore + connectedSocketScore + connectedScore + compactnessScore + originScore;
}

function scoreCompactness(placements: LayoutPlacement[]): number {
  if (placements.length <= 1) return 0;
  const xs = placements.flatMap((placement) => placement.grid_cells.map((cell) => cell.x));
  const ys = placements.flatMap((placement) => placement.grid_cells.map((cell) => cell.y));
  const width = Math.max(...xs) - Math.min(...xs) + 1;
  const height = Math.max(...ys) - Math.min(...ys) + 1;
  return Math.max(0, 100 - width * height);
}

function scoreOriginBias(placements: LayoutPlacement[]): number {
  return -placements.reduce(
    (distance, placement) =>
      distance + placement.grid_cells.reduce((sum, cell) => sum + Math.abs(cell.x) + Math.abs(cell.y), 0),
    0,
  );
}

function compareSearchCandidates(left: SearchLayoutCandidate, right: SearchLayoutCandidate): number {
  const scoreOrder = right.score - left.score || right.connectedSocketPairs - left.connectedSocketPairs;
  if (scoreOrder !== 0) return scoreOrder;
  return (
    left.seedTieBreaker - right.seedTieBreaker ||
    left.order - right.order ||
    JSON.stringify(left.layout.placements).localeCompare(JSON.stringify(right.layout.placements))
  );
}

function comparePlacementCandidates(left: LayoutPlacement, right: LayoutPlacement, catalog: TileType[]): number {
  return (
    placementRank(left, catalog) - placementRank(right, catalog) ||
    catalog.findIndex((tile) => tile.id === left.tile_type_id) - catalog.findIndex((tile) => tile.id === right.tile_type_id) ||
    faceIndex(left, catalog) - faceIndex(right, catalog) ||
    ROTATION_ORDER.indexOf(left.rotation) - ROTATION_ORDER.indexOf(right.rotation)
  );
}

function faceIndex(placement: LayoutPlacement, catalog: TileType[]): number {
  return catalog.find((tile) => tile.id === placement.tile_type_id)?.faces.findIndex((face) => face.face_id === placement.face_id) ?? 0;
}

function placementRank(placement: LayoutPlacement, catalog: TileType[]): number {
  const tile = catalog.find((candidate) => candidate.id === placement.tile_type_id);
  const face = tile?.faces.find((candidate) => candidate.face_id === placement.face_id);
  const footprintRank = -placement.grid_cells.length * 100;
  const socketRank = -(face?.edge_sockets.filter((socket) => socket.socket_type !== 'wall').length ?? 0) * 10;
  return footprintRank + socketRank;
}

function stableTieBreaker(seed: string, placements: LayoutPlacement[]): number {
  const normalized = placements.map((placement) => ({ ...placement, rotation: 0 as Rotation }));
  return hashString(`${seed}:${JSON.stringify(normalized)}`);
}

function countCompatibleNonWallAdjacencies(grid: PlacementGrid, catalog: TileType[], socketCompatibilityCache: ReturnType<typeof createSocketCompatibilityCache>): number {
  let count = 0;
  for (let leftIndex = 0; leftIndex < grid.placements.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < grid.placements.length; rightIndex += 1) {
      if (placementsShareCompatibleNonWallEdge(grid.placements[leftIndex], grid.placements[rightIndex], catalog, socketCompatibilityCache)) count += 1;
    }
  }
  return count;
}

function placementsShareCompatibleNonWallEdge(left: LayoutPlacement, right: LayoutPlacement, catalog: TileType[], socketCompatibilityCache: ReturnType<typeof createSocketCompatibilityCache>): boolean {
  for (const leftCell of left.grid_cells) {
    for (const rightCell of right.grid_cells) {
      const adjacency = getAdjacentFaces(leftCell, rightCell);
      if (!adjacency) continue;
      const leftSocket = getCachedPlacementSocket(left, catalog, adjacency.leftFace, socketCompatibilityCache);
      const rightSocket = getCachedPlacementSocket(right, catalog, adjacency.rightFace, socketCompatibilityCache);
      if (leftSocket === rightSocket && leftSocket !== 'wall') return true;
    }
  }
  return false;
}

type CardinalEdgeFace = 'north' | 'east' | 'south' | 'west';

function getAdjacentFaces(
  left: { x: number; y: number },
  right: { x: number; y: number },
): { leftFace: CardinalEdgeFace; rightFace: CardinalEdgeFace } | null {
  if (right.x === left.x + 1 && right.y === left.y) return { leftFace: 'east', rightFace: 'west' };
  if (right.x === left.x - 1 && right.y === left.y) return { leftFace: 'west', rightFace: 'east' };
  if (right.y === left.y + 1 && right.x === left.x) return { leftFace: 'south', rightFace: 'north' };
  if (right.y === left.y - 1 && right.x === left.x) return { leftFace: 'north', rightFace: 'south' };
  return null;
}


function buildAvailableInventory(inventory: InventoryItem[]): Record<string, number> {
  return inventory.reduce<Record<string, number>>((availableByTile, item) => {
    availableByTile[item.tile_type_id] = (availableByTile[item.tile_type_id] ?? 0) + item.owned_quantity;
    return availableByTile;
  }, {});
}

function remainingInventory(
  tileTypeId: string,
  inventoryAvailable: Record<string, number>,
  inventoryConsumed: Record<string, number>,
): number {
  return (inventoryAvailable[tileTypeId] ?? 0) - (inventoryConsumed[tileTypeId] ?? 0);
}

function orderedAllowedRotations(face: TileFace): Rotation[] {
  const allowed = new Set(face.rotation_rules.allowed_rotations);
  return ROTATION_ORDER.filter((rotation) => allowed.has(rotation));
}

function enumerateAnchors(bounds: LayoutSolverBounds): Array<{ x: number; y: number }> {
  const anchors: Array<{ x: number; y: number }> = [];
  for (let y = 0; y < bounds.height; y += 1) {
    for (let x = 0; x < bounds.width; x += 1) anchors.push({ x, y });
  }
  return anchors;
}

function resolveCatalogVersion(catalog: TileType[]): string {
  const versions = [...new Set(catalog.map((tile) => tile.catalog_version))].sort();
  return versions.join('+') || 'unknown-catalog';
}

function stableLayoutId(seed: string, goal: string, createdAt: string, placements: LayoutPlacement[]): string {
  return `layout-${hashString(JSON.stringify({ seed, goal, createdAt, placements })).toString(16).padStart(8, '0')}`;
}

function hashString(source: string): number {
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
