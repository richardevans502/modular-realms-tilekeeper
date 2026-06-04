import type { GridCell, LayoutPlacement, Rotation, TileDimensions, TileType } from '../shared/types';

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
