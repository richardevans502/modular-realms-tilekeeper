import type { EdgeFace, GridCell, LayoutPlacement, Rotation, SocketType, TileCategory, TileFace, TileType } from '../shared/types';

export interface SchematicPreviewOptions {
  cellSize?: number;
  padding?: number;
  showGrid?: boolean;
  visibleGridBounds?: Pick<SchematicPreviewBounds, 'minX' | 'minY' | 'maxX' | 'maxY'>;
  detailCellThreshold?: number;
}

export interface SchematicPreviewBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export interface SchematicPreviewGridCell {
  key: string;
  grid: GridCell;
  x: number;
  y: number;
}

export interface SchematicPreviewSocketSegment {
  face: CardinalFace;
  socketType: SocketType;
  compatibility: SocketCompatibility;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface SchematicPreviewTile {
  key: string;
  placementIndex: number;
  tileTypeId: string;
  faceId: string;
  label: string;
  category: TileCategory;
  rotation: Rotation;
  color: string;
  cells: SchematicPreviewGridCell[];
  sockets: SchematicPreviewSocketSegment[];
  labelAnchor: { x: number; y: number };
  simplified: boolean;
}


export interface SchematicPreviewModel {
  width: number;
  height: number;
  origin: GridCell;
  cellSize: number;
  padding: number;
  bounds: SchematicPreviewBounds;
  gridCells: SchematicPreviewGridCell[];
  tiles: SchematicPreviewTile[];
  deferredTileCount: number;
  simplifiedTileCount: number;
}


type CardinalFace = 'north' | 'east' | 'south' | 'west';
export type SocketCompatibility = 'compatible' | 'incompatible';

const DEFAULT_CELL_SIZE = 32;
const DEFAULT_PADDING = 12;
export const CATEGORY_COLORS: Record<TileCategory, string> = {
  floor: '#7dd3fc',
  wall: '#c4b5fd',
  scatter: '#86efac',
  doorway: '#fde68a',
  custom: '#f0abfc',
};
const SOCKET_STROKES: Record<SocketType, string> = {
  wall: '#334155',
  doorway: '#f59e0b',
  'open-floor': '#22c55e',
};
const SOCKET_COMPATIBILITY_STROKES: Record<SocketCompatibility, string> = {
  compatible: '#22c55e',
  incompatible: '#ef4444',
};
const CARDINAL_FACES: CardinalFace[] = ['north', 'east', 'south', 'west'];
const DEFAULT_DETAIL_CELL_THRESHOLD = 12;

export function buildSchematicPreviewModel(
  placements: LayoutPlacement[],
  catalog: TileType[],
  options: SchematicPreviewOptions = {},
): SchematicPreviewModel {
  const cellSize = options.cellSize ?? DEFAULT_CELL_SIZE;
  const padding = options.padding ?? DEFAULT_PADDING;
  const bounds = calculateBounds(placements);
  const origin = { x: bounds.minX, y: bounds.minY };
  const catalogById = new Map(catalog.map((tile) => [tile.id, tile]));
  const gridCells = buildGridCells(bounds, origin, cellSize, padding);
  const gridCellByKey = new Map(gridCells.map((cell) => [cell.key, cell]));
  const placementContexts = buildPlacementSocketContexts(placements, catalogById);
  const cellOwners = buildCellOwners(placements);
  const visiblePlacements = placements
    .map((placement, placementIndex) => ({ placement, placementIndex }))
    .filter(({ placement }) => placementIntersectsBounds(placement, options.visibleGridBounds));
  const detailCellThreshold = options.detailCellThreshold ?? DEFAULT_DETAIL_CELL_THRESHOLD;

  return {
    width: bounds.width * cellSize,
    height: (bounds.height + 1) * cellSize,
    origin,
    cellSize,
    padding,
    bounds,
    gridCells,
    deferredTileCount: placements.length - visiblePlacements.length,
    simplifiedTileCount: visiblePlacements.filter(({ placement }) => placement.grid_cells.length > detailCellThreshold).length,
    tiles: visiblePlacements.map(({ placement, placementIndex }) => {
      const tile = catalogById.get(placement.tile_type_id);
      if (!tile) {
        throw new Error(`Tile '${placement.tile_type_id}' not found in catalog`);
      }

      const face = tile.faces.find((candidate) => candidate.face_id === placement.face_id);
      if (!face) {
        throw new Error(`Face '${placement.face_id}' not found on tile '${tile.id}'`);
      }

      const cells = placement.grid_cells.map((cell) => {
        const previewCell = gridCellByKey.get(cellKey(cell));
        if (!previewCell) {
          throw new Error(`Placement cell '${cellKey(cell)}' falls outside schematic bounds`);
        }
        return previewCell;
      });

      return {
        key: `${placementIndex}:${placement.tile_type_id}:${placement.face_id}`,
        placementIndex,
        tileTypeId: placement.tile_type_id,
        faceId: placement.face_id,
        label: tile.name,
        category: tile.category,
        rotation: placement.rotation,
        color: CATEGORY_COLORS[tile.category],
        cells,
        sockets: placement.grid_cells.length > detailCellThreshold ? [] : buildSocketSegments(face, placement.rotation, cells, cellSize, placementIndex, placement, placementContexts, cellOwners),
        labelAnchor: calculateLabelAnchor(cells, cellSize),
        simplified: placement.grid_cells.length > detailCellThreshold,
      };
    }),
  };
}

export function renderSchematicPreviewSvg(
  placements: LayoutPlacement[],
  catalog: TileType[],
  options: SchematicPreviewOptions = {},
): string {
  const model = buildSchematicPreviewModel(placements, catalog, options);
  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${model.width}" height="${model.height}" viewBox="0 0 ${model.width} ${model.height}" role="img" aria-label="TileKeeper schematic preview: ${model.tiles.length} placements">`,
    '<style>.grid-cell{fill:none;stroke:#cbd5e1;stroke-width:1}.tile-cell{stroke:#0f172a;stroke-width:1}.tile-cell-simplified{opacity:.75}.tile-label{font:600 10px sans-serif;fill:#0f172a;pointer-events:none}.socket-wall{stroke:#334155}.socket-doorway{stroke:#f59e0b}.socket-open-floor{stroke:#22c55e}</style>',
  ];

