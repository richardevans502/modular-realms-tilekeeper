import type { EdgeFace, GridCell, LayoutPlacement, Rotation, SocketType, TileDimensions, TileType } from '../shared/types';

export interface GridBounds {
  width: number;
  height: number;
}

export interface OccupiedCellIndex {
  key: string;
  placementIndex: number;
}

export interface PlacementGrid {
  bounds: GridBounds;
  placements: LayoutPlacement[];
  occupiedCells: OccupiedCellIndex[];
}

export type PlacementCheckResult =
  | { ok: true }
  | { ok: false; reason: 'collision' | 'out-of-bounds'; cells: GridCell[] };

export type CardinalEdgeFace = 'north' | 'east' | 'south' | 'west';

export interface SocketCompatibilityIssue {
  fromPlacementIndex: number;
  toPlacementIndex: number;
  fromCell: GridCell;
  toCell: GridCell;
  fromFace: CardinalEdgeFace;
  toFace: CardinalEdgeFace;
  fromSocket: SocketType;
  toSocket: SocketType;
}

export type SocketCompatibilityResult =
  | { ok: true }
  | { ok: false; reason: 'socket-incompatibility'; issues: SocketCompatibilityIssue[] };

export function cellKey(cell: GridCell): string {
  return `${cell.x},${cell.y}`;
}

export function getOccupiedCells(dimensions: TileDimensions, anchor: GridCell, rotation: Rotation): GridCell[] {
  return dimensions.grid_cells.map((cell) => {
    const rotated = rotateLocalCell(cell, dimensions, rotation);

    return {
      x: anchor.x + rotated.x,
      y: anchor.y + rotated.y,
    };
  });
}

export function buildPlacement(tile: TileType, faceId: string, anchor: GridCell, rotation: Rotation): LayoutPlacement {
  const face = tile.faces.find((candidate) => candidate.face_id === faceId);
  if (!face) {
    throw new Error(`Face '${faceId}' not found on tile '${tile.id}'`);
  }

  if (!face.rotation_rules.allowed_rotations.includes(rotation)) {
    throw new Error(`Rotation ${rotation} is not allowed for face '${faceId}' on tile '${tile.id}'`);
  }

  return {
    tile_type_id: tile.id,
    face_id: faceId,
    x: anchor.x,
    y: anchor.y,
    rotation,
    grid_cells: getOccupiedCells(tile.dimensions, anchor, rotation),
  };
}

export function createPlacementGrid(bounds: GridBounds, placements: LayoutPlacement[] = []): PlacementGrid {
  return {
    bounds,
    placements: [...placements],
    occupiedCells: indexOccupiedCells(placements),
  };
}

export function canPlaceOnGrid(grid: PlacementGrid, placement: LayoutPlacement): PlacementCheckResult {
  const occupied = new Set(grid.occupiedCells.map((cell) => cell.key));
  const collidingCells = placement.grid_cells.filter((cell) => occupied.has(cellKey(cell)));

  if (collidingCells.length > 0) {
    return { ok: false, reason: 'collision', cells: collidingCells };
  }

  const outOfBoundsCells = placement.grid_cells.filter(
    (cell) => cell.x < 0 || cell.y < 0 || cell.x >= grid.bounds.width || cell.y >= grid.bounds.height,
  );

  if (outOfBoundsCells.length > 0) {
    return { ok: false, reason: 'out-of-bounds', cells: outOfBoundsCells };
  }

  return { ok: true };
}

export function placeOnGrid(grid: PlacementGrid, placement: LayoutPlacement): PlacementGrid {
  const result = canPlaceOnGrid(grid, placement);
  if (result.ok === false) {
    throw new Error(`Cannot place tile '${placement.tile_type_id}': ${result.reason} at ${result.cells.map(cellKey).join(', ')}`);
  }

  return createPlacementGrid(grid.bounds, [...grid.placements, placement]);
}

