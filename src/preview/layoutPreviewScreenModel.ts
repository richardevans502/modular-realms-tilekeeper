import type { EdgeFace, GridCell, Layout, LayoutPlacement, Rotation, SocketType, TileCategory, TileFace, TileType } from '../shared/types';
import { CATEGORY_COLORS, buildSchematicPreviewModel, type SchematicPreviewModel, type SchematicPreviewOptions } from './schematicPreview';

export interface LayoutPreviewPoint {
  x: number;
  y: number;
}

export interface LayoutPreviewViewport {
  width: number;
  height: number;
  pan: LayoutPreviewPoint;
  zoom: number;
}

export interface LayoutPreviewTransform {
  translateX: number;
  translateY: number;
  scale: number;
}

export interface LayoutPreviewSummary {
  id: string;
  goal: string;
  placementCount: number;
}

export interface LayoutPreviewLegendItem {
  category: TileCategory;
  color: string;
  label: string;
}

export interface LayoutPreviewTileInspection {
  placementIndex: number;
  tileTypeId: string;
  tileName: string;
  faceId: string;
  faceName: string;
  category: TileType['category'];
  productSet: string;
  rotation: Rotation;
  occupiedCells: GridCell[];
  sockets: LayoutPreviewSocketInspection[];
  tags: string[];
}

export interface LayoutPreviewSocketInspection {
  face: EdgeFace;
  socketType: SocketType;
  reason: string;
}

export interface LayoutPreviewScreenModel {
  title: 'Layout Preview';
  layoutSummary: LayoutPreviewSummary;
  viewport: LayoutPreviewViewport;
  contentTransform: LayoutPreviewTransform;
  schematic: SchematicPreviewModel;
  legend: LayoutPreviewLegendItem[];
  selectedTile: LayoutPreviewTileInspection | null;
}

export interface LayoutPreviewScreenOptions extends SchematicPreviewOptions {
  viewportWidth?: number;
  viewportHeight?: number;
  pan?: LayoutPreviewPoint;
  zoom?: number;
  selectedPlacementIndex?: number | null;
}

const DEFAULT_VIEWPORT_WIDTH = 360;
const DEFAULT_VIEWPORT_HEIGHT = 640;
const DEFAULT_PAN: LayoutPreviewPoint = { x: 0, y: 0 };
const DEFAULT_ZOOM = 1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;

export function buildLayoutPreviewScreenModel(
  layout: Layout,
  catalog: TileType[],
  options: LayoutPreviewScreenOptions = {},
): LayoutPreviewScreenModel {
  const viewport = normalizeViewport({
    width: options.viewportWidth ?? DEFAULT_VIEWPORT_WIDTH,
    height: options.viewportHeight ?? DEFAULT_VIEWPORT_HEIGHT,
    pan: options.pan ?? DEFAULT_PAN,
    zoom: options.zoom ?? DEFAULT_ZOOM,
  });

  const schematic = buildSchematicPreviewModel(layout.placements, catalog, {
    cellSize: options.cellSize,
    padding: options.padding,
    showGrid: options.showGrid ?? true,
  });

  return {
    title: 'Layout Preview',
    layoutSummary: {
      id: layout.id,
      goal: layout.goal,
      placementCount: layout.placements.length,
    },
    viewport,
    contentTransform: transformFromViewport(viewport),
    schematic,
    legend: buildLegend(schematic.tiles.map((tile) => tile.category)),
    selectedTile:
      options.selectedPlacementIndex === null || options.selectedPlacementIndex === undefined
        ? null
        : buildTileInspection(layout.placements[options.selectedPlacementIndex], options.selectedPlacementIndex, catalog),
  };
}

export function panLayoutPreview(viewport: LayoutPreviewViewport, delta: LayoutPreviewPoint): LayoutPreviewViewport {
  return normalizeViewport({
    ...viewport,
    pan: {
      x: viewport.pan.x + delta.x,
      y: viewport.pan.y + delta.y,
    },
  });
}