  if (options.showGrid ?? false) {
    parts.push(
      ...model.gridCells.map(
        (cell) =>
          `<rect class="grid-cell" data-grid-x="${cell.grid.x}" data-grid-y="${cell.grid.y}" x="${cell.x}" y="${cell.y}" width="${model.cellSize}" height="${model.cellSize}"/>`,
      ),
    );
  }

  for (const tile of model.tiles) {
    parts.push(
      ...tile.cells.map(
        (cell) =>
          `<rect class="tile-cell${tile.simplified ? ' tile-cell-simplified' : ''}" data-placement-index="${tile.placementIndex}" data-tile-type-id="${escapeAttribute(tile.tileTypeId)}" data-face-id="${escapeAttribute(tile.faceId)}" x="${cell.x}" y="${cell.y}" width="${model.cellSize}" height="${model.cellSize}" rx="3" fill="${tile.color}"/>`,
      ),
    );
    parts.push(
      ...tile.sockets.map(
        (socket) =>
          `<line class="socket socket-${socket.socketType} socket-${socket.compatibility}" data-placement-index="${tile.placementIndex}" data-face="${socket.face}" data-compatibility="${socket.compatibility}" x1="${socket.x1}" y1="${socket.y1}" x2="${socket.x2}" y2="${socket.y2}" stroke="${SOCKET_COMPATIBILITY_STROKES[socket.compatibility] ?? SOCKET_STROKES[socket.socketType]}" stroke-width="4" stroke-linecap="round"/>`,
      ),
    );
    parts.push(renderRotationMarker(tile));
    parts.push(
      `<text class="tile-label" x="${tile.labelAnchor.x}" y="${tile.labelAnchor.y}" text-anchor="middle" dominant-baseline="central">${escapeText(tile.label)}</text>`,
    );
  }

  parts.push('</svg>');
  return parts.join('');
}