export function removeFromGrid(grid: PlacementGrid, placementIndex: number): PlacementGrid {
  if (placementIndex < 0 || placementIndex >= grid.placements.length) {
    throw new Error(`Invalid placement index ${placementIndex}; grid has ${grid.placements.length} placements`);
  }

  const nextPlacements = [
    ...grid.placements.slice(0, placementIndex),
    ...grid.placements.slice(placementIndex + 1),
  ];

  return createPlacementGrid(grid.bounds, nextPlacements);
}

export function validateSocketCompatibility(
  grid: PlacementGrid,
  catalog: TileType[],
): SocketCompatibilityResult {
  const issues = getAdjacentSocketPairs(grid, catalog)
    .filter((pair) => pair.fromSocket !== pair.toSocket)
    .map(({ fromPlacementIndex, toPlacementIndex, fromCell, toCell, fromFace, toFace, fromSocket, toSocket }) => ({
      fromPlacementIndex,
      toPlacementIndex,
      fromCell,
      toCell,
      fromFace,
      toFace,
      fromSocket,
      toSocket,
    }));

  return issues.length > 0 ? { ok: false, reason: 'socket-incompatibility', issues } : { ok: true };
}

export function isLayoutConnected(grid: PlacementGrid, catalog: TileType[]): boolean {
  if (grid.placements.length <= 1) {
    return true;
  }

  const adjacency = new Map<number, Set<number>>(
    grid.placements.map((_, placementIndex) => [placementIndex, new Set<number>()]),
  );

  for (const pair of getAdjacentSocketPairs(grid, catalog)) {
    if (pair.fromSocket !== pair.toSocket || pair.fromSocket === 'wall') {
      continue;
    }

    adjacency.get(pair.fromPlacementIndex)?.add(pair.toPlacementIndex);
    adjacency.get(pair.toPlacementIndex)?.add(pair.fromPlacementIndex);
  }

  const visited = new Set<number>();
  const queue = [0];

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined || visited.has(current)) {
      continue;
    }

    visited.add(current);
    for (const next of adjacency.get(current) ?? []) {
      if (!visited.has(next)) {
        queue.push(next);
      }
    }
  }

  return visited.size === grid.placements.length;
}

interface AdjacentSocketPair extends SocketCompatibilityIssue {}

function getAdjacentSocketPairs(grid: PlacementGrid, catalog: TileType[]): AdjacentSocketPair[] {
  const cellsByKey = new Map<string, { cell: GridCell; placementIndex: number }>();
  grid.placements.forEach((placement, placementIndex) => {
    placement.grid_cells.forEach((cell) => cellsByKey.set(cellKey(cell), { cell, placementIndex }));
  });

  const pairs: AdjacentSocketPair[] = [];
  const seen = new Set<string>();

  grid.placements.forEach((placement, placementIndex) => {
    placement.grid_cells.forEach((cell) => {
      for (const direction of CARDINAL_EDGE_FACES) {
        const neighborCell = translateCell(cell, direction);
        const neighbor = cellsByKey.get(cellKey(neighborCell));
        if (!neighbor || neighbor.placementIndex === placementIndex) {
          continue;
        }

        const pairKey = [placementIndex, cellKey(cell), neighbor.placementIndex, cellKey(neighbor.cell)].join('|');
        const reversePairKey = [neighbor.placementIndex, cellKey(neighbor.cell), placementIndex, cellKey(cell)].join('|');
        if (seen.has(pairKey) || seen.has(reversePairKey)) {
          continue;
        }
        seen.add(pairKey);

        const fromFace = direction;
        const toFace = oppositeFace(direction);
        pairs.push({
          fromPlacementIndex: placementIndex,
          toPlacementIndex: neighbor.placementIndex,
          fromCell: cell,
          toCell: neighbor.cell,
          fromFace,
          toFace,
          fromSocket: getPlacementSocket(placement, catalog, fromFace),
          toSocket: getPlacementSocket(grid.placements[neighbor.placementIndex], catalog, toFace),
        });
      }
    });
  });

  return pairs.sort(
    (a, b) =>
      a.fromPlacementIndex - b.fromPlacementIndex ||
      a.toPlacementIndex - b.toPlacementIndex ||
      compareCellKeys(cellKey(a.fromCell), cellKey(b.fromCell)) ||
      compareCellKeys(cellKey(a.toCell), cellKey(b.toCell)),
  );
}