export function zoomLayoutPreview(viewport: LayoutPreviewViewport, zoomMultiplier: number): LayoutPreviewViewport {
  return normalizeViewport({ ...viewport, zoom: viewport.zoom * zoomMultiplier });
}

export function inspectTileAtGridCell(
  layout: Layout,
  catalog: TileType[],
  gridCell: GridCell,
  options: Omit<LayoutPreviewScreenOptions, 'selectedPlacementIndex'> = {},
): LayoutPreviewScreenModel | null {
  const placementIndex = layout.placements.findIndex((placement) =>
    placement.grid_cells.some((cell) => cell.x === gridCell.x && cell.y === gridCell.y),
  );

  if (placementIndex === -1) {
    return null;
  }

  return buildLayoutPreviewScreenModel(layout, catalog, { ...options, selectedPlacementIndex: placementIndex });
}

export function selectTileByPlacementIndex(
  layout: Layout,
  catalog: TileType[],
  placementIndex: number,
  options: Omit<LayoutPreviewScreenOptions, 'selectedPlacementIndex'> = {},
): LayoutPreviewScreenModel | null {
  if (placementIndex < 0 || placementIndex >= layout.placements.length) {
    return null;
  }

  return buildLayoutPreviewScreenModel(layout, catalog, { ...options, selectedPlacementIndex: placementIndex });
}

function buildLegend(categories: TileCategory[]): LayoutPreviewLegendItem[] {
  const seen = new Set<TileCategory>();
  return categories
    .filter((category) => {
      if (seen.has(category)) {
        return false;
      }
      seen.add(category);
      return true;
    })
    .map((category) => ({ category, color: CATEGORY_COLORS[category], label: labelForCategory(category) }));
}

function labelForCategory(category: TileCategory): string {
  switch (category) {
    case 'floor':
      return 'Floor';
    case 'wall':
      return 'Wall';
    case 'doorway':
      return 'Doorway';
    case 'scatter':
      return 'Scatter';
    case 'custom':
      return 'Custom';
  }
}

function normalizeViewport(viewport: LayoutPreviewViewport): LayoutPreviewViewport {
  return {
    width: viewport.width,
    height: viewport.height,
    pan: clampPan(viewport.pan, viewport.width, viewport.height),
    zoom: clamp(viewport.zoom, MIN_ZOOM, MAX_ZOOM),
  };
}

function clampPan(pan: LayoutPreviewPoint, viewportWidth: number, viewportHeight: number): LayoutPreviewPoint {
  return {
    x: clamp(pan.x, -viewportWidth, viewportWidth),
    y: clamp(pan.y, -viewportHeight, viewportHeight),
  };
}

function transformFromViewport(viewport: LayoutPreviewViewport): LayoutPreviewTransform {
  return {
    translateX: viewport.pan.x,
    translateY: viewport.pan.y,
    scale: viewport.zoom,
  };
}

function buildTileInspection(
  placement: LayoutPlacement | undefined,
  placementIndex: number,
  catalog: TileType[],
): LayoutPreviewTileInspection | null {
  if (!placement) {
    return null;
  }

  const tile = catalog.find((candidate) => candidate.id === placement.tile_type_id);
  if (!tile) {
    throw new Error(`Tile '${placement.tile_type_id}' not found in catalog`);
  }

  const face = tile.faces.find((candidate) => candidate.face_id === placement.face_id);
  if (!face) {
    throw new Error(`Face '${placement.face_id}' not found on tile '${tile.id}'`);
  }

  return {
    placementIndex,
    tileTypeId: tile.id,
    tileName: tile.name,
    faceId: face.face_id,
    faceName: face.face_name,
    category: tile.category,
    productSet: tile.product_set,
    rotation: placement.rotation,
    occupiedCells: placement.grid_cells.map((cell) => ({ ...cell })),
    sockets: buildSocketInspection(face),
    tags: [...tile.tags],
  };
}

function buildSocketInspection(face: TileFace): LayoutPreviewSocketInspection[] {
  return face.edge_sockets.map((socket) => ({
    face: socket.face,
    socketType: socket.socket_type,
    reason: socket.reason,
  }));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
