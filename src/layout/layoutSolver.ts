import type { InventoryItem, Layout, LayoutPlacement, Rotation, TileFace, TileType } from '../shared/types';
import { buildPlacement, canPlaceOnGrid, createPlacementGrid, placeOnGrid, validateSocketCompatibility } from './placementGrid';

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

export interface LayoutSolverTrace {
  inventoryAvailable: Record<string, number>;
  inventoryConsumed: Record<string, number>;
  requestedPlacements: number;
  missingRequestedPlacements: number;
  rejectedCandidates: RejectedCandidate[];
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
  | { ok: true; layout: Layout; trace: LayoutSolverTrace }
  | { ok: false; reason: 'no-available-inventory' | 'invalid-bounds'; trace: LayoutSolverTrace };

const SOLVER_VERSION = 'layout-solver-v0.2';
const ROTATION_ORDER: Rotation[] = [0, 90, 180, 270];

export function solveLayoutFromInventory(input: SolveLayoutInput): SolveLayoutResult {
  const inventoryAvailable = buildAvailableInventory(input.inventory);
  const trace: LayoutSolverTrace = {
    inventoryAvailable,
    inventoryConsumed: {},
    requestedPlacements: input.targetPlacements,
    missingRequestedPlacements: input.targetPlacements,
    rejectedCandidates: [],
  };

  if (input.bounds.width <= 0 || input.bounds.height <= 0) {
    return { ok: false, reason: 'invalid-bounds', trace };
  }

  if (Object.values(inventoryAvailable).every((available) => available <= 0)) {
    return { ok: false, reason: 'no-available-inventory', trace };
  }

  let grid = createPlacementGrid(input.bounds);
  const catalogById = new Map(input.catalog.map((tile) => [tile.id, tile]));

  for (const anchor of enumerateAnchors(input.bounds)) {
    if (grid.placements.length >= input.targetPlacements) {
      break;
    }

    const placement = choosePlacementForAnchor({
      anchor,
      catalog: input.catalog,
      catalogById,
      grid,
      inventoryAvailable,
      inventoryConsumed: trace.inventoryConsumed,
      rejectedCandidates: trace.rejectedCandidates,
    });

    if (!placement) {
      continue;
    }

    grid = placeOnGrid(grid, placement);
    trace.inventoryConsumed[placement.tile_type_id] = (trace.inventoryConsumed[placement.tile_type_id] ?? 0) + 1;
  }

  trace.missingRequestedPlacements = Math.max(0, input.targetPlacements - grid.placements.length);

  return {
    ok: true,
    layout: {
      id: stableLayoutId(input.seed, input.goal, input.createdAt, grid.placements),
      placements: grid.placements,
      seed: input.seed,
      goal: input.goal,
      solver_version: SOLVER_VERSION,
      catalog_version: resolveCatalogVersion(input.catalog),
      created_at: input.createdAt,
    },
    trace,
  };
}

interface ChoosePlacementInput {
  anchor: { x: number; y: number };
  catalog: TileType[];
  catalogById: Map<string, TileType>;
  grid: ReturnType<typeof createPlacementGrid>;
  inventoryAvailable: Record<string, number>;
  inventoryConsumed: Record<string, number>;
  rejectedCandidates: RejectedCandidate[];
}

function choosePlacementForAnchor(input: ChoosePlacementInput): LayoutPlacement | null {
  for (const tile of input.catalog) {
    if (remainingInventory(tile.id, input.inventoryAvailable, input.inventoryConsumed) <= 0) {
      continue;
    }

    for (const face of tile.faces) {
      for (const rotation of orderedAllowedRotations(face)) {
        const placement = buildPlacement(tile, face.face_id, input.anchor, rotation);
        const gridCheck = canPlaceOnGrid(input.grid, placement);
        if (!gridCheck.ok) {
          input.rejectedCandidates.push({
            tile_type_id: tile.id,
            face_id: face.face_id,
            x: input.anchor.x,
            y: input.anchor.y,
            rotation,
            reason: gridCheck.reason,
          });
          continue;
        }

        const socketCheck = validateSocketCompatibility(
          { ...input.grid, placements: [...input.grid.placements, placement], occupiedCells: [] },
          [...input.catalogById.values()],
        );
        if (!socketCheck.ok) {
          input.rejectedCandidates.push({
            tile_type_id: tile.id,
            face_id: face.face_id,
            x: input.anchor.x,
            y: input.anchor.y,
            rotation,
            reason: socketCheck.reason,
          });
          continue;
        }

        return placement;
      }
    }
  }

  return null;
}

function buildAvailableInventory(inventory: InventoryItem[]): Record<string, number> {
  return inventory.reduce<Record<string, number>>((availableByTile, item) => {
    availableByTile[item.tile_type_id] =
      (availableByTile[item.tile_type_id] ?? 0) + Math.max(0, item.owned_quantity - item.reserved);
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
    for (let x = 0; x < bounds.width; x += 1) {
      anchors.push({ x, y });
    }
  }
  return anchors;
}

function resolveCatalogVersion(catalog: TileType[]): string {
  const versions = [...new Set(catalog.map((tile) => tile.catalog_version))].sort();
  return versions.join('+') || 'unknown-catalog';
}

function stableLayoutId(seed: string, goal: string, createdAt: string, placements: LayoutPlacement[]): string {
  const source = JSON.stringify({ seed, goal, createdAt, placements });
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `layout-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}