function placementIntersectsBounds(
  placement: LayoutPlacement,
  visibleBounds: Pick<SchematicPreviewBounds, 'minX' | 'minY' | 'maxX' | 'maxY'> | undefined,
): boolean {
  if (!visibleBounds) return true;
  return placement.grid_cells.some(
    (cell) => cell.x >= visibleBounds.minX && cell.x <= visibleBounds.maxX && cell.y >= visibleBounds.minY && cell.y <= visibleBounds.maxY,
  );
}

function calculateBounds(placements: LayoutPlacement[]): SchematicPreviewBounds {
  const cells = placements.flatMap((placement) => placement.grid_cells);
  if (cells.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 1, height: 1 };
  }

  const xs = cells.map((cell) => cell.x);
  const ys = cells.map((cell) => cell.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return { minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

function buildGridCells(
  bounds: SchematicPreviewBounds,
  origin: GridCell,
  cellSize: number,
  padding: number,
): SchematicPreviewGridCell[] {
  const cells: SchematicPreviewGridCell[] = [];
  for (let y = bounds.minY; y <= bounds.maxY; y += 1) {
    for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
      cells.push({
        key: cellKey({ x, y }),
        grid: { x, y },
        x: padding + (x - origin.x) * cellSize,
        y: padding + (y - origin.y) * cellSize,
      });
    }
  }
  return cells;
}

function buildSocketSegments(
  face: TileFace,
  rotation: Rotation,
  cells: SchematicPreviewGridCell[],
  cellSize: number,
  placementIndex: number,
  placement: LayoutPlacement,
  placementContexts: PlacementSocketContext[],
  cellOwners: Map<string, number>,
): SchematicPreviewSocketSegment[] {
  const extents = calculatePixelExtents(cells, cellSize);
  return face.edge_sockets
    .map((socket) => ({ ...socket, face: rotateFace(socket.face, rotation) }))
    .filter((socket): socket is typeof socket & { face: CardinalFace } => socket.face !== null)
    .map((socket) => ({
      face: socket.face,
      socketType: socket.socket_type,
      compatibility: determineSocketCompatibility(socket.face, socket.socket_type, placementIndex, placement, placementContexts, cellOwners),
      ...edgeSegmentForFace(socket.face, extents),
    }));
}

interface PlacementSocketContext {
  socketsByFace: Map<CardinalFace, SocketType>;
}

function buildPlacementSocketContexts(placements: LayoutPlacement[], catalogById: Map<string, TileType>): PlacementSocketContext[] {
  return placements.map((placement) => {
    const tile = catalogById.get(placement.tile_type_id);
    const face = tile?.faces.find((candidate) => candidate.face_id === placement.face_id);
    const socketsByFace = new Map<CardinalFace, SocketType>();
    for (const socket of face?.edge_sockets ?? []) {
      const rotatedFace = rotateFace(socket.face, placement.rotation);
      if (rotatedFace) {
        socketsByFace.set(rotatedFace, socket.socket_type);
      }
    }
    return { socketsByFace };
  });
}

function buildCellOwners(placements: LayoutPlacement[]): Map<string, number> {
  const owners = new Map<string, number>();
  placements.forEach((placement, placementIndex) => {
    placement.grid_cells.forEach((cell) => owners.set(cellKey(cell), placementIndex));
  });
  return owners;
}

function determineSocketCompatibility(
  face: CardinalFace,
  socketType: SocketType,
  placementIndex: number,
  placement: LayoutPlacement,
  placementContexts: PlacementSocketContext[],
  cellOwners: Map<string, number>,
): SocketCompatibility {
  const neighborIndex = findNeighborPlacementIndex(placement, placementIndex, face, cellOwners);
  if (neighborIndex === null) {
    return socketType === 'wall' ? 'compatible' : 'incompatible';
  }

  const oppositeSocketType = placementContexts[neighborIndex]?.socketsByFace.get(oppositeFace(face));
  return oppositeSocketType === socketType ? 'compatible' : 'incompatible';
}

function findNeighborPlacementIndex(
  placement: LayoutPlacement,
  placementIndex: number,
  face: CardinalFace,
  cellOwners: Map<string, number>,
): number | null {
  const delta = deltaForFace(face);
  for (const cell of placement.grid_cells) {
    const owner = cellOwners.get(cellKey({ x: cell.x + delta.x, y: cell.y + delta.y }));
    if (owner !== undefined && owner !== placementIndex) {
      return owner;
    }
  }
  return null;
}

function deltaForFace(face: CardinalFace): GridCell {
  switch (face) {
    case 'north':
      return { x: 0, y: -1 };
    case 'east':
      return { x: 1, y: 0 };
    case 'south':
      return { x: 0, y: 1 };
    case 'west':
      return { x: -1, y: 0 };
  }
}

function oppositeFace(face: CardinalFace): CardinalFace {
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

function calculatePixelExtents(cells: SchematicPreviewGridCell[], cellSize: number): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  return {
    minX: Math.min(...cells.map((cell) => cell.x)),
    minY: Math.min(...cells.map((cell) => cell.y)),
    maxX: Math.max(...cells.map((cell) => cell.x)) + cellSize,
    maxY: Math.max(...cells.map((cell) => cell.y)) + cellSize,
  };
}

function edgeSegmentForFace(
  face: CardinalFace,
  extents: { minX: number; minY: number; maxX: number; maxY: number },
): { x1: number; y1: number; x2: number; y2: number } {
  switch (face) {
    case 'north':
      return { x1: extents.minX, y1: extents.minY, x2: extents.maxX, y2: extents.minY };
    case 'east':
      return { x1: extents.maxX, y1: extents.minY, x2: extents.maxX, y2: extents.maxY };
    case 'south':
      return { x1: extents.minX, y1: extents.maxY, x2: extents.maxX, y2: extents.maxY };
    case 'west':
      return { x1: extents.minX, y1: extents.minY, x2: extents.minX, y2: extents.maxY };
  }
}

function calculateLabelAnchor(cells: SchematicPreviewGridCell[], cellSize: number): { x: number; y: number } {
  const extents = calculatePixelExtents(cells, cellSize);
  return {
    x: (extents.minX + extents.maxX) / 2,
    y: (extents.minY + extents.maxY) / 2,
  };
}

function renderRotationMarker(tile: SchematicPreviewTile): string {
  const marker = rotationMarkerPoints(tile.labelAnchor, tile.rotation);
  return `<path class="rotation-marker" data-placement-index="${tile.placementIndex}" d="M ${marker[0].x} ${marker[0].y} L ${marker[1].x} ${marker[1].y} L ${marker[2].x} ${marker[2].y}" fill="none" stroke="#0f172a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function rotationMarkerPoints(anchor: { x: number; y: number }, rotation: Rotation): Array<{ x: number; y: number }> {
  const offset = 7;
  const half = 4;
  switch (rotation) {
    case 0:
      return [
        { x: anchor.x - half, y: anchor.y + offset },
        { x: anchor.x, y: anchor.y },
        { x: anchor.x + half, y: anchor.y + offset },
      ];
    case 90:
      return [
        { x: anchor.x, y: anchor.y - offset },
        { x: anchor.x + half, y: anchor.y },
        { x: anchor.x, y: anchor.y + offset },
      ];
    case 180:
      return [
        { x: anchor.x - half, y: anchor.y - offset },
        { x: anchor.x, y: anchor.y },
        { x: anchor.x + half, y: anchor.y - offset },
      ];
    case 270:
      return [
        { x: anchor.x, y: anchor.y - offset },
        { x: anchor.x - half, y: anchor.y },
        { x: anchor.x, y: anchor.y + offset },
      ];
  }
}

function rotateFace(face: EdgeFace, rotation: Rotation): CardinalFace | null {
  if (!isCardinalFace(face)) {
    return null;
  }
  const currentIndex = CARDINAL_FACES.indexOf(face);
  const quarterTurns = rotation / 90;
  return CARDINAL_FACES[(currentIndex + quarterTurns) % CARDINAL_FACES.length];
}

function isCardinalFace(face: EdgeFace): face is CardinalFace {
  return CARDINAL_FACES.includes(face as CardinalFace);
}

function cellKey(cell: GridCell): string {
  return `${cell.x},${cell.y}`;
}

function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttribute(value: string): string {
  return escapeText(value).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