const CARDINAL_EDGE_FACES: CardinalEdgeFace[] = ['north', 'east', 'south', 'west'];

function translateCell(cell: GridCell, direction: CardinalEdgeFace): GridCell {
  switch (direction) {
    case 'north':
      return { x: cell.x, y: cell.y - 1 };
    case 'east':
      return { x: cell.x + 1, y: cell.y };
    case 'south':
      return { x: cell.x, y: cell.y + 1 };
    case 'west':
      return { x: cell.x - 1, y: cell.y };
  }
}

function oppositeFace(face: CardinalEdgeFace): CardinalEdgeFace {
  switch (face) {
    case 'north':
      return 'south';
    case 'east':
      return 'west';
    case 'south':
      return 'north';
    case 'west':
      return 'east';
  }
}

function getPlacementSocket(placement: LayoutPlacement, catalog: TileType[], worldFace: CardinalEdgeFace): SocketType {
  const tile = catalog.find((candidate) => candidate.id === placement.tile_type_id);
  if (!tile) {
    throw new Error(`Tile '${placement.tile_type_id}' not found in catalog`);
  }

  const face = tile.faces.find((candidate) => candidate.face_id === placement.face_id);
  if (!face) {
    throw new Error(`Face '${placement.face_id}' not found on tile '${tile.id}'`);
  }

  const localFace = unrotateEdgeFace(worldFace, placement.rotation);
  const socket = face.edge_sockets.find((candidate) => isCardinalEdgeFace(candidate.face) && candidate.face === localFace);
  if (!socket) {
    throw new Error(`Socket '${localFace}' not found on face '${placement.face_id}' for tile '${tile.id}'`);
  }

  return socket.socket_type;
}

function isCardinalEdgeFace(face: EdgeFace): face is CardinalEdgeFace {
  return CARDINAL_EDGE_FACES.includes(face as CardinalEdgeFace);
}

function unrotateEdgeFace(worldFace: CardinalEdgeFace, rotation: Rotation): CardinalEdgeFace {
  const rotationSteps = rotation / 90;
  const worldIndex = CARDINAL_EDGE_FACES.indexOf(worldFace);
  return CARDINAL_EDGE_FACES[(worldIndex - rotationSteps + CARDINAL_EDGE_FACES.length) % CARDINAL_EDGE_FACES.length];
}

function rotateLocalCell(cell: GridCell, dimensions: TileDimensions, rotation: Rotation): GridCell {
  switch (rotation) {
    case 0:
      return { x: cell.x, y: cell.y };
    case 90:
      return { x: dimensions.height - 1 - cell.y, y: cell.x };
    case 180:
      return { x: dimensions.width - 1 - cell.x, y: dimensions.height - 1 - cell.y };
    case 270:
      return { x: cell.y, y: dimensions.width - 1 - cell.x };
    default: {
      const exhaustive: never = rotation;
      return exhaustive;
    }
  }
}

function indexOccupiedCells(placements: LayoutPlacement[]): OccupiedCellIndex[] {
  return placements
    .flatMap((placement, placementIndex) =>
      placement.grid_cells.map((cell) => ({ key: cellKey(cell), placementIndex })),
    )
    .sort((a, b) => compareCellKeys(a.key, b.key) || a.placementIndex - b.placementIndex);
}

function compareCellKeys(left: string, right: string): number {
  const [leftX, leftY] = left.split(',').map(Number);
  const [rightX, rightY] = right.split(',').map(Number);

  return leftX - rightX || leftY - rightY;
}
